import type { Request, Response } from 'express';
import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';

export async function getUsers(request: Request, response: Response) {
  const users = await prisma.user.findMany({
    omit: { passwordHash: true },
  });

  logger.info({ total: users.length }, 'Usuários consultados');

  response.json(users);
}
