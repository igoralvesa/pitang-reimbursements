import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { reimbursementService } from '@/services/reimbursementService';
import type {
  CreateReimbursementPayload,
  GetReimbursementsParams,
  UpdateReimbursementPayload,
} from '@/types/api';

type UpdateReimbursementVariables = {
  id: string;
  payload: UpdateReimbursementPayload;
};

type QueryOptions = {
  enabled?: boolean;
};

export function useReimbursements(params?: GetReimbursementsParams, options?: QueryOptions) {
  return useQuery({
    queryKey: queryKeys.reimbursements.lists(params),
    queryFn: () => reimbursementService.listReimbursements(params),
    enabled: options?.enabled,
  });
}

export function useReimbursement(id?: string) {
  return useQuery({
    queryKey: queryKeys.reimbursements.detail(id ?? ''),
    queryFn: () => reimbursementService.getReimbursement(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useReimbursementHistory(id?: string) {
  return useQuery({
    queryKey: queryKeys.reimbursements.history(id ?? ''),
    queryFn: () => reimbursementService.getReimbursementHistory(id ?? ''),
    enabled: Boolean(id),
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
    onSuccess: (reimbursement, variables) => {
      queryClient.setQueryData(queryKeys.reimbursements.detail(variables.id), reimbursement);
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
