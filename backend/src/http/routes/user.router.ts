import express from 'express';

import {
  deleteUser,
  getUser,
  getUsers,
  patchUser,
  postUser,
} from '../controllers/users';

const userRouter = express.Router();

userRouter.post('/users', postUser);
userRouter.get('/users', getUsers);
userRouter.get('/users/:id', getUser);
userRouter.patch('/users/:id', patchUser);
userRouter.delete('/users/:id', deleteUser);

export default userRouter;
