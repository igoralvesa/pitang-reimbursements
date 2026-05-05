import express from 'express';
import { requireRole } from '../middlewares/require-role.middleware';

import {
  deleteCategory,
  getCategories,
  postCategory,
  putCategory,
} from '../controllers/categories';

const categoryRouter = express.Router();

categoryRouter.get('/', getCategories);
categoryRouter.post('/', requireRole('ADMIN'), postCategory);
categoryRouter.put('/:id', requireRole('ADMIN'), putCategory);
categoryRouter.delete('/:id', requireRole('ADMIN'), deleteCategory);

export default categoryRouter;
