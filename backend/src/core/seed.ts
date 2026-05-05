import bcrypt from 'bcryptjs';

import { logger } from './Logger';
import { prisma } from './prisma';

const seedUsers = [
  {
    email: 'admin@email.com',
    name: 'Admin',
    role: 'ADMIN',
  },
  {
    email: 'colaborador@email.com',
    name: 'Colaborador',
    role: 'COLLABORATOR',
  },
  {
    email: 'gestor@email.com',
    name: 'Gestor',
    role: 'MANAGER',
  },
  {
    email: 'financeiro@email.com',
    name: 'Financeiro',
    role: 'FINANCE',
  },
] as const;

const defaultPassword = 'Senha@123';

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

export { defaultPassword, seedUsers };
