import 'express';

import type { AuthenticatedUser } from './authenticated-user';

declare module 'express-serve-static-core' {
  interface Request {
    loggedUser?: AuthenticatedUser;
  }
}

export {};
