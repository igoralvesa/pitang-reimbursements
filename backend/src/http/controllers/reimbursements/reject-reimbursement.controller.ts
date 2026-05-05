import {
  ReimbursementHistoryAction,
  ReimbursementStatus,
} from '../../../../generated/prisma/client';
import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import {
  reimbursementParamsSchema,
  rejectReimbursementSchema,
} from '@/schemas/reimbursement.schema';
import type { Request, Response } from 'express';
import z from 'zod';

export async function rejectReimbursement(
  request: Request,
  response: Response,
) {
  const loggedUser = request.loggedUser!;

  const { data: params, error: paramsError } =
    reimbursementParamsSchema.safeParse(request.params);

  if (paramsError) {
    logger.warn(
      { fields: Object.keys(z.treeifyError(paramsError).properties ?? {}) },
      'Parâmetros inválidos para rejeição de solicitação de reembolso',
    );

    return response.status(400).json(z.treeifyError(paramsError).properties);
  }

  const { data, error } = rejectReimbursementSchema.safeParse(request.body);

  if (error) {
    logger.warn(
      {
        fields: Object.keys(z.treeifyError(error).properties ?? {}),
        reimbursementId: params.id,
      },
      'Dados inválidos para rejeição de solicitação de reembolso',
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

  const rejectedReimbursement = await prisma.reimbursementRequest.update({
    data: {
      histories: {
        create: {
          action: ReimbursementHistoryAction.REJECTED,
          observation: data.rejectionReason,
          userId: loggedUser.id,
        },
      },
      rejectionReason: data.rejectionReason,
      status: ReimbursementStatus.REJECTED,
    },
    where: { id: params.id },
  });

  logger.info(
    { reimbursementId: rejectedReimbursement.id, userId: loggedUser.id },
    'Solicitação de reembolso rejeitada',
  );

  return response.status(200).json(rejectedReimbursement);
}
