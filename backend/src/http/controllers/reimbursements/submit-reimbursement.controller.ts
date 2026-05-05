import {
  ReimbursementHistoryAction,
  ReimbursementStatus,
} from '../../../../generated/prisma/client';
import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import { reimbursementParamsSchema } from '@/schemas/reimbursement.schema';
import type { Request, Response } from 'express';
import z from 'zod';

export async function submitReimbursement(
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
      'Parâmetros inválidos para envio de solicitação de reembolso',
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

  if (reimbursement.requesterId !== loggedUser.id) {
    return response
      .status(403)
      .json({ message: 'Usuário sem permissão para acessar este recurso' });
  }

  if (reimbursement.status !== ReimbursementStatus.DRAFT) {
    return response.status(400).json({
      message: 'Transição de status inválida',
    });
  }

  const submittedReimbursement = await prisma.reimbursementRequest.update({
    data: {
      histories: {
        create: {
          action: ReimbursementHistoryAction.SUBMITTED,
          observation: 'Solicitação de reembolso enviada para análise',
          userId: loggedUser.id,
        },
      },
      status: ReimbursementStatus.SUBMITTED,
    },
    where: { id: params.id },
  });

  logger.info(
    { reimbursementId: submittedReimbursement.id, userId: loggedUser.id },
    'Solicitação de reembolso enviada',
  );

  return response.status(200).json(submittedReimbursement);
}
