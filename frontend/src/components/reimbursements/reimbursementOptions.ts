import type { RequestStatus, Role } from '@/types/api';

export const reimbursementStatusLabels: Record<RequestStatus, string> = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Enviado',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  PAID: 'Pago',
  CANCELED: 'Cancelado',
};

export const reimbursementHistoryActionLabels = {
  CREATED: 'Criado',
  UPDATED: 'Atualizado',
  SUBMITTED: 'Enviado',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  PAID: 'Pago',
  CANCELED: 'Cancelado',
} as const;

const allStatuses: RequestStatus[] = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'PAID',
  'CANCELED',
];

export function getStatusOptionsForRole(role: Role): RequestStatus[] {
  if (role === 'MANAGER') {
    return ['SUBMITTED', 'APPROVED', 'REJECTED'];
  }

  if (role === 'FINANCE') {
    return ['APPROVED', 'PAID'];
  }

  return allStatuses;
}
