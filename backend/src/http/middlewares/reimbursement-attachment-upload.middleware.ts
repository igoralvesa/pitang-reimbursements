import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import { logger } from '@/core/Logger';

export const allowedReimbursementAttachmentMimeTypes = new Set([
  'application/pdf',
]);

export const maxReimbursementAttachmentSizeInBytes = 5 * 1024 * 1024;

const multerUpload = multer({
  fileFilter: (_request, file, callback) => {
    if (!allowedReimbursementAttachmentMimeTypes.has(file.mimetype)) {
      return callback(new Error('Tipo de arquivo inválido'));
    }

    return callback(null, true);
  },
  limits: {
    fileSize: maxReimbursementAttachmentSizeInBytes,
  },
  storage: multer.memoryStorage(),
}).single('file');

export function reimbursementAttachmentUploadMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  multerUpload(request, response, (error) => {
    if (!error) {
      return next();
    }

    if (
      error instanceof multer.MulterError &&
      error.code === 'LIMIT_UNEXPECTED_FILE'
    ) {
      return response.status(400).json({
        message: 'Apenas um arquivo pode ser enviado por vez',
      });
    }

    if (
      error instanceof multer.MulterError &&
      error.code === 'LIMIT_FILE_SIZE'
    ) {
      return response.status(400).json({
        message: 'Arquivo deve ter no máximo 5MB',
      });
    }

    logger.warn(
      {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        path: request.path,
      },
      'Arquivo inválido para anexo de reembolso',
    );

    return response.status(400).json({
      message: 'Arquivo inválido',
    });
  });
}
