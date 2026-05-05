import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { prisma } from '../../../../src/core/prisma';
import { deleteCategory } from '../../../../src/http/controllers/categories/delete-category.controller';
import { getCategories } from '../../../../src/http/controllers/categories/get-categories.controller';
import { postCategory } from '../../../../src/http/controllers/categories/create-category.controller';
import { putCategory } from '../../../../src/http/controllers/categories/update-category.controller';

jest.mock('@/core/Logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/core/prisma', () => ({
  prisma: {
    category: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const categoryRepository = prisma.category as unknown as {
  create: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
  findMany: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
  findUnique: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
  update: jest.MockedFunction<(args: unknown) => Promise<unknown>>;
};

function makeResponse() {
  const response = {
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
  };

  return response as unknown as Parameters<typeof postCategory>[1];
}

describe('category controllers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a category as active by default', async () => {
    const category = {
      active: true,
      id: 'category-id',
      name: 'Transport',
    };

    categoryRepository.create.mockResolvedValue(category);

    const request = {
      body: { name: 'Transport' },
    } as Parameters<typeof postCategory>[0];
    const response = makeResponse();

    await postCategory(request, response);

    expect(categoryRepository.create).toHaveBeenCalledWith({
      data: {
        active: true,
        name: 'Transport',
      },
    });
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith(category);
  });

  it('ignores active from create payload and still creates an active category', async () => {
    categoryRepository.create.mockResolvedValue({
      active: true,
      id: 'category-id',
      name: 'Transport',
    });

    const request = {
      body: { active: false, name: 'Transport' },
    } as Parameters<typeof postCategory>[0];
    const response = makeResponse();

    await postCategory(request, response);

    expect(categoryRepository.create).toHaveBeenCalledWith({
      data: {
        active: true,
        name: 'Transport',
      },
    });
  });

  it('lists only active categories', async () => {
    const categories = [
      {
        active: true,
        id: 'category-id',
        name: 'Transport',
      },
    ];

    categoryRepository.findMany.mockResolvedValue(categories);

    await getCategories(
      {} as Parameters<typeof getCategories>[0],
      makeResponse(),
    );

    expect(categoryRepository.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      where: { active: true },
    });
  });

  it('updates only the category name', async () => {
    const category = {
      active: true,
      id: 'category-id',
      name: 'Meals',
    };

    categoryRepository.findUnique.mockResolvedValue(category);
    categoryRepository.update.mockResolvedValue(category);

    const request = {
      body: { active: false, name: 'Meals' },
      params: { id: 'category-id' },
    } as unknown as Parameters<typeof putCategory>[0];
    const response = makeResponse();

    await putCategory(request, response);

    expect(categoryRepository.update).toHaveBeenCalledWith({
      data: { name: 'Meals' },
      where: { id: 'category-id' },
    });
    expect(response.status).toHaveBeenCalledWith(200);
  });

  it('soft deletes a category by setting active to false', async () => {
    categoryRepository.findUnique.mockResolvedValue({
      active: true,
      id: 'category-id',
      name: 'Transport',
    });
    categoryRepository.update.mockResolvedValue({
      active: false,
      id: 'category-id',
      name: 'Transport',
    });

    const request = {
      params: { id: 'category-id' },
    } as unknown as Parameters<typeof deleteCategory>[0];
    const response = makeResponse();

    await deleteCategory(request, response);

    expect(categoryRepository.update).toHaveBeenCalledWith({
      data: { active: false },
      where: { id: 'category-id' },
    });
    expect(response.status).toHaveBeenCalledWith(204);
    expect(response.send).toHaveBeenCalled();
  });
});
