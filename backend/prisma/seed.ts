import { prisma } from '../src/core/prisma';
import { seedDefaultData } from '../src/core/seed';

await seedDefaultData();
await prisma.$disconnect();
