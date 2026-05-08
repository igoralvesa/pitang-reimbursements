import type { GetCategoriesParams, GetUsersParams } from '@/types/api';

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  users: {
    all: ['users'] as const,
    lists: (params?: GetUsersParams) => ['users', 'list', params ?? {}] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    lists: (params?: GetCategoriesParams) => ['categories', 'list', params ?? {}] as const,
  },
  reimbursements: {
    all: ['reimbursements'] as const,
    lists: () => ['reimbursements', 'list'] as const,
    detail: (id: string) => ['reimbursements', 'detail', id] as const,
    history: (id: string) => ['reimbursements', 'history', id] as const,
    attachments: (id: string) => ['reimbursements', 'attachments', id] as const,
  },
};
