import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { initCronJobs } from './cron/index.js';
import { connectRedis } from './shared/redis.js';

const PORT = env.PORT;

const server = app.listen(PORT, async () => {
  logger.info(`Dhaka Tesla Pool Backend API is running on http://localhost:${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/api/v1/health`);

  // Initialize background scheduled tasks
  initCronJobs();

  // Connect to Redis if configured
  await connectRedis();
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Closing HTTP server.');
  server.close(() => {
    logger.info('HTTP server closed.');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received. Closing HTTP server.');
  server.close(() => {
    logger.info('HTTP server closed.');
  });
});
