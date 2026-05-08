import type { Request, Response } from 'express';
import z from 'zod';
import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import { getUsersQuerySchema } from '@/schemas/user.schema';

export async function getUsers(request: Request, response: Response) {
  const { data: query, error } = getUsersQuerySchema.safeParse(request.query);

  if (error) {
    logger.warn(
      { fields: Object.keys(z.treeifyError(error).properties ?? {}) },
      'Parâmetros inválidos para consulta de usuários',
    );

    return response.status(400).json(z.treeifyError(error).properties);
  }

  const where = {
    ...(query.name
      ? {
          name: {
            contains: query.name,
            mode: 'insensitive' as const,
          },
        }
      : {}),
    ...(query.role ? { role: query.role } : {}),
  };
  const skip = (query.page - 1) * query.limit;
  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      omit: { passwordHash: true },
      orderBy: { name: 'asc' },
      skip,
      take: query.limit,
      where,
    }),
  ]);

  logger.info({
    limit: query.limit,
    page: query.page,
    total,
  }, 'Usuários consultados');

  return response.json({
    data: users,
    meta: {
      limit: query.limit,
      page: query.page,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}
