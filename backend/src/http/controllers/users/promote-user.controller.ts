import z from 'zod';

import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import { promoteUserSchema } from '@/schemas/user.schema';
import type { Request, Response } from 'express';

export async function promoteUser(request: Request, response: Response) {
  const id = request.params.id as string;

  const { data, error } = promoteUserSchema.safeParse(request.body);

  if (error) {
    logger.warn(
      { fields: Object.keys(z.treeifyError(error).properties ?? {}), userId: id },
      'Dados inválidos para promoção de usuário',
    );

    return response.status(400).json(z.treeifyError(error).properties);
  }

  const userExists = await prisma.user.findUnique({ where: { id } });

  if (!userExists) {
    logger.warn({ userId: id }, 'Tentativa de promover usuário inexistente');

    return response.status(404).json({ message: 'Usuário não encontrado' });
  }

  const user = await prisma.user.update({
    data: { role: data.role },
    where: { id },
  });

  const { passwordHash: _passwordHash, ...userWithoutPassword } = user;

  logger.info(
    { role: userWithoutPassword.role, userId: userWithoutPassword.id },
    'Usuário promovido',
  );

  return response.status(200).json(userWithoutPassword);
}
