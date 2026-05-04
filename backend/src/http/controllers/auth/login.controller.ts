import { environment } from '@/core/EnvVars';
import { prisma } from '@/core/prisma';
import bcrypt from 'bcryptjs';
import jsonwebtoken from 'jsonwebtoken';
import type { Request, Response } from 'express';

export async function login(request: Request, response: Response) {
  const defaultMessage = 'Credenciais inválidas';

  const { email, password } = request.body;

  if (!email || !password) {
    return response.status(400).json({ message: defaultMessage });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return response.status(400).json({ message: defaultMessage });
  }

  if (bcrypt.compareSync(password, user.passwordHash)) {
    delete (user as any).password;

    return response.status(200).json({
      token: jsonwebtoken.sign(user, environment.JWT_SECRET, {
        expiresIn: '30minutes',
      }),
    });
  }

  response.status(400).json({ message: defaultMessage });
}
