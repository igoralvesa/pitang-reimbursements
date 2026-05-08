import bcrypt from 'bcryptjs';

import {
  ReimbursementHistoryAction,
  ReimbursementStatus,
} from '../../generated/prisma/client';
import { logger } from './Logger';
import { prisma } from './prisma';
import { Role } from '../types/roles-enum';

const seedUsers = [
  {
    email: 'admin@email.com',
    name: 'Admin',
    role: Role.ADMIN,
  },
  {
    email: 'colaborador@email.com',
    name: 'Colaborador',
    role: Role.COLLABORATOR,
  },
  {
    email: 'gestor@email.com',
    name: 'Gestor',
    role: Role.MANAGER,
  },
  {
    email: 'financeiro@email.com',
    name: 'Financeiro',
    role: Role.FINANCE,
  },
] as const;

const defaultPassword = 'Senha@123';
const defaultCategory = {
  active: true,
  name: 'Transporte',
} as const;

const seedCategories = [
  defaultCategory,
  { active: true, name: 'Alimentação' },
  { active: true, name: 'Hospedagem' },
  { active: true, name: 'Combustível' },
  { active: true, name: 'Estacionamento' },
  { active: true, name: 'Pedágio' },
  { active: true, name: 'Material de escritório' },
  { active: true, name: 'Internet' },
  { active: true, name: 'Telefone' },
  { active: true, name: 'Passagens aéreas' },
  { active: true, name: 'Treinamentos' },
  { active: true, name: 'Eventos' },
  { active: true, name: 'Manutenção' },
] as const;

const defaultReimbursement = {
  amount: 50,
  description: 'Táxi para reunião com cliente',
  expenseDate: new Date('2026-05-01T00:00:00.000Z'),
  historyObservation: 'Solicitação padrão criada pelo seed',
  status: ReimbursementStatus.DRAFT,
} as const;

export async function seedDefaultUsers() {
  const passwordHash = bcrypt.hashSync(defaultPassword, 10);

  await Promise.all(
    seedUsers.map((user) =>
      prisma.user.upsert({
        create: {
          ...user,
          passwordHash,
        },
        update: {
          name: user.name,
          role: user.role,
        },
        where: {
          email: user.email,
        },
      }),
    ),
  );

  logger.info(
    { users: seedUsers.map(({ email, role }) => ({ email, role })) },
    'Seed users ready',
  );
}

export async function seedDefaultData() {
  await seedDefaultUsers();

  const collaborator = await prisma.user.findUniqueOrThrow({
    where: { email: 'colaborador@email.com' },
  });

  await Promise.all(
    seedCategories.map(async (seedCategory) => {
      const existingCategory = await prisma.category.findFirst({
        where: { name: seedCategory.name },
      });

      if (existingCategory) {
        return prisma.category.update({
          data: { active: seedCategory.active },
          where: { id: existingCategory.id },
        });
      }

      return prisma.category.create({
        data: seedCategory,
      });
    }),
  );

  const category = await prisma.category.findFirstOrThrow({
    where: { name: defaultCategory.name },
  });

  const existingReimbursement = await prisma.reimbursementRequest.findFirst({
    where: {
      categoryId: category.id,
      description: defaultReimbursement.description,
      requesterId: collaborator.id,
    },
  });

  const reimbursement =
    existingReimbursement ??
    (await prisma.reimbursementRequest.create({
      data: {
        amount: defaultReimbursement.amount,
        categoryId: category.id,
        description: defaultReimbursement.description,
        expenseDate: defaultReimbursement.expenseDate,
        histories: {
          create: {
            action: ReimbursementHistoryAction.CREATED,
            observation: defaultReimbursement.historyObservation,
            userId: collaborator.id,
          },
        },
        requesterId: collaborator.id,
        status: defaultReimbursement.status,
      },
    }));

  logger.info(
    {
      categoryId: category.id,
      reimbursementId: reimbursement.id,
      requesterId: collaborator.id,
    },
    'Seed default category and reimbursement ready',
  );
}

export {
  defaultCategory,
  defaultPassword,
  defaultReimbursement,
  seedCategories,
  seedUsers,
};
