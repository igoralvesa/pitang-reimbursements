export type Role = 'COLLABORATOR' | 'MANAGER' | 'FINANCE' | 'ADMIN';

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

export type UserSummary = Pick<User, 'id' | 'name' | 'email' | 'role'>;

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

export type AuthenticatedUser = User;

export type Category = {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Attachment = {
  id: string;
  reimbursementId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  cloudinaryPublicId: string | null;
  createdAt: string;
};

export type HistoryEntry = {
  reimbursementRequestId: string;
  userId: string;
  action: HistoryAction;
  observation: string;
  createdAt: string;
};

export type ReimbursementHistoryEntry = HistoryEntry & {
  user?: UserSummary;
};

export type ReimbursementRequest = {
  id: string;
  requesterId: string;
  categoryId: string;
  description: string;
  amount: string | number;
  expenseDate: string;
  status: RequestStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  requester?: UserSummary;
  attachments?: Attachment[];
  histories?: ReimbursementHistoryEntry[];
};

export type ApiValidationError = Record<string, { errors: string[] }>;

export type ApiError = { message: string } | ApiValidationError;

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type ReimbursementSortBy = 'createdAt' | 'expenseDate' | 'amount';

export type SortOrder = 'asc' | 'desc';

export type GetUsersParams = {
  page?: number;
  limit?: number;
  name?: string;
  role?: Role | '';
};

export type GetCategoriesParams = {
  page?: number;
  limit?: number;
  name?: string;
};

export type GetReimbursementsParams = {
  page?: number;
  limit?: number;
  collaboratorId?: string;
  categoryId?: string;
  status?: RequestStatus | '';
  sortBy?: ReimbursementSortBy;
  sortOrder?: SortOrder;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role?: Role;
};

export type UpdateUserPayload = Partial<{
  name: string;
  email: string;
  password: string;
}>;

export type PromoteUserPayload = {
  role: Role;
};

export type CreateCategoryPayload = {
  name: string;
};

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export type CreateReimbursementPayload = {
  amount: number | string;
  categoryId: string;
  description: string;
  expenseDate: string;
};

export type UpdateReimbursementPayload = Partial<CreateReimbursementPayload>;

export type RejectReimbursementPayload = {
  rejectionReason: string;
};

export type UploadAttachmentPayload = {
  file: File;
};
