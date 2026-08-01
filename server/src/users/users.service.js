import { prisma } from '../db/postgres.js';

export const UsersService = {

  // List all users (admin use) with optional filters
  async list({ role, search, page = 1, limit = 20 } = {}) {
    const where = {};

    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (Math.max(1, +page) - 1) * Math.max(1, +limit);
    const take = Math.max(1, +limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users: users.map(this._publicUser),
      total,
      page: +page,
      limit: +limit
    };
  },

  // Get a single user by ID
  async getById(id) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');
    return this._publicUser(user);
  },

  // Update a user's role (admin only)
  async updateRole(id, role) {
    if (!['admin', 'customer'].includes(role)) {
      throw new Error('Invalid role. Must be "admin" or "customer"');
    }
    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });
    return this._publicUser(user);
  },

  // Update user profile (name) — for the user themselves
  async updateProfile(id, { name }) {
    if (!name || !name.trim()) throw new Error('Name cannot be empty');
    const user = await prisma.user.update({
      where: { id },
      data: { name: name.trim() }
    });
    return this._publicUser(user);
  },

  // Update user default address
  async updateAddress(id, { addressLine1, addressLine2, city, state, pincode }) {
    const user = await prisma.user.update({
      where: { id },
      data: {
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null
      }
    });
    return this._publicUser(user);
  },

  // Delete a customer user (admin only; cannot delete admins or self)
  async delete(targetId, requestingUserId) {
    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new Error('User not found');
    if (user.role === 'admin') throw new Error('Cannot delete admin users');
    if (user.id === requestingUserId) throw new Error('Cannot delete your own account');
    
    await prisma.user.delete({ where: { id: targetId } });
    return { message: 'User deleted successfully' };
  },

  // Get user count stats (admin dashboard)
  async getStats() {
    const [total, customers, admins, verified] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.user.count({ where: { isEmailVerified: true } })
    ]);
    return { total, customers, admins, verified };
  },

  // Strip private fields before sending to client
  _publicUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      addressLine1: user.addressLine1,
      addressLine2: user.addressLine2,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      createdAt: user.createdAt
    };
  }
};
