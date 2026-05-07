import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { reimbursementService } from '@/services/reimbursementService';
import type { CreateReimbursementPayload, UpdateReimbursementPayload } from '@/types/api';

type UpdateReimbursementVariables = {
  id: string;
  payload: UpdateReimbursementPayload;
};

export function useReimbursements() {
  return useQuery({
    queryKey: queryKeys.reimbursements.lists(),
    queryFn: reimbursementService.listReimbursements,
  });
}

export function useReimbursement(id: string) {
  return useQuery({
    queryKey: queryKeys.reimbursements.detail(id),
    queryFn: () => reimbursementService.getReimbursement(id),
  });
}

export function useReimbursementHistory(id: string) {
  return useQuery({
    queryKey: queryKeys.reimbursements.history(id),
    queryFn: () => reimbursementService.getReimbursementHistory(id),
  });
}

export function useCreateReimbursement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReimbursementPayload) =>
      reimbursementService.createReimbursement(payload),
    onSuccess: (reimbursement) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reimbursements.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reimbursements.detail(reimbursement.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reimbursements.history(reimbursement.id),
      });
    },
  });
}

export function useUpdateReimbursement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateReimbursementVariables) =>
      reimbursementService.updateReimbursement(id, payload),
    onSuccess: (_reimbursement, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reimbursements.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reimbursements.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reimbursements.history(variables.id),
      });
    },
  });
}
