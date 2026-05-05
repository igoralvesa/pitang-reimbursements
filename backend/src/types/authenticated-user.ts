import { Role } from './roles-enum';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: Role;
};
