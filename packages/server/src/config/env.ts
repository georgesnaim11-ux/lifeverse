import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

/**
 * Environment configuration — validated once at boot, then frozen.
 *
 * The server refuses to start with invalid config rather than failing deep in a
 * request handler. Import `env` anywhere; never read `process.env` directly.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
/** Server package root: src/config -> src -> <package root>. */
const packageRoot = path.resolve(here, '..', '..');

// Load .env from the server package root if present (no-op in production where
// real environment variables are injected).
const dotenvPath = path.join(packageRoot, '.env');
if (existsSync(dotenvPath)) {
  dotenv.config({ path: dotenvPath });
} else {
  dotenv.config();
}

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  DATABASE_PATH: z.string().min(1).default('./data/lifeverse.db'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  // Fail loudly and clearly before anything else runs.
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

const raw = parsed.data;

/** Resolve the database path to an absolute location under the package root. */
const databaseFile = path.isAbsolute(raw.DATABASE_PATH)
  ? raw.DATABASE_PATH
  : path.resolve(packageRoot, raw.DATABASE_PATH);

export const env = Object.freeze({
  nodeEnv: raw.NODE_ENV,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  port: raw.PORT,
  corsOrigins: raw.CORS_ORIGIN,
  logLevel: raw.LOG_LEVEL,
  /** Absolute path to the SQLite database file. */
  databaseFile,
  /** Server package root, useful for resolving sibling assets. */
  packageRoot,
});

export type Env = typeof env;
