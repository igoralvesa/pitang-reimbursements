import { prisma } from '../src/core/prisma';
import { seedDefaultUsers } from '../src/core/seed';

await seedDefaultUsers();
await prisma.$disconnect();
