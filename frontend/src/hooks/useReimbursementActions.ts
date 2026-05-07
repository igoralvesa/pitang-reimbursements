import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { reimbursementService } from '@/services/reimbursementService';
import type { RejectReimbursementPayload } from '@/types/api';

type RejectReimbursementVariables = {
  id: string;
  payload: RejectReimbursementPayload;
};

function useReimbursementActionInvalidation() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.reimbursements.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.reimbursements.detail(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.reimbursements.history(id) });
  };
}

export function useSubmitReimbursement() {
  const invalidateReimbursement = useReimbursementActionInvalidation();

  return useMutation({
    mutationFn: (id: string) => reimbursementService.submitReimbursement(id),
    onSuccess: (_reimbursement, id) => {
      invalidateReimbursement(id);
    },
  });
}

export function useCancelReimbursement() {
  const invalidateReimbursement = useReimbursementActionInvalidation();

  return useMutation({
    mutationFn: (id: string) => reimbursementService.cancelReimbursement(id),
    onSuccess: (_reimbursement, id) => {
      invalidateReimbursement(id);
    },
  });
}

export function useApproveReimbursement() {
  const invalidateReimbursement = useReimbursementActionInvalidation();

  return useMutation({
    mutationFn: (id: string) => reimbursementService.approveReimbursement(id),
    onSuccess: (_reimbursement, id) => {
      invalidateReimbursement(id);
    },
  });
}

export function useRejectReimbursement() {
  const invalidateReimbursement = useReimbursementActionInvalidation();

  return useMutation({
    mutationFn: ({ id, payload }: RejectReimbursementVariables) =>
      reimbursementService.rejectReimbursement(id, payload),
    onSuccess: (_reimbursement, variables) => {
      invalidateReimbursement(variables.id);
    },
  });
}

export function usePayReimbursement() {
  const invalidateReimbursement = useReimbursementActionInvalidation();

  return useMutation({
    mutationFn: (id: string) => reimbursementService.payReimbursement(id),
    onSuccess: (_reimbursement, id) => {
      invalidateReimbursement(id);
    },
  });
}
