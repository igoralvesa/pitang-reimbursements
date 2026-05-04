import express from 'express';

import { login } from '../controllers/auth';

const authRouter = express.Router();

authRouter.post('/auth/login', login);

export default authRouter;
