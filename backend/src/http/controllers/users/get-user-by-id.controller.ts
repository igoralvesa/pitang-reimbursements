import type { Request, Response } from 'express';
import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';

export async function getUser(request: Request, response: Response) {
  const id = request.params.id as string;

  const user = await prisma.user.findUnique({
    omit: { passwordHash: true },
    where: { id },
  });

  if (!user) {
    logger.warn({ userId: id }, 'Usuário não encontrado na consulta por id');

    return response.status(404).json({ message: 'Usuário não encontrado' });
  }

  logger.info({ userId: id }, 'Usuário consultado por id');

  response.json(user);
}
