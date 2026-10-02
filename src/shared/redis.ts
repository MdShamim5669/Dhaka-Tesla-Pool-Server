import { createClient } from 'redis';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

let isReconnectionDisabled = false;

const clientOptions = config.REDIS_URL
  ? {
      url: config.REDIS_URL,
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries > 2) {
            isReconnectionDisabled = true;
            return false;
          }
          return Math.min(retries * 500, 2000);
        },
        connectTimeout: 2000,
      },
    }
  : {
      username: config.redis_user || undefined,
      password: config.redis_password || undefined,
      socket: {
        host: config.redis_host || '127.0.0.1',
        port: Number(config.redis_port) || 6379,
        reconnectStrategy: (retries: number) => {
          if (retries > 2) {
            isReconnectionDisabled = true;
            return false;
          }
          return Math.min(retries * 500, 2000);
        },
        connectTimeout: 2000,
      },
    };

export const redisClient = createClient(clientOptions);

let hasLoggedRefusal = false;

redisClient.on('error', (err: any) => {
  if (err && err.code === 'ECONNREFUSED') {
    if (!hasLoggedRefusal) {
      logger.warn('Redis is offline at 127.0.0.1:6379. Operating without local Redis cache.');
      hasLoggedRefusal = true;
    }
  } else {
    logger.error({ err }, 'Redis Client Error');
  }
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
    logger.warn('Redis connection failed (optional cache feature unavailable)');
  }
};

export default redisClient;
