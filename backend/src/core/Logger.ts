import pino from 'pino';
import { mkdirSync } from 'node:fs';

mkdirSync('logs', { recursive: true });

function createTransport(loggerName: string) {
  return pino.transport({
    targets: [
      {
        level: 'info',
        options: { destination: `logs/${loggerName}.log` },
        target: 'pino/file',
      },
    ],
  });
}

export const logger = pino(
  {
    msgPrefix: '[SERVER] ',
    redact: {
      paths: ['password', 'passwordHash', 'token', 'verificationToken'],
    },
  },
  createTransport('app'),
);
