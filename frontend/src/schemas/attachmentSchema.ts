import { z } from 'zod';

const MAX_ATTACHMENT_SIZE_IN_BYTES = 5 * 1024 * 1024;

export const attachmentSchema = z.object({
  file: z
    .custom<File>((value) => value instanceof File, 'Arquivo é obrigatório')
    .refine((file) => file.type === 'application/pdf', {
      message: 'Arquivo inválido. Envie um PDF.',
    })
    .refine((file) => file.size <= MAX_ATTACHMENT_SIZE_IN_BYTES, {
      message: 'Arquivo deve ter no máximo 5MB',
    }),
});

export type AttachmentFormData = z.infer<typeof attachmentSchema>;
