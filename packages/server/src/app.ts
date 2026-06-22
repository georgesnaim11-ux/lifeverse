import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { router } from './routes/index.js';
import { logger } from './utils/logger.js';

export function createApp(): express.Application {
  const app = express();

  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  // All game routes under /api
  app.use('/api', router);

  // Health check (useful for verifying the server is up)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found.' },
    });
  });

  // Global error handler — must have 4 params for Express to recognise it
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message },
    });
  });

  return app;
}
