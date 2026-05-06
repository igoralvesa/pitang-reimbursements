import { ReimbursementStatus } from '../../../../generated/prisma/client';
import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import { reimbursementParamsSchema } from '@/schemas/reimbursement.schema';
import { Role } from '@/types/roles-enum';
import type { Request, Response } from 'express';
import z from 'zod';

export async function getReimbursement(request: Request, response: Response) {
  const loggedUser = request.loggedUser!;

  const { data, error } = reimbursementParamsSchema.safeParse(request.params);

  if (error) {
    logger.warn(
      { fields: Object.keys(z.treeifyError(error).properties ?? {}) },
      'Parâmetros inválidos para consulta de solicitação de reembolso',
    );

    return response.status(400).json(z.treeifyError(error).properties);
  }

  const reimbursement = await prisma.reimbursementRequest.findUnique({
    include: {
      attachments: true,
      category: true,
      histories: {
        include: {
          user: {
            select: {
              email: true,
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      requester: {
        select: {
          email: true,
          id: true,
          name: true,
          role: true,
        },
      },
    },
    where: { id: data.id },
  });

  if (!reimbursement) {
    logger.warn(
      { reimbursementId: data.id },
      'Solicitação de reembolso não encontrada',
    );

    return response
      .status(404)
      .json({ message: 'Solicitação de reembolso não encontrada' });
  }

  const canAccessReimbursement =
    loggedUser.role === Role.ADMIN ||
    (loggedUser.role === Role.COLLABORATOR &&
      reimbursement.requesterId === loggedUser.id) ||
    (loggedUser.role === Role.MANAGER &&
      reimbursement.status === ReimbursementStatus.SUBMITTED) ||
    (loggedUser.role === Role.FINANCE &&
      reimbursement.status === ReimbursementStatus.APPROVED);

  if (!canAccessReimbursement) {
    logger.warn(
      {
        reimbursementId: data.id,
        role: loggedUser.role,
        status: reimbursement.status,
        userId: loggedUser.id,
      },
      'Usuário sem permissão para consultar solicitação de reembolso',
    );

    return response
      .status(403)
      .json({ message: 'Usuário sem permissão para acessar este recurso' });
  }

  logger.info(
    {
      reimbursementId: reimbursement.id,
      userId: loggedUser.id,
    },
    'Solicitação de reembolso consultada por id',
  );

  return response.json(reimbursement);
}
