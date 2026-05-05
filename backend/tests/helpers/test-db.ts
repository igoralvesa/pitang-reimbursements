import bcrypt from 'bcryptjs';

import { prisma } from '../../src/core/prisma';
import { defaultPassword, seedDefaultUsers } from '../../src/core/seed';
import { Role } from '../../src/types/roles-enum';

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

export async function resetDatabase() {
  assertTestDatabase();

  await prisma.reimbursementHistory.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.reimbursementRequest.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

export async function prepareDatabase() {
  await resetDatabase();
  await seedDefaultUsers();
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export async function createUserFixture({
  email,
  name = 'Usuário Teste',
  role = Role.COLLABORATOR,
}: {
  email: string;
  name?: string;
  role?: Role;
}) {
  return prisma.user.create({
    data: {
      email,
      name,
      passwordHash: bcrypt.hashSync(defaultPassword, 10),
      role,
    },
  });
}
