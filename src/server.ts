import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { initCronJobs } from './cron/index.js';

const PORT = env.PORT || 5000;

const server = app.listen(PORT, async () => {
  logger.info(`Dhaka Tesla Pool Backend API is running on http://localhost:${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/api/v1/health`);

  // Initialize background scheduled tasks
  initCronJobs();
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use by another process. Ensure previous node instances are stopped.`);
  } else {
    logger.error({ err }, 'Backend HTTP Server error');
  }
  process.exit(1);
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
