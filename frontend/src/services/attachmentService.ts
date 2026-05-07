import { httpClient } from '@/services/httpClient';
import type { Attachment, UploadAttachmentPayload } from '@/types/api';

export const attachmentService = {
  async listReimbursementAttachments(reimbursementId: string): Promise<Attachment[]> {
    const { data } = await httpClient.get<Attachment[]>(
      `/reimbursements/${reimbursementId}/attachments`,
    );

    return data;
  },

  async uploadReimbursementAttachment(
    reimbursementId: string,
    payload: UploadAttachmentPayload,
  ): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', payload.file);

    const { data } = await httpClient.post<Attachment>(
      `/reimbursements/${reimbursementId}/attachments`,
      formData,
    );

    return data;
  },
};
