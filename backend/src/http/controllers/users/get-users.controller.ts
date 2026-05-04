import type { Request, Response } from 'express';
import { prisma } from '../../../core/prisma';

export async function getUsers(request: Request, response: Response) {
  const users = await prisma.user.findMany({
    omit: { passwordHash: true },
  });

  response.json(users);
}
