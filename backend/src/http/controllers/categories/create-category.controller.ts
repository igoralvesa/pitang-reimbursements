import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import { createCategorySchema } from '@/schemas/category.schema';
import type { Request, Response } from 'express';
import z from 'zod';

export async function postCategory(request: Request, response: Response) {
  const { data, error } = createCategorySchema.safeParse(request.body);

  if (error) {
    logger.warn(
      { fields: Object.keys(z.treeifyError(error).properties ?? {}) },
      'Dados inválidos para criação de categoria',
    );

    return response.status(400).json(z.treeifyError(error).properties);
  }

  const category = await prisma.category.create({
    data: {
      active: true,
      name: data.name,
    },
  });

  logger.info(
    { categoryId: category.id, name: category.name },
    'Categoria criada',
  );

  return response.status(201).json(category);
}
