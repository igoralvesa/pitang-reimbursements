import type { AuthenticatedUser } from '../../types/authenticated-user';
import type { NextFunction, Request, Response } from 'express';
import { logger } from '../../core/Logger';

type Role = AuthenticatedUser['role'];

export function requireRole(...allowedRoles: Role[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    const { loggedUser } = request;

    if (!loggedUser) {
      logger.warn(
        { method: request.method, path: request.path },
        'Usuário não autenticado tentou acessar rota protegida por perfil',
      );

      return response.status(401).json({
        message: 'Usuário não autenticado',
      });
    }

    if (!allowedRoles.includes(loggedUser.role)) {
      logger.warn(
        {
          allowedRoles,
          method: request.method,
          path: request.path,
          role: loggedUser.role,
          userId: loggedUser.id,
        },
        'Usuário sem permissão para acessar recurso',
      );

      return response.status(403).json({
        message: 'Usuário sem permissão para acessar este recurso',
      });
    }

    logger.info(
      {
        allowedRoles,
        method: request.method,
        path: request.path,
        role: loggedUser.role,
        userId: loggedUser.id,
      },
      'Acesso autorizado por perfil',
    );

    return next();
  };
}
