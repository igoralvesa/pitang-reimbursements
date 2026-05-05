import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import { updateCategorySchema } from '@/schemas/category.schema';
import type { Request, Response } from 'express';
import z from 'zod';

export async function putCategory(request: Request, response: Response) {
  const id = request.params.id as string;

  const { data, error } = updateCategorySchema.safeParse(request.body);

  if (error) {
    logger.warn(
      { categoryId: id, fields: Object.keys(z.treeifyError(error).properties ?? {}) },
      'Dados inválidos para atualização de categoria',
    );

    return response.status(400).json(z.treeifyError(error).properties);
  }

  const categoryExists = await prisma.category.findUnique({ where: { id } });

  if (!categoryExists) {
    logger.warn({ categoryId: id }, 'Tentativa de atualizar categoria inexistente');

    return response.status(404).json({ message: 'Categoria não encontrada' });
  }

  const category = await prisma.category.update({
    data,
    where: { id },
  });

  logger.info(
    { categoryId: category.id, fields: Object.keys(data) },
    'Categoria atualizada',
  );

  return response.status(200).json(category);
}
