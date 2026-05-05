import { logger } from '@/core/Logger';
import { prisma } from '@/core/prisma';
import type { Request, Response } from 'express';

export async function deleteCategory(request: Request, response: Response) {
  const id = request.params.id as string;

  const categoryExists = await prisma.category.findUnique({ where: { id } });

  if (!categoryExists) {
    logger.warn({ categoryId: id }, 'Tentativa de excluir categoria inexistente');

    return response.status(404).json({ message: 'Categoria não encontrada' });
  }

  const category = await prisma.category.update({
    data: { active: false },
    where: { id },
  });

  logger.info({ categoryId: category.id }, 'Categoria desativada');

  return response.status(204).send();
}
