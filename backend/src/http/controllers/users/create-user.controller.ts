import bcrypt from 'bcryptjs';
import z from 'zod';

import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import { userSchema } from '@/schemas/user.schema';
import type { Request, Response } from 'express';

export async function postUser(request: Request, response: Response) {
  const { data, error } = userSchema.safeParse(request.body);

  if (error) {
    return response.status(400).json(z.treeifyError(error).properties);
  }

  let user = await prisma.user.findUnique({ where: { email: data.email } });

  if (user) {
    const message = 'Usuário já cadastrado';
    logger.error({ emailAddress: data.email }, message);

    return response.status(409).json({ message });
  }

  const passwordHash = bcrypt.hashSync(data.password, 10);

  user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      role: 'COLLABORATOR',
    },
  });

  logger.info(user, 'Usuário cadastrado');

  const { passwordHash: _passwordHash, ...userWithoutPassword } = user;

  response.status(201).json(userWithoutPassword);
}
