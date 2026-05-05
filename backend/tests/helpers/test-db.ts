import bcrypt from 'bcryptjs';

import { prisma } from '../../src/core/prisma';
import { defaultPassword, seedDefaultUsers } from '../../src/core/seed';

export async function resetDatabase() {
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
  role = 'COLLABORATOR',
}: {
  email: string;
  name?: string;
  role?: 'ADMIN' | 'COLLABORATOR' | 'FINANCE' | 'MANAGER';
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
