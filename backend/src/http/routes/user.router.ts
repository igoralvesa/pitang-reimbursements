import express from 'express';
import { requireRole } from '../middlewares/require-role.middleware';

import {
  deleteUser,
  getUser,
  getUsers,
  patchUser,
  postUser,
  promoteUser,
} from '../controllers/users';

const userRouter = express.Router();

userRouter.post('/', requireRole('ADMIN'), postUser);
userRouter.post('/:id/promote', requireRole('ADMIN'), promoteUser);
userRouter.get('/', requireRole('ADMIN'), getUsers);
userRouter.get('/:id', requireRole('ADMIN'), getUser);
userRouter.patch('/:id', requireRole('ADMIN'), patchUser);
userRouter.delete('/:id', requireRole('ADMIN'), deleteUser);

export default userRouter;
