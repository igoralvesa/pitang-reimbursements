import { httpClient } from '@/services/httpClient';
import type {
  Attachment,
  CreateReimbursementPayload,
  HistoryEntry,
  ReimbursementRequest,
  RejectReimbursementPayload,
  UpdateReimbursementPayload,
} from '@/types/api';

export const reimbursementService = {
  async listReimbursements(): Promise<ReimbursementRequest[]> {
    const { data } = await httpClient.get<ReimbursementRequest[]>('/reimbursements');

    return data;
  },

  async createReimbursement(
    payload: CreateReimbursementPayload,
  ): Promise<ReimbursementRequest> {
    const { data } = await httpClient.post<ReimbursementRequest>('/reimbursements', payload);

    return data;
  },

  async getReimbursement(id: string): Promise<ReimbursementRequest> {
    const { data } = await httpClient.get<ReimbursementRequest>(`/reimbursements/${id}`);

    return data;
  },

  async updateReimbursement(
    id: string,
    payload: UpdateReimbursementPayload,
  ): Promise<ReimbursementRequest> {
    const { data } = await httpClient.put<ReimbursementRequest>(
      `/reimbursements/${id}`,
      payload,
    );

    return data;
  },

  async submitReimbursement(id: string): Promise<ReimbursementRequest> {
    const { data } = await httpClient.post<ReimbursementRequest>(
      `/reimbursements/${id}/submit`,
    );

    return data;
  },

  async cancelReimbursement(id: string): Promise<ReimbursementRequest> {
    const { data } = await httpClient.post<ReimbursementRequest>(
      `/reimbursements/${id}/cancel`,
    );

    return data;
  },

  async approveReimbursement(id: string): Promise<ReimbursementRequest> {
    const { data } = await httpClient.post<ReimbursementRequest>(
      `/reimbursements/${id}/approve`,
    );

    return data;
  },

  async rejectReimbursement(
    id: string,
    payload: RejectReimbursementPayload,
  ): Promise<ReimbursementRequest> {
    const { data } = await httpClient.post<ReimbursementRequest>(
      `/reimbursements/${id}/reject`,
      payload,
    );

    return data;
  },

  async payReimbursement(id: string): Promise<ReimbursementRequest> {
    const { data } = await httpClient.post<ReimbursementRequest>(`/reimbursements/${id}/pay`);

    return data;
  },

  async getReimbursementHistory(id: string): Promise<HistoryEntry[]> {
    const { data } = await httpClient.get<HistoryEntry[]>(`/reimbursements/${id}/history`);

    return data;
  },

  async getReimbursementAttachments(id: string): Promise<Attachment[]> {
    const { data } = await httpClient.get<Attachment[]>(
      `/reimbursements/${id}/attachments`,
    );

    return data;
  },
};
