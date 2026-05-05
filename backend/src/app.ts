import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger } from './core/Logger';
import { authMiddleware } from './http/middlewares/auth.middleware';
import userRouter from './http/routes/user.router';
import authRouter from './http/routes/auth.router';
import categoryRouter from './http/routes/category.router';
import reimbursementRouter from './http/routes/reimbursements.router';

const app = express();

app.use(express.json());

app.use(
  cors({
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    origin: '*',
  }),
);
app.use(morgan('dev'));
app.use(helmet());

app.get('/', (request, response) => {
  logger.info('Health check acessado');

  response.send({ message: 'Hello world' });
});

app.use('/auth', authRouter);

app.use(authMiddleware);

app.use('/users', userRouter);
app.use('/categories', categoryRouter);
app.use('/reimbursements', reimbursementRouter);

// app.use(errorFallbackMiddleware);

export { app };
