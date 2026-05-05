import express from 'express';
import { requireRole } from '../middlewares/require-role.middleware';

import {
  deleteCategory,
  getCategories,
  postCategory,
  putCategory,
} from '../controllers/categories';

const categoryRouter = express.Router();
const requireAdmin = requireRole('ADMIN');

categoryRouter.get('/', getCategories);
categoryRouter.post('/', requireAdmin, postCategory);
categoryRouter.put('/:id', requireAdmin, putCategory);
categoryRouter.delete('/:id', requireAdmin, deleteCategory);

export default categoryRouter;
