import path from 'node:path';
import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { router } from './routes/index.js';
import { logger } from './utils/logger.js';

/**
 * Tiny in-memory per-IP rate limiter for the public API. Not a substitute for a
 * real gateway, but stops trivial hammering of the exposed endpoint. Behind a
 * proxy (cloudflared/Render) `trust proxy` makes `req.ip` the real client.
 */
function makeRateLimiter(windowMs: number, max: number) {
  const hits = new Map<string, number[]>();
  // Periodic sweep so the map can't grow unbounded (unref'd — won't hold the process open).
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [ip, times] of hits) {
      const kept = times.filter((t) => t > cutoff);
      if (kept.length === 0) hits.delete(ip); else hits.set(ip, kept);
    }
  }, windowMs).unref?.();

  return (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const ip = req.ip ?? 'unknown';
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(ip, recent);
    if (recent.length > max) {
      res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' } });
      return;
    }
    next();
  };
}

export function createApp(): express.Application {
  const app = express();

  // Behind cloudflared / Render, honour X-Forwarded-For so req.ip is the real client.
  app.set('trust proxy', true);
  app.disable('x-powered-by');

  // Security headers (hand-rolled — no extra deps). The client is a self-contained
  // same-origin bundle, so a strict script-src is safe.
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data:; font-src 'self' data:; connect-src 'self'; " +
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
    );
    next();
  });

  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  // Rate-limit the API only (not static assets): 150 requests / 10s per client.
  app.use('/api', makeRateLimiter(10_000, 150));

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
