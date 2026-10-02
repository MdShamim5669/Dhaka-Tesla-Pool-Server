import { createClient } from 'redis';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

export const redisClient = config.REDIS_URL
  ? createClient({ url: config.REDIS_URL })
  : createClient({
      username: config.redis_user || undefined,
      password: config.redis_password || undefined,
      socket: {
        host: config.redis_host || '127.0.0.1',
        port: Number(config.redis_port) || 6379,
      },
    });

redisClient.on('error', (err) => {
  logger.error({ err }, 'Redis Client Error');
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

export const connectRedis = async (): Promise<void> => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    logger.warn({ error }, 'Redis connection failed (optional cache feature unavailable)');
  }
};

export default redisClient;
