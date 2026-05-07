import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import type { Request, Response } from 'express';

export async function authMe(request: Request, response: Response) {
  const loggedUser = request.loggedUser;

  if (!loggedUser) {
    return response.status(401).json({ message: 'Não autorizado' });
  }

  const user = await prisma.user.findUnique({
    omit: { passwordHash: true },
    where: { id: loggedUser.id },
  });

  if (!user) {
    logger.warn(
      { userId: loggedUser.id },
      'Usuário autenticado não encontrado',
    );

    return response.status(404).json({ message: 'Usuário não encontrado' });
  }

  logger.info({ userId: user.id }, 'Usuário autenticado consultado');

  return response.status(200).json(user);
}
