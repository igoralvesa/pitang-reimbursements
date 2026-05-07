import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { attachmentService } from '@/services/attachmentService';
import type { UploadAttachmentPayload } from '@/types/api';

type UploadAttachmentVariables = {
  reimbursementId: string;
  payload: UploadAttachmentPayload;
};

export function useReimbursementAttachments(reimbursementId: string) {
  return useQuery({
    queryKey: queryKeys.reimbursements.attachments(reimbursementId),
    queryFn: () => attachmentService.listReimbursementAttachments(reimbursementId),
  });
}

export function useUploadReimbursementAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reimbursementId, payload }: UploadAttachmentVariables) =>
      attachmentService.uploadReimbursementAttachment(reimbursementId, payload),
    onSuccess: (_attachment, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.reimbursements.detail(variables.reimbursementId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reimbursements.attachments(variables.reimbursementId),
      });
    },
  });
}
