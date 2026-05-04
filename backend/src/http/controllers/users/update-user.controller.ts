import bcrypt from 'bcryptjs';
import z from 'zod';

import { prisma } from '@/core/prisma';
import { updateUserSchema } from '@/schemas/user.schema';
import type { Request, Response } from 'express';

export async function patchUser(request: Request, response: Response) {
  const { id } = request.params;

  if (typeof id !== 'string') {
    return response
      .status(400)
      .json({ message: 'O id do usuário é obrigatório' });
  }

  const { data, error } = updateUserSchema.safeParse(request.body);

  if (error) {
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

  return response.status(200).json(userWithoutPassword);
}
