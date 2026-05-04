import jsonwebtoken from 'jsonwebtoken';

import { environment } from '../../core/EnvVars';
import type { AuthenticatedUser } from '../../types/authenticated-user';

import type { NextFunction, Request, Response } from 'express';

export function authMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
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
