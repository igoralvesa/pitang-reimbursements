import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { basename, extname } from 'node:path';

import {
  ReimbursementHistoryAction,
  ReimbursementStatus,
} from '../../../../generated/prisma/client';
import { cloudinary } from '@/config/cloudinary';
import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import {
  allowedReimbursementAttachmentMimeTypes,
  maxReimbursementAttachmentSizeInBytes,
} from '@/http/middlewares/reimbursement-attachment-upload.middleware';
import { reimbursementParamsSchema } from '@/schemas/reimbursement.schema';

type CloudinaryUploadResult = {
  public_id: string;
  secure_url: string;
};

class CloudinaryUploadError extends Error {
  constructor(
    message = 'Cloudinary upload failed',
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'CloudinaryUploadError';
  }
}

function getCloudinaryStatusCode(error: unknown) {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const { http_code: httpCode, statusCode } = error as {
    http_code?: unknown;
    statusCode?: unknown;
  };

  if (typeof httpCode === 'number') {
    return httpCode;
  }

  if (typeof statusCode === 'number') {
    return statusCode;
  }

  return undefined;
}

function uploadToCloudinary({
  buffer,
  folder,
  originalName,
}: {
  buffer: Buffer;
  folder: string;
  originalName: string;
}) {
  const originalExtension = extname(originalName).toLowerCase();
  const fileNameWithoutExtension =
    basename(originalName, originalExtension)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'attachment';
  const publicId = `${fileNameWithoutExtension}-${randomUUID()}.pdf`;

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'raw',
      },
      (error, result) => {
        if (error) {
          return reject(
            new CloudinaryUploadError(
              error instanceof Error
                ? error.message
                : 'Cloudinary upload failed',
              getCloudinaryStatusCode(error),
            ),
          );
        }

        if (!result) {
          return reject(new CloudinaryUploadError());
        }

        const uploadResult = result as CloudinaryUploadResult;

        return resolve({
          public_id: uploadResult.public_id,
          secure_url: uploadResult.secure_url,
        });
      },
    );

    uploadStream.end(buffer);
  });
}

export async function uploadReimbursementAttachments(
  request: Request,
  response: Response,
) {
  const loggedUser = request.loggedUser!;

  const { data: params, error: paramsError } =
    reimbursementParamsSchema.safeParse(request.params);

  if (paramsError) {
    return response.status(400).json({
      message: 'Identificador da solicitação inválido',
    });
  }

  const reimbursement = await prisma.reimbursementRequest.findUnique({
    where: { id: params.id },
  });

  if (!reimbursement) {
    return response.status(404).json({
      message: 'Solicitação de reembolso não encontrada',
    });
  }

  if (reimbursement.requesterId !== loggedUser.id) {
    return response.status(403).json({
      message: 'Usuário sem permissão para acessar este recurso',
    });
  }

  if (reimbursement.status !== ReimbursementStatus.DRAFT) {
    return response.status(400).json({
      message: 'Status da solicitação não permite anexar arquivos',
    });
  }

  if (!request.file) {
    return response.status(400).json({
      message: 'Arquivo é obrigatório',
    });
  }

  if (!allowedReimbursementAttachmentMimeTypes.has(request.file.mimetype)) {
    return response.status(400).json({
      message: 'Tipo de arquivo inválido',
    });
  }

  if (request.file.size > maxReimbursementAttachmentSizeInBytes) {
    return response.status(400).json({
      message: 'Arquivo deve ter no máximo 5MB',
    });
  }

  try {
    const cloudinaryResult = await uploadToCloudinary({
      buffer: request.file.buffer,
      folder: `reimbursements/${reimbursement.id}`,
      originalName: request.file.originalname,
    });

    const [attachment] = await prisma.$transaction([
      prisma.attachment.create({
        data: {
          fileName: request.file.originalname,
          fileType: request.file.mimetype,
          fileUrl: cloudinaryResult.secure_url,
          publicId: cloudinaryResult.public_id,
          reimbursementRequestId: reimbursement.id,
          size: request.file.size,
        },
      }),

      prisma.reimbursementHistory.create({
        data: {
          reimbursementRequestId: reimbursement.id,
          action: ReimbursementHistoryAction.UPDATED,
          observation: `Anexo adicionado: ${request.file.originalname}`,
          userId: loggedUser.id,
        },
      }),
    ]);

    return response.status(201).json({
      cloudinaryPublicId: attachment.publicId,
      createdAt: attachment.createdAt,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      fileUrl: attachment.fileUrl,
      id: attachment.id,
      reimbursementId: attachment.reimbursementRequestId,
    });
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        statusCode:
          error instanceof CloudinaryUploadError ? error.statusCode : undefined,
        reimbursementId: reimbursement.id,
      },
      'Erro ao enviar anexo para Cloudinary',
    );

    if (error instanceof CloudinaryUploadError) {
      return response.status(500).json({
        message: 'Erro no upload para Cloudinary',
      });
    }

    return response.status(500).json({
      message: 'Erro inesperado ao enviar anexo',
    });
  }
}
