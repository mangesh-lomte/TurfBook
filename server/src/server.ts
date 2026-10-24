import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { logger } from './common/utils/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`⚽ TurfBook API server running on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`📖 Swagger API Docs available at http://localhost:${env.PORT}/api-docs`);
  logger.info(`🩺 Health check available at http://localhost:${env.PORT}/health`);
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Database connections closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during database disconnect', err);
      process.exit(1);
    }
  });

  // Force shutdown after 10s
  setTimeout(() => {
    logger.error('Forcefully shutting down after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
