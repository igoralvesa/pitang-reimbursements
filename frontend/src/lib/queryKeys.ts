export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => ['users', 'list'] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    lists: () => ['categories', 'list'] as const,
  },
  reimbursements: {
    all: ['reimbursements'] as const,
    lists: () => ['reimbursements', 'list'] as const,
    detail: (id: string) => ['reimbursements', 'detail', id] as const,
    history: (id: string) => ['reimbursements', 'history', id] as const,
    attachments: (id: string) => ['reimbursements', 'attachments', id] as const,
  },
};
