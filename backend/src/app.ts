import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { authMiddleware } from './http/middlewares/auth.middleware';
import userRouter from './http/routes/user.router';
import authRouter from './http/routes/auth.router';

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
  response.send({ message: 'Hello world' });
});

app.use(authRouter);

app.use(authMiddleware);

app.use(userRouter);
// app.use('/api', postRouter);

// app.use(errorFallbackMiddleware);

export { app };
