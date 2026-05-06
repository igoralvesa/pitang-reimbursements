import {
  ReimbursementHistoryAction,
  ReimbursementStatus,
} from '../../../../generated/prisma/client';
import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import { reimbursementParamsSchema } from '@/schemas/reimbursement.schema';
import type { Request, Response } from 'express';
import z from 'zod';

export async function approveReimbursement(
  request: Request,
  response: Response,
) {
  const loggedUser = request.loggedUser!;

  const { data: params, error } = reimbursementParamsSchema.safeParse(
    request.params,
  );

  if (error) {
    logger.warn(
      { fields: Object.keys(z.treeifyError(error).properties ?? {}) },
      'Parâmetros inválidos para aprovação de solicitação de reembolso',
    );

    return response.status(400).json(z.treeifyError(error).properties);
  }

  const reimbursement = await prisma.reimbursementRequest.findUnique({
    where: { id: params.id },
  });

  if (!reimbursement) {
    return response
      .status(404)
      .json({ message: 'Solicitação de reembolso não encontrada' });
  }

  if (reimbursement.status !== ReimbursementStatus.SUBMITTED) {
    return response.status(400).json({
      message: 'Transição de status inválida',
    });
  }

  const approvedReimbursement = await prisma.reimbursementRequest.update({
    data: {
      histories: {
        create: {
          action: ReimbursementHistoryAction.APPROVED,
          observation: 'Solicitação aprovada pelo gestor',
          userId: loggedUser.id,
        },
      },
      status: ReimbursementStatus.APPROVED,
    },
    where: { id: params.id },
  });

  logger.info(
    { reimbursementId: approvedReimbursement.id, userId: loggedUser.id },
    'Solicitação aprovada pelo gestor',
  );

  return response.status(200).json(approvedReimbursement);
}
