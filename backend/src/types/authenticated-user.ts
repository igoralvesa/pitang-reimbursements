export type AuthenticatedUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'COLABORADOR' | 'GESTOR' | 'FINANCEIRO';
};
