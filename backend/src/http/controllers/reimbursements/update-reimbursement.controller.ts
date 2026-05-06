import {
  ReimbursementHistoryAction,
  ReimbursementStatus,
} from '../../../../generated/prisma/client';
import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import {
  reimbursementParamsSchema,
  updateReimbursementSchema,
} from '@/schemas/reimbursement.schema';
import type { Request, Response } from 'express';
import z from 'zod';

export async function updateReimbursement(
  request: Request,
  response: Response,
) {
  const loggedUser = request.loggedUser!;

  const { data: params, error: paramsError } =
    reimbursementParamsSchema.safeParse(request.params);

  if (paramsError) {
    logger.warn(
      { fields: Object.keys(z.treeifyError(paramsError).properties ?? {}) },
      'Parâmetros inválidos para atualização de solicitação de reembolso',
    );

    return response.status(400).json(z.treeifyError(paramsError).properties);
  }

  const { data, error } = updateReimbursementSchema.safeParse(request.body);

  if (error) {
    logger.warn(
      {
        fields: Object.keys(z.treeifyError(error).properties ?? {}),
        reimbursementId: params.id,
      },
      'Dados inválidos para atualização de solicitação de reembolso',
    );

    return response.status(400).json(z.treeifyError(error).properties);
  }

  const reimbursementExists = await prisma.reimbursementRequest.findUnique({
    where: { id: params.id },
  });

  if (!reimbursementExists) {
    logger.warn(
      { reimbursementId: params.id },
      'Tentativa de atualizar solicitação de reembolso inexistente',
    );

    return response
      .status(404)
      .json({ message: 'Solicitação de reembolso não encontrada' });
  }

  if (reimbursementExists.requesterId !== loggedUser.id) {
    logger.warn(
      {
        reimbursementId: params.id,
        requesterId: reimbursementExists.requesterId,
        userId: loggedUser.id,
      },
      'Usuário sem permissão para atualizar solicitação de reembolso',
    );

    return response
      .status(403)
      .json({ message: 'Usuário sem permissão para acessar este recurso' });
  }

  if (reimbursementExists.status !== ReimbursementStatus.DRAFT) {
    logger.warn(
      {
        reimbursementId: params.id,
        status: reimbursementExists.status,
        userId: loggedUser.id,
      },
      'Tentativa de atualizar solicitação de reembolso com status inválido',
    );

    return response.status(400).json({
      message: 'Status da solicitação não permite edição',
    });
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category || !category.active) {
      logger.warn(
        {
          categoryId: data.categoryId,
          reimbursementId: params.id,
        },
        'Categoria inválida para atualização de solicitação de reembolso',
      );

      return response
        .status(400)
        .json({ message: 'Categoria inválida ou inativa' });
    }
  }

  const reimbursement = await prisma.reimbursementRequest.update({
    data: {
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.expenseDate !== undefined
        ? { expenseDate: data.expenseDate }
        : {}),
      histories: {
        create: {
          action: ReimbursementHistoryAction.UPDATED,
          observation: 'Solicitação de reembolso atualizada',
          userId: loggedUser.id,
        },
      },
    },
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
    where: { id: params.id },
  });

  logger.info(
    {
      fields: Object.keys(data),
      reimbursementId: reimbursement.id,
      userId: loggedUser.id,
    },
    'Solicitação de reembolso atualizada',
  );

  return response.status(200).json(reimbursement);
}
