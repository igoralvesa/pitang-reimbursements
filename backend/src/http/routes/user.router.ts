import express from 'express';
import { Role } from '../../types/roles-enum';
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

userRouter.post('/', requireRole(Role.ADMIN), postUser);
userRouter.post('/:id/promote', requireRole(Role.ADMIN), promoteUser);
userRouter.get('/', requireRole(Role.ADMIN), getUsers);
userRouter.get('/:id', requireRole(Role.ADMIN), getUser);
userRouter.patch('/:id', requireRole(Role.ADMIN), patchUser);
userRouter.delete('/:id', requireRole(Role.ADMIN), deleteUser);

export default userRouter;
