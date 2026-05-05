import { describe, expect, it } from '@jest/globals';

import {
  createCategorySchema,
  updateCategorySchema,
} from '../../src/schemas/category.schema';

describe('category schemas', () => {
  it('allows creating a category with name only', () => {
    const result = createCategorySchema.safeParse({ name: 'Transport' });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({ name: 'Transport' });
    }
  });

  it('ignores active when creating a category', () => {
    const result = createCategorySchema.safeParse({
      active: false,
      name: 'Transport',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({ name: 'Transport' });
    }
  });

  it('allows updating only the category name', () => {
    const result = updateCategorySchema.safeParse({ name: 'Meals' });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({ name: 'Meals' });
    }
  });

  it('does not allow active-only updates', () => {
    const result = updateCategorySchema.safeParse({ active: false });

    expect(result.success).toBe(false);
  });
});
