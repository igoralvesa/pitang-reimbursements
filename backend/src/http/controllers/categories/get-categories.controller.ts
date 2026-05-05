import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import type { Request, Response } from 'express';

export async function getCategories(_request: Request, response: Response) {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    where: { active: true },
  });

  logger.info({ total: categories.length }, 'Categorias consultadas');

  return response.json(categories);
}
