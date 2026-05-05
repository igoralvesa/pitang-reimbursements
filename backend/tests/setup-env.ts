import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testEnvPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '.env.test',
);

config({ path: testEnvPath, override: true });
