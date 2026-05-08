import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import { getCategoriesQuerySchema } from '@/schemas/category.schema';
import type { Request, Response } from 'express';
import z from 'zod';

export async function getCategories(request: Request, response: Response) {
  const { data: query, error } = getCategoriesQuerySchema.safeParse(request.query);

  if (error) {
    logger.warn(
      { fields: Object.keys(z.treeifyError(error).properties ?? {}) },
      'Parâmetros inválidos para consulta de categorias',
    );

    return response.status(400).json(z.treeifyError(error).properties);
  }

  const where = {
    active: true,
    ...(query.name
      ? {
          name: {
            contains: query.name,
            mode: 'insensitive' as const,
          },
        }
      : {}),
  };
  const skip = (query.page - 1) * query.limit;
  const [total, categories] = await prisma.$transaction([
    prisma.category.count({ where }),
    prisma.category.findMany({
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
  }, 'Categorias consultadas');

  return response.json({
    data: categories,
    meta: {
      limit: query.limit,
      page: query.page,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}
