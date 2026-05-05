import { environment } from '@/core/EnvVars';
import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import bcrypt from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import type { Request, Response } from 'express';
import type { AuthenticatedUser } from '../../../types/authenticated-user';
import { Role } from '../../../types/roles-enum';

export async function login(request: Request, response: Response) {
  const defaultMessage = 'Credenciais inválidas';

  const { email, password } = request.body;

  if (!email || !password) {
    logger.warn({ hasEmail: Boolean(email) }, 'Tentativa de login com dados incompletos');

    return response.status(400).json({ message: defaultMessage });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    logger.warn({ email }, 'Tentativa de login com usuário inexistente');

    return response.status(400).json({ message: defaultMessage });
  }

  if (bcrypt.compareSync(password, user.passwordHash)) {
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      role: Role[user.role],
    };

    logger.info(
      { email: user.email, role: user.role, userId: user.id },
      'Login realizado com sucesso',
    );

    return response.status(200).json({
      token: jsonwebtoken.sign(authenticatedUser, environment.JWT_SECRET, {
        expiresIn: '30minutes',
      }),
    });
  }

  logger.warn({ email: user.email, userId: user.id }, 'Tentativa de login com senha inválida');

  response.status(400).json({ message: defaultMessage });
}
