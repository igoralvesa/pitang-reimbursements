export type AuthenticatedUser = {
  id: string;
  email: string;
  role: 'ADMIN' | 'COLLABORATOR' | 'MANAGER' | 'FINANCE';
};
