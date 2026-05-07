import express from 'express';

import { authMe, login } from '../controllers/auth';
import { authMiddleware } from '../middlewares/auth.middleware';

const authRouter = express.Router();

authRouter.post('/login', login);
authRouter.get('/me', authMiddleware, authMe);

export default authRouter;
