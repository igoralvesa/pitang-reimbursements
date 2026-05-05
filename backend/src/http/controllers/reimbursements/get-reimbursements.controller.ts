import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import { Role } from '@/types/roles-enum';
import type { Request, Response } from 'express';

export async function getReimbursements(
  request: Request,
  response: Response,
) {
  const loggedUser = request.loggedUser!;

  const reimbursements = await prisma.reimbursementRequest.findMany({
    include: {
      category: true,
      requester: {
        select: {
          email: true,
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    where:
      loggedUser.role === Role.COLLABORATOR
        ? { requesterId: loggedUser.id }
        : undefined,
  });

  logger.info(
    {
      role: loggedUser.role,
      total: reimbursements.length,
      userId: loggedUser.id,
    },
    'Solicitações de reembolso consultadas',
  );

  return response.json(reimbursements);
}
