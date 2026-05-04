import express from 'express';

import {
  deleteUser,
  getUser,
  getUsers,
  login,
  patchUser,
  postUser,
} from '../controllers/users';

const userRouter = express.Router();

userRouter.post('/auth/login', login);
userRouter.get('/users', getUsers);
userRouter.get('/users/:id', getUser);
userRouter.post('/users', postUser);
userRouter.patch('/users/:id', patchUser);
userRouter.delete('/users/:id', deleteUser);

export default userRouter;
