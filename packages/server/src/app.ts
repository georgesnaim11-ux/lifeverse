import path from 'node:path';
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

  // In production the server also serves the built React client, so the whole
  // game is one origin (one URL) — fetch('/api/...') is same-origin, no proxy.
  // In dev the client runs under Vite on :5173 and proxies /api here instead.
  if (env.isProduction) {
    const clientDist = path.resolve(env.packageRoot, '..', 'client', 'dist');
    app.use(express.static(clientDist));
    // SPA fallback: any non-API GET returns index.html so the app boots.
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // 404 handler (unmatched /api routes, and everything in dev)
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
