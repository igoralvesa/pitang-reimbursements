import type { ReimbursementRequest, User } from '@/types/domain';

export function canCreateRequest(user: User | null) {
  return user?.role === 'COLLABORATOR';
}

export function canEditRequest(user: User | null, request: ReimbursementRequest) {
  return user?.role === 'COLLABORATOR' && request.ownerId === user.id && request.status === 'DRAFT';
}

export function canSubmitRequest(user: User | null, request: ReimbursementRequest) {
  return canEditRequest(user, request);
}

export function canCancelRequest(user: User | null, request: ReimbursementRequest) {
  return canEditRequest(user, request);
}

export function canApproveRequest(user: User | null, request: ReimbursementRequest) {
  return user?.role === 'MANAGER' && request.status === 'SUBMITTED';
}

export function canRejectRequest(user: User | null, request: ReimbursementRequest) {
  return canApproveRequest(user, request);
}

export function canPayRequest(user: User | null, request: ReimbursementRequest) {
  return user?.role === 'FINANCE' && request.status === 'APPROVED';
}

export function canManageCategories(user: User | null) {
  return user?.role === 'ADMIN';
}

export function canManageUsers(user: User | null) {
  return user?.role === 'ADMIN';
}
