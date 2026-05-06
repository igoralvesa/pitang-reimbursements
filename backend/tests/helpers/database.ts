import { prisma } from '../../src/core/prisma';
import { seedDefaultUsers } from '../../src/core/seed';

function assertTestDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined. Tests were stopped.');
  }

  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, '');

  if (!/test/i.test(databaseName)) {
    throw new Error(
      `Refusing to reset non-test database "${databaseName}". DATABASE_URL must point to a test database.`,
    );
  }
}

export async function cleanDatabase() {
  assertTestDatabase();

  await prisma.reimbursementHistory.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.reimbursementRequest.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedRequiredData() {
  await seedDefaultUsers();
}

export async function prepareDatabase() {
  await cleanDatabase();
  await seedRequiredData();
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
