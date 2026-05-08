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

const seedReimbursements = [
  {
    ...defaultReimbursement,
    categoryName: defaultCategory.name,
    rejectionReason: null,
  },
  {
    amount: 89.9,
    categoryName: 'Alimentação',
    description: 'Almoço com cliente estratégico',
    expenseDate: new Date('2026-05-02T00:00:00.000Z'),
    rejectionReason: null,
    status: ReimbursementStatus.SUBMITTED,
  },
  {
    amount: 320,
    categoryName: 'Hospedagem',
    description: 'Diária de hotel para visita técnica',
    expenseDate: new Date('2026-05-03T00:00:00.000Z'),
    rejectionReason: null,
    status: ReimbursementStatus.APPROVED,
  },
  {
    amount: 210.75,
    categoryName: 'Combustível',
    description: 'Combustível para viagem comercial',
    expenseDate: new Date('2026-05-04T00:00:00.000Z'),
    rejectionReason: null,
    status: ReimbursementStatus.PAID,
  },
  {
    amount: 42,
    categoryName: 'Estacionamento',
    description: 'Estacionamento em reunião externa',
    expenseDate: new Date('2026-05-05T00:00:00.000Z'),
    rejectionReason: null,
    status: ReimbursementStatus.DRAFT,
  },
  {
    amount: 37.5,
    categoryName: 'Pedágio',
    description: 'Pedágio para visita a fornecedor',
    expenseDate: new Date('2026-05-06T00:00:00.000Z'),
    rejectionReason: null,
    status: ReimbursementStatus.SUBMITTED,
  },
  {
    amount: 145.3,
    categoryName: 'Material de escritório',
    description: 'Material para workshop interno',
    expenseDate: new Date('2026-05-07T00:00:00.000Z'),
    rejectionReason: null,
    status: ReimbursementStatus.APPROVED,
  },
  {
    amount: 119.99,
    categoryName: 'Internet',
    description: 'Plano de internet para trabalho remoto',
    expenseDate: new Date('2026-05-08T00:00:00.000Z'),
    rejectionReason: null,
    status: ReimbursementStatus.PAID,
  },
  {
    amount: 64.9,
    categoryName: 'Telefone',
    description: 'Conta telefônica corporativa',
    expenseDate: new Date('2026-05-09T00:00:00.000Z'),
    rejectionReason: null,
    status: ReimbursementStatus.SUBMITTED,
  },
  {
    amount: 980,
    categoryName: 'Passagens aéreas',
    description: 'Passagem aérea para conferência',
    expenseDate: new Date('2026-05-10T00:00:00.000Z'),
    rejectionReason: null,
    status: ReimbursementStatus.APPROVED,
  },
  {
    amount: 450,
    categoryName: 'Treinamentos',
    description: 'Inscrição em treinamento técnico',
    expenseDate: new Date('2026-05-11T00:00:00.000Z'),
    rejectionReason: null,
    status: ReimbursementStatus.PAID,
  },
  {
    amount: 275,
    categoryName: 'Eventos',
    description: 'Credenciamento em evento de tecnologia',
    expenseDate: new Date('2026-05-12T00:00:00.000Z'),
    rejectionReason: 'Evento fora da política de reembolso',
    status: ReimbursementStatus.REJECTED,
  },
  {
    amount: 180,
    categoryName: 'Manutenção',
    description: 'Manutenção emergencial de equipamento',
    expenseDate: new Date('2026-05-13T00:00:00.000Z'),
    rejectionReason: null,
    status: ReimbursementStatus.CANCELED,
  },
] as const;

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
  const manager = await prisma.user.findUniqueOrThrow({
    where: { email: 'gestor@email.com' },
  });
  const finance = await prisma.user.findUniqueOrThrow({
    where: { email: 'financeiro@email.com' },
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

  const categories = await prisma.category.findMany({
    where: {
      name: {
        in: seedCategories.map((seedCategory) => seedCategory.name),
      },
    },
  });
  const categoryByName = new Map(
    categories.map((category) => [category.name, category]),
  );

  const reimbursements = await Promise.all(
    seedReimbursements.map(async (seedReimbursement) => {
      const category = categoryByName.get(seedReimbursement.categoryName);

      if (!category) {
        throw new Error(
          `Seed category not found: ${seedReimbursement.categoryName}`,
        );
      }

      const existingReimbursement =
        await prisma.reimbursementRequest.findFirst({
          where: {
            categoryId: category.id,
            description: seedReimbursement.description,
            requesterId: collaborator.id,
          },
        });

      if (existingReimbursement) {
        return existingReimbursement;
      }

      return prisma.reimbursementRequest.create({
        data: {
          amount: seedReimbursement.amount,
          categoryId: category.id,
          description: seedReimbursement.description,
          expenseDate: seedReimbursement.expenseDate,
          histories: {
            create: buildSeedReimbursementHistories({
              financeUserId: finance.id,
              managerUserId: manager.id,
              requesterUserId: collaborator.id,
              reimbursement: seedReimbursement,
            }),
          },
          rejectionReason: seedReimbursement.rejectionReason,
          requesterId: collaborator.id,
          status: seedReimbursement.status,
        },
      });
    }),
  );

  const reimbursement = reimbursements.find(
    (seededReimbursement) =>
      seededReimbursement.description === defaultReimbursement.description,
  )!;

  logger.info(
    {
      reimbursementCount: reimbursements.length,
      reimbursementId: reimbursement.id,
      requesterId: collaborator.id,
    },
    'Seed default categories and reimbursements ready',
  );
}

function buildSeedReimbursementHistories({
  financeUserId,
  managerUserId,
  requesterUserId,
  reimbursement,
}: {
  financeUserId: string;
  managerUserId: string;
  requesterUserId: string;
  reimbursement: (typeof seedReimbursements)[number];
}) {
  const histories: Array<{
    action: ReimbursementHistoryAction;
    observation: string;
    userId: string;
  }> = [
    {
      action: ReimbursementHistoryAction.CREATED,
      observation:
        'historyObservation' in reimbursement
          ? reimbursement.historyObservation
          : 'Solicitação criada pelo seed',
      userId: requesterUserId,
    },
  ];

  const submittedStatuses: ReimbursementStatus[] = [
    ReimbursementStatus.SUBMITTED,
    ReimbursementStatus.APPROVED,
    ReimbursementStatus.REJECTED,
    ReimbursementStatus.PAID,
  ];

  if (submittedStatuses.includes(reimbursement.status)) {
    histories.push({
      action: ReimbursementHistoryAction.SUBMITTED,
      observation: 'Solicitação enviada pelo seed',
      userId: requesterUserId,
    });
  }

  const approvedStatuses: ReimbursementStatus[] = [
    ReimbursementStatus.APPROVED,
    ReimbursementStatus.PAID,
  ];

  if (approvedStatuses.includes(reimbursement.status)) {
    histories.push({
      action: ReimbursementHistoryAction.APPROVED,
      observation: 'Solicitação aprovada pelo seed',
      userId: managerUserId,
    });
  }

  if (reimbursement.status === ReimbursementStatus.REJECTED) {
    histories.push({
      action: ReimbursementHistoryAction.REJECTED,
      observation:
        reimbursement.rejectionReason ?? 'Solicitação rejeitada pelo seed',
      userId: managerUserId,
    });
  }

  if (reimbursement.status === ReimbursementStatus.PAID) {
    histories.push({
      action: ReimbursementHistoryAction.PAID,
      observation: 'Solicitação paga pelo seed',
      userId: financeUserId,
    });
  }

  if (reimbursement.status === ReimbursementStatus.CANCELED) {
    histories.push({
      action: ReimbursementHistoryAction.CANCELED,
      observation: 'Solicitação cancelada pelo seed',
      userId: requesterUserId,
    });
  }

  return histories;
}

export {
  defaultCategory,
  defaultPassword,
  defaultReimbursement,
  seedCategories,
  seedReimbursements,
  seedUsers,
};
