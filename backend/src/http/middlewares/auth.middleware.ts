import jsonwebtoken from 'jsonwebtoken';

import { logger } from '../../core/Logger';
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
    logger.warn(
      { method: request.method, path: request.path },
      'Authorization header ausente',
    );

    return response.status(401).json({ message: authMessage });
  }

  const [scheme, token, ...extraParts] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token || extraParts.length > 0) {
    logger.warn(
      { method: request.method, path: request.path },
      'Authorization header com formato inválido',
    );

    return response.status(401).json({ message: authMessage });
  }

  try {
    request.loggedUser = jsonwebtoken.verify(
      token,
      environment.JWT_SECRET,
    ) as AuthenticatedUser;

    logger.info(
      {
        method: request.method,
        path: request.path,
        userId: request.loggedUser.id,
        role: request.loggedUser.role,
      },
      'Usuário autenticado',
    );

    next();
  } catch (error) {
    logger.warn(
      {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        method: request.method,
        path: request.path,
      },
      'Token inválido',
    );

    response.status(401).json({ message: authMessage });
  }
}
