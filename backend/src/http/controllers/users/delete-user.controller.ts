import type { Request, Response } from 'express';
import { prisma } from '../../../core/prisma';

export async function deleteUser(request: Request, response: Response) {
  const id = request.params.id as string;

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    return response.status(404).json({ message: 'Usuário não encontrado' });
  }

  await prisma.user.delete({ where: { id } });

  response.status(204).send();
}
