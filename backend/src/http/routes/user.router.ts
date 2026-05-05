import express from 'express';
import { requireRole } from '../middlewares/require-role.middleware';

import {
  deleteUser,
  getUser,
  getUsers,
  patchUser,
  postUser,
} from '../controllers/users';

const userRouter = express.Router();
const requireAdmin = requireRole('ADMIN');

userRouter.post('/', requireAdmin, postUser);
userRouter.get('/', requireAdmin, getUsers);
userRouter.get('/:id', requireAdmin, getUser);
userRouter.patch('/:id', requireAdmin, patchUser);
userRouter.delete('/:id', requireAdmin, deleteUser);

export default userRouter;
