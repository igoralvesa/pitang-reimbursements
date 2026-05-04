import express from 'express';

import {
  deleteUser,
  getUser,
  getUsers,
  login,
  patchUser,
  postUser,
} from '../controllers/users';

const authRouter = express.Router();
const userRouter = express.Router();

authRouter.post('/auth/login', login);

userRouter.post('/users', postUser);
userRouter.get('/users', getUsers);
userRouter.get('/users/:id', getUser);
userRouter.patch('/users/:id', patchUser);
userRouter.delete('/users/:id', deleteUser);

export { authRouter, userRouter };
