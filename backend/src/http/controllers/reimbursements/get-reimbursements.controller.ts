import { ReimbursementStatus } from '../../../../generated/prisma/client';
import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import { getReimbursementsQuerySchema } from '@/schemas/reimbursement.schema';
import { Role } from '@/types/roles-enum';
import type { Request, Response } from 'express';
import z from 'zod';

const managerVisibleStatuses: ReimbursementStatus[] = [
  ReimbursementStatus.SUBMITTED,
  ReimbursementStatus.APPROVED,
  ReimbursementStatus.REJECTED,
];

const financeVisibleStatuses: ReimbursementStatus[] = [
  ReimbursementStatus.APPROVED,
  ReimbursementStatus.PAID,
];

export async function getReimbursements(request: Request, response: Response) {
  const { data: query, error } = getReimbursementsQuerySchema.safeParse(
    request.query,
  );

  if (error) {
    logger.warn(
      { fields: Object.keys(z.treeifyError(error).properties ?? {}) },
      'Parâmetros inválidos para consulta de solicitações de reembolso',
    );

    return response.status(400).json(z.treeifyError(error).properties);
  }

  const loggedUser = request.loggedUser!;

  if (loggedUser.role === Role.COLLABORATOR && query.collaboratorId) {
    return response.status(400).json({
      message: 'Colaborador não pode filtrar por outro colaborador',
    });
  }

  if (
    loggedUser.role === Role.MANAGER &&
    query.status &&
    !managerVisibleStatuses.includes(query.status)
  ) {
    return response.status(403).json({
      message: 'Usuário sem permissão para acessar este recurso',
    });
  }

  if (
    loggedUser.role === Role.FINANCE &&
    query.status &&
    !financeVisibleStatuses.includes(query.status)
  ) {
    return response.status(403).json({
      message: 'Usuário sem permissão para acessar este recurso',
    });
  }

  const where = {
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(loggedUser.role === Role.COLLABORATOR
      ? { requesterId: loggedUser.id }
      : query.collaboratorId
        ? { requesterId: query.collaboratorId }
        : {}),
    ...getStatusFilter(loggedUser.role, query.status),
  };
  const skip = (query.page - 1) * query.limit;

  const [total, reimbursements] = await prisma.$transaction([
    prisma.reimbursementRequest.count({ where }),
    prisma.reimbursementRequest.findMany({
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
      orderBy: { [query.sortBy]: query.sortOrder },
      skip,
      take: query.limit,
      where,
    }),
  ]);

  logger.info(
    {
      limit: query.limit,
      page: query.page,
      role: loggedUser.role,
      total,
      userId: loggedUser.id,
    },
    'Solicitações de reembolso consultadas',
  );

  return response.json({
    data: reimbursements,
    meta: {
      limit: query.limit,
      page: query.page,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}

function getStatusFilter(
  role: Role,
  status?: ReimbursementStatus,
) {
  if (status) {
    return { status };
  }

  if (role === Role.MANAGER) {
    return { status: { in: managerVisibleStatuses } };
  }

  if (role === Role.FINANCE) {
    return { status: { in: financeVisibleStatuses } };
  }

  return {};
}
