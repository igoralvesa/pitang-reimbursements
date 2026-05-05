import { ReimbursementHistoryAction } from '../../../../generated/prisma/client';
import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import { createReimbursementSchema } from '@/schemas/reimbursement.schema';
import type { Request, Response } from 'express';
import z from 'zod';

export async function postReimbursement(request: Request, response: Response) {
  const loggedUser = request.loggedUser!;

  const { data, error } = createReimbursementSchema.safeParse(request.body);

  if (error) {
    logger.warn(
      { fields: Object.keys(z.treeifyError(error).properties ?? {}) },
      'Dados inválidos para criação de solicitação de reembolso',
    );

    return response.status(400).json(z.treeifyError(error).properties);
  }

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category || !category.active) {
    const message = 'Categoria inválida ou inativa';

    logger.warn(
      { categoryId: data.categoryId },
      'Categoria inválida para criação de solicitação de reembolso',
    );

    return response.status(400).json({ message });
  }

  const reimbursement = await prisma.reimbursementRequest.create({
    data: {
      amount: data.amount,
      categoryId: data.categoryId,
      description: data.description,
      expenseDate: data.expenseDate,
      histories: {
        create: {
          // the reimbursementRequestId is automatically linked by Prisma, so we don't need to set it here
          action: ReimbursementHistoryAction.CREATED,
          observation: 'Solicitação de reembolso criada',
          userId: loggedUser.id,
        },
      },
      requesterId: loggedUser.id,
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
  });

  logger.info(
    {
      reimbursementId: reimbursement.id,
      requesterId: loggedUser.id,
    },
    'Solicitação de reembolso criada',
  );

  return response.status(201).json(reimbursement);
}
