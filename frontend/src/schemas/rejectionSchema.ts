import { z } from 'zod';

export const rejectionSchema = z.object({
  rejectionReason: z.string().trim().min(1, 'Justificativa é obrigatória'),
});

export type RejectionFormData = z.infer<typeof rejectionSchema>;
