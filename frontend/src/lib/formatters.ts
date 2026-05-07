import type { HistoryAction, RequestStatus, UserRole } from '@/types/domain';

export const roleLabels: Record<UserRole, string> = {
  COLLABORATOR: 'Colaborador',
  MANAGER: 'Gestor',
  FINANCE: 'Financeiro',
  ADMIN: 'Administrador',
};

export const statusLabels: Record<RequestStatus, string> = {
  DRAFT: 'Rascunho',
  SUBMITTED: 'Enviado',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  PAID: 'Pago',
  CANCELED: 'Cancelado',
};

export const historyActionLabels: Record<HistoryAction, string> = {
  CREATED: 'Criado',
  UPDATED: 'Atualizado',
  SUBMITTED: 'Enviado',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  PAID: 'Pago',
  CANCELED: 'Cancelado',
};

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00.000Z`));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
