import type { Request, Response } from 'express';
import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';

export async function deleteUser(request: Request, response: Response) {
  const id = request.params.id as string;

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    logger.warn({ userId: id }, 'Tentativa de excluir usuário inexistente');

    return response.status(404).json({ message: 'Usuário não encontrado' });
  }

  await prisma.user.delete({ where: { id } });

  logger.info({ email: user.email, userId: id }, 'Usuário excluído');

  response.status(204).send();
}
