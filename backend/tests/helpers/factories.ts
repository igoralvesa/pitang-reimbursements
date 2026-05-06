import bcrypt from 'bcryptjs';

import { ReimbursementStatus } from '../../generated/prisma/client';
import { defaultPassword } from '../../src/core/seed';
import { prisma } from '../../src/core/prisma';
import { Role } from '../../src/types/roles-enum';

const roleEmails: Record<Role, string> = {
  [Role.ADMIN]: 'admin@email.com',
  [Role.COLLABORATOR]: 'colaborador@email.com',
  [Role.FINANCE]: 'financeiro@email.com',
  [Role.MANAGER]: 'gestor@email.com',
};

export async function getSeedUser(emailOrRole: string | Role) {
  const email = Object.values(Role).includes(emailOrRole as Role)
    ? roleEmails[emailOrRole as Role]
    : emailOrRole;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error(`Seed user ${email} not found`);
  }

  return user;
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

export async function createCategoryFixture({
  active = true,
  name,
}: {
  active?: boolean;
  name?: string;
} = {}) {
  return prisma.category.create({
    data: {
      active,
      name: name ?? (active ? 'Transporte' : 'Categoria Inativa'),
    },
  });
}

export async function createReimbursementFixture({
  categoryId,
  requesterId,
  status = ReimbursementStatus.DRAFT,
}: {
  categoryId?: string;
  requesterId?: string;
  status?: ReimbursementStatus;
} = {}) {
  const category = categoryId
    ? null
    : await createCategoryFixture();
  const requester = requesterId
    ? null
    : await getSeedUser(Role.COLLABORATOR);

  return prisma.reimbursementRequest.create({
    data: {
      amount: 50,
      categoryId: categoryId ?? category!.id,
      description: 'Táxi para reunião',
      expenseDate: new Date('2026-05-01T00:00:00.000Z'),
      requesterId: requesterId ?? requester!.id,
      status,
    },
  });
}

export async function createDraftReimbursementFixture(
  data: Omit<Parameters<typeof createReimbursementFixture>[0], 'status'> = {},
) {
  return createReimbursementFixture({
    ...data,
    status: ReimbursementStatus.DRAFT,
  });
}

export async function createSubmittedReimbursementFixture(
  data: Omit<Parameters<typeof createReimbursementFixture>[0], 'status'> = {},
) {
  return createReimbursementFixture({
    ...data,
    status: ReimbursementStatus.SUBMITTED,
  });
}

export async function createApprovedReimbursementFixture(
  data: Omit<Parameters<typeof createReimbursementFixture>[0], 'status'> = {},
) {
  return createReimbursementFixture({
    ...data,
    status: ReimbursementStatus.APPROVED,
  });
}

export async function createRejectedReimbursementFixture(
  data: Omit<Parameters<typeof createReimbursementFixture>[0], 'status'> = {},
) {
  return createReimbursementFixture({
    ...data,
    status: ReimbursementStatus.REJECTED,
  });
}

export async function createPaidReimbursementFixture(
  data: Omit<Parameters<typeof createReimbursementFixture>[0], 'status'> = {},
) {
  return createReimbursementFixture({
    ...data,
    status: ReimbursementStatus.PAID,
  });
}
