import { env } from './config/env.js';
import { closeDb, runMigrations } from './db/index.js';
import { logger } from './utils/logger.js';
import { createApp } from './app.js';

function boot(): void {
  logger.info(`Starting LifeVerse server (${env.nodeEnv})...`);

  // 1. Migrate schema
  runMigrations();

  // 2. Boot Express
  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`Server listening on http://localhost:${env.port}`);
    logger.info(`API base: http://localhost:${env.port}/api`);
  });

  // Graceful shutdown
  function shutdown(signal: string): void {
    logger.info(`Received ${signal}, shutting down…`);
    server.close(() => {
      closeDb();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

try {
  boot();
} catch (error) {
  logger.error('Fatal error during boot.', error);
  closeDb();
  process.exitCode = 1;
}
