import jsonwebtoken from 'jsonwebtoken';

import { environment } from '../../core/EnvVars';
import type { AuthenticatedUser } from '../../types/authenticated-user';

import type { NextFunction, Request, Response } from 'express';

const allowedPaths = {
  GET: ['/'],
  POST: ['/auth/login', '/users'],
  PUT: [],
} as const;

function matchPath(path: string, pattern: string): boolean {
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -1);
    return path.startsWith(prefix);
  }

  return path === pattern;
}

export function authMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const paths = allowedPaths[request.method as keyof typeof allowedPaths] ?? [];

  if (paths.some((path) => matchPath(request.path, path))) {
    return next();
  }

  const {
    headers: { authorization },
  } = request;

  const authMessage = 'Não autorizado';

  if (!authorization) {
    return response.status(401).json({ message: authMessage });
  }

  const [scheme, token, ...extraParts] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token || extraParts.length > 0) {
    return response.status(401).json({ message: authMessage });
  }

  try {
    request.loggedUser = jsonwebtoken.verify(
      token,
      environment.JWT_SECRET,
    ) as AuthenticatedUser;

    next();
  } catch {
    response.status(401).json({ message: authMessage });
  }
}
