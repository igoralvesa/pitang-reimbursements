import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { reimbursementService } from '@/services/reimbursementService';
import type { ReimbursementRequest, RejectReimbursementPayload } from '@/types/api';

type RejectReimbursementVariables = {
  id: string;
  payload: RejectReimbursementPayload;
};

function useReimbursementActionCache() {
  const queryClient = useQueryClient();

  return (id: string, reimbursement?: ReimbursementRequest) => {
    if (reimbursement) {
      queryClient.setQueryData(queryKeys.reimbursements.detail(id), reimbursement);
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.reimbursements.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.reimbursements.detail(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.reimbursements.history(id) });
  };
}

export function useSubmitReimbursement() {
  const updateReimbursementCache = useReimbursementActionCache();

  return useMutation({
    mutationFn: (id: string) => reimbursementService.submitReimbursement(id),
    onSuccess: (reimbursement, id) => {
      updateReimbursementCache(id, reimbursement);
    },
  });
}

export function useCancelReimbursement() {
  const updateReimbursementCache = useReimbursementActionCache();

  return useMutation({
    mutationFn: (id: string) => reimbursementService.cancelReimbursement(id),
    onSuccess: (reimbursement, id) => {
      updateReimbursementCache(id, reimbursement);
    },
  });
}

export function useApproveReimbursement() {
  const updateReimbursementCache = useReimbursementActionCache();

  return useMutation({
    mutationFn: (id: string) => reimbursementService.approveReimbursement(id),
    onSuccess: (reimbursement, id) => {
      updateReimbursementCache(id, reimbursement);
    },
  });
}

export function useRejectReimbursement() {
  const updateReimbursementCache = useReimbursementActionCache();

  return useMutation({
    mutationFn: ({ id, payload }: RejectReimbursementVariables) =>
      reimbursementService.rejectReimbursement(id, payload),
    onSuccess: (reimbursement, variables) => {
      updateReimbursementCache(variables.id, reimbursement);
    },
  });
}

export function usePayReimbursement() {
  const updateReimbursementCache = useReimbursementActionCache();

  return useMutation({
    mutationFn: (id: string) => reimbursementService.payReimbursement(id),
    onSuccess: (reimbursement, id) => {
      updateReimbursementCache(id, reimbursement);
    },
  });
}
