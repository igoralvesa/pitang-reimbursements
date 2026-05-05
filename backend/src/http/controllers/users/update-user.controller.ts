import bcrypt from 'bcryptjs';
import z from 'zod';

import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import { updateUserSchema } from '@/schemas/user.schema';
import type { Request, Response } from 'express';

export async function patchUser(request: Request, response: Response) {
  const { id } = request.params;

  if (typeof id !== 'string') {
    logger.warn({ id }, 'Id de usuário inválido para atualização');

    return response
      .status(400)
      .json({ message: 'O id do usuário é obrigatório' });
  }

  const { data, error } = updateUserSchema.safeParse(request.body);

  if (error) {
    logger.warn(
      { fields: Object.keys(z.treeifyError(error).properties ?? {}), userId: id },
      'Dados inválidos para atualização de usuário',
    );

    return response.status(400).json(z.treeifyError(error).properties);
  }

  const { password, ...userData } = data;
  const passwordData = password
    ? { passwordHash: bcrypt.hashSync(password, 10) }
    : {};

  const user = await prisma.user.update({
    data: {
      ...userData,
      ...passwordData,
    },
    where: { id },
  });

  const { passwordHash: _passwordHash, ...userWithoutPassword } = user;

  logger.info(
    {
      fields: Object.keys(data),
      userId: userWithoutPassword.id,
    },
    'Usuário atualizado',
  );

  return response.status(200).json(userWithoutPassword);
}
