import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../db/postgres.js';
import { config } from '../config/configuration.js';
import { OTPService } from './otp.service.js';

function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessTtlSec });
}
function signRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshTtlSec });
}

export const AuthService = {
  async validateCredentials({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid email or password');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error('Invalid email or password');
    return user;
  },

  async register({ name, email, password }) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error('Email already in use');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ 
      data: {
        name, 
        email, 
        passwordHash,
        isEmailVerified: false 
      }
    });
    
    // Generate OTP for email verification
    await OTPService.generateOTP(email);
    
    return { 
      user: this._publicUser(user), 
      message: 'Registration successful. Please verify your email with the OTP sent.',
      requiresVerification: true 
    };
  },

  async login({ email, password }) {
    const user = await this.validateCredentials({ email, password });
    
    // Simple login - no email verification required
    const tokens = await this._issueTokens(user);
    return { user: this._publicUser(user), ...tokens };
  },

  async verifyEmail({ email, otp }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');
    
    if (user.isEmailVerified) {
      throw new Error('Email is already verified');
    }
    
    // Verify OTP
    await OTPService.verifyOTP(email, otp);
    
    // Mark email as verified and issue tokens
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true }
    });
    
    const tokens = await this._issueTokens(updatedUser);
    return { 
      user: this._publicUser(updatedUser), 
      message: 'Email verified successfully',
      ...tokens 
    };
  },

  async resendOTP({ email }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');
    
    if (user.isEmailVerified) {
      throw new Error('Email is already verified');
    }
    
    return await OTPService.generateOTP(email);
  },

  async requestPasswordReset({ email }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpires
      }
    });
    
    // Generate OTP for password reset
    await OTPService.generateOTP(email);
    
    return { 
      message: 'Password reset OTP sent to your email',
      resetToken
    };
  },

  async resetPassword({ email, otp, newPassword, resetToken }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');
    
    if (!user.passwordResetToken || !user.passwordResetExpires) {
      throw new Error('Invalid or expired reset token');
    }
    
    if (new Date() > user.passwordResetExpires) {
      throw new Error('Reset token has expired');
    }
    
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    if (hashedToken !== user.passwordResetToken) {
      throw new Error('Invalid reset token');
    }
    
    // Verify OTP
    await OTPService.verifyOTP(email, otp);
    
    // Update password
    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        refreshTokenHash: null // Invalidate all sessions
      }
    });
    
    return { message: 'Password reset successfully' };
  },

  async issueFor(user) {
    const tokens = await this._issueTokens(user);
    return { user: this._publicUser(user), ...tokens };
  },

  async refresh(userId, refreshToken) {
    if (!userId) throw new Error('Invalid refresh token');
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      if (decoded.sub !== userId) throw new Error('Invalid refresh token');
    } catch {
      throw new Error('Invalid refresh token');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const incomingHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    if (!user.refreshTokenHash || user.refreshTokenHash !== incomingHash) {
      throw new Error('Refresh token mismatch');
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const newRefreshToken = signRefreshToken({ sub: user.id });

    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: newHash }
    });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(userId) {
    if (!userId) return;
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHash: null }
      });
    } catch (err) {
      // Ignore errors during logout if user doesn't exist
    }
  },

  _publicUser(user) {
    return { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      addressLine1: user.addressLine1,
      addressLine2: user.addressLine2,
      city: user.city,
      state: user.state,
      pincode: user.pincode
    };
  },

  async _issueTokens(user) {
    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id });
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: hash }
    });
    return { accessToken, refreshToken };
  }
};
