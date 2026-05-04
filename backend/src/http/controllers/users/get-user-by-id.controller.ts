import type { Request, Response } from 'express';
import { prisma } from '../../../core/prisma';

export async function getUser(request: Request, response: Response) {
  const id = request.params.id as string;

  const user = await prisma.user.findUnique({
    omit: { passwordHash: true },
    where: { id },
  });

  if (!user) {
    return response.status(404).json({ message: 'Usuário não encontrado' });
  }

  response.json(user);
}
