import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/db/postgres.js';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe!123';
  const name = process.env.ADMIN_NAME || 'Super Admin';
  if (!email) { console.error('Set ADMIN_EMAIL'); process.exit(1); }

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 12);

  if (!user) {
    await prisma.user.create({ 
      data: {
        email, 
        name, 
        passwordHash, 
        role: 'admin',
        isEmailVerified: true  // Admin users should be pre-verified
      }
    });
    console.log(`Created admin ${email}`);
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'admin',
        passwordHash,
        isEmailVerified: true
      }
    });
    console.log(`Updated existing user ${email} to admin`);
  }

  await prisma.$disconnect();
}
main().catch(err => { console.error(err); process.exit(1); });
