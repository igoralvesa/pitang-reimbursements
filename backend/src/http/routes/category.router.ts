import express from 'express';
import { Role } from '../../types/roles-enum';
import { requireRole } from '../middlewares/require-role.middleware';

import {
  deleteCategory,
  getCategories,
  postCategory,
  putCategory,
} from '../controllers/categories';

const categoryRouter = express.Router();

categoryRouter.get('/', getCategories);
categoryRouter.post('/', requireRole(Role.ADMIN), postCategory);
categoryRouter.put('/:id', requireRole(Role.ADMIN), putCategory);
categoryRouter.delete('/:id', requireRole(Role.ADMIN), deleteCategory);

export default categoryRouter;
