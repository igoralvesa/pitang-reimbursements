export type UserRole = 'COLLABORATOR' | 'MANAGER' | 'FINANCE' | 'ADMIN';

export type RequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID'
  | 'CANCELED';

export type HistoryAction =
  | 'CREATED'
  | 'UPDATED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID'
  | 'CANCELED';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Attachment = {
  id: string;
  fileName: string;
  fileType: 'PDF' | 'JPG' | 'PNG';
  fileUrl: string;
};

export type RequestHistory = {
  id: string;
  reimbursementId: string;
  userId: string;
  action: HistoryAction;
  observation: string;
  createdAt: string;
};

export type ReimbursementRequest = {
  id: string;
  ownerId: string;
  categoryId: string;
  description: string;
  amount: number;
  expenseDate: string;
  status: RequestStatus;
  attachments: Attachment[];
  history: RequestHistory[];
  createdAt: string;
  updatedAt: string;
};

export type RequestFormValues = {
  categoryId: string;
  description: string;
  amount: number;
  expenseDate: string;
};
