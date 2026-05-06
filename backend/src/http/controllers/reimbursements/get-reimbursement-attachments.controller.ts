import { ReimbursementStatus } from '../../../../generated/prisma/client';
import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import { reimbursementParamsSchema } from '@/schemas/reimbursement.schema';
import { Role } from '@/types/roles-enum';
import type { Request, Response } from 'express';
import z from 'zod';

export async function getReimbursementAttachments(
  request: Request,
  response: Response,
) {
  const loggedUser = request.loggedUser!;

  const { data, error } = reimbursementParamsSchema.safeParse(request.params);

  if (error) {
    logger.warn(
      { fields: Object.keys(z.treeifyError(error).properties ?? {}) },
      'Parâmetros inválidos para consulta de anexos de reembolso',
    );

    return response.status(400).json(z.treeifyError(error).properties);
  }

  const reimbursement = await prisma.reimbursementRequest.findUnique({
    where: { id: data.id },
  });

  if (!reimbursement) {
    logger.warn(
      { reimbursementId: data.id },
      'Solicitação de reembolso não encontrada na consulta de anexos',
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
      'Usuário sem permissão para consultar anexos de reembolso',
    );

    return response
      .status(403)
      .json({ message: 'Usuário sem permissão para acessar este recurso' });
  }

  const attachments = await prisma.attachment.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      createdAt: true,
      fileName: true,
      fileType: true,
      fileUrl: true,
      id: true,
      publicId: true,
      reimbursementRequestId: true,
    },
    where: { reimbursementRequestId: data.id },
  });

  logger.info(
    {
      reimbursementId: data.id,
      total: attachments.length,
      userId: loggedUser.id,
    },
    'Anexos de reembolso consultados',
  );

  return response.json(
    attachments.map((attachment) => ({
      cloudinaryPublicId: attachment.publicId,
      createdAt: attachment.createdAt,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      fileUrl: attachment.fileUrl,
      id: attachment.id,
      reimbursementId: attachment.reimbursementRequestId,
    })),
  );
}
