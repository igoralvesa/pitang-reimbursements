import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import userRouter from './http/routes/user.router';

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
// app.use(authMiddleware);

app.get('/', (request, response) => {
  response.send({ message: 'Hello world' });
});

app.use(userRouter);
// app.use('/api', postRouter);

// app.use(errorFallbackMiddleware);

export { app };
