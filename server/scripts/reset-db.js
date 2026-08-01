import { prisma } from '../src/db/postgres.js';

console.log('🗑️  Clearing all data...');

// Delete in dependency order
await prisma.rental.deleteMany({});
await prisma.order.deleteMany({});
await prisma.product.deleteMany({});
await prisma.user.deleteMany({});

console.log('✅ All tables cleared.');
await prisma.$disconnect();
