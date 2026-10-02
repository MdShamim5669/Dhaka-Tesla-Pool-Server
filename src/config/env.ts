import dotenv from 'dotenv';
import { AppError, ERROR_CODES } from '../utils/errors.js';
import { EnvConfig } from './env.interface.js';

dotenv.config();

const loadEnvVariables = (): EnvConfig => {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';

  // In production, strictly enforce these environment variables
  if (nodeEnv === 'production') {
    const requiredEnvVariables = [
      'DATABASE_URL',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
    ];

    requiredEnvVariables.forEach((variable) => {
      if (!process.env[variable]) {
        throw new AppError(
          500,
          ERROR_CODES.INTERNAL_SERVER_ERROR,
          `Environment variable ${variable} is required but not set in .env file.`
        );
      }
    });
  }

  const port = Number(process.env.PORT || '5000');
  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/dhaka_tesla_pool?schema=public';

  const accessTokenSecret =
    process.env.ACCESS_TOKEN_SECRET ||
    process.env.JWT_ACCESS_SECRET ||
    'super-secret-jwt-access-token-key-change-in-production';

  const refreshTokenSecret =
    process.env.REFRESH_TOKEN_SECRET ||
    process.env.JWT_REFRESH_SECRET ||
    'super-secret-jwt-refresh-token-key-change-in-production';

  const accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || process.env.ACCESS_TTL || '15m';
  const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || process.env.REFRESH_TTL || '7d';

  const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';

  const baseFarePaisa = Number(process.env.BASE_FARE_PAISA || '5000');
  const perKmRatePaisa = Number(process.env.PER_KM_RATE_PAISA || '1800');
  const discountBps = Number(process.env.DISCOUNT_BPS || '2000');

  const redisUrl = process.env.REDIS_URL || undefined;
  const redisHost = process.env.REDIS_HOST || '127.0.0.1';
  const redisPort = process.env.REDIS_PORT || '6379';
  const redisUser = process.env.REDIS_USER || process.env.REDIS_USERNAME || undefined;
  const redisPassword = process.env.REDIS_PASSWORD || undefined;

  const redisAgentMemoryServerUrl = process.env.REDIS_AGENT_MEMORY_SERVER_URL || 'https://aws-us-east-1.memory.redis.io';
  const redisAgentMemoryStoreId = process.env.REDIS_AGENT_MEMORY_STORE_ID || '2c867aacb7ae42d79946c4a09e6d4624';
  const redisAgentMemoryApiKey = process.env.REDIS_AGENT_MEMORY_API_KEY || undefined;

  const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
  const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY || '';
  const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET || '';

  const sslcommerzStoreId =
    (process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_ID !== 'testbox'
      ? process.env.SSLCOMMERZ_STORE_ID
      : process.env.STORE_ID) ||
    process.env.SSLCOMMERZ_STORE_ID ||
    'testbox';

  const sslcommerzStorePass =
    (process.env.SSLCOMMERZ_STORE_PASS && process.env.SSLCOMMERZ_STORE_PASS !== 'qwerty'
      ? process.env.SSLCOMMERZ_STORE_PASS
      : process.env.STORE_PASSWORD || process.env.STORE_PASS) ||
    process.env.SSLCOMMERZ_STORE_PASS ||
    'qwerty';

  const sslcommerzIsLive =
    process.env.SSLCOMMERZ_IS_LIVE === 'true' || process.env.SSL_IS_LIVE === 'true';

  const sslcommerzSuccessUrl = process.env.SSLCOMMERZ_SUCCESS_URL || `http://localhost:${port}/api/v1/wallet/topup/success`;
  const sslcommerzFailUrl = process.env.SSLCOMMERZ_FAIL_URL || `http://localhost:${port}/api/v1/wallet/topup/fail`;
  const sslcommerzCancelUrl = process.env.SSLCOMMERZ_CANCEL_URL || `http://localhost:${port}/api/v1/wallet/topup/cancel`;
  const sslcommerzIpnUrl = process.env.SSLCOMMERZ_IPN_URL || `http://localhost:${port}/api/v1/wallet/topup/ipn`;

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: databaseUrl,
    ACCESS_TOKEN_SECRET: accessTokenSecret,
    REFRESH_TOKEN_SECRET: refreshTokenSecret,
    ACCESS_TOKEN_EXPIRES_IN: accessTokenExpiresIn,
    REFRESH_TOKEN_EXPIRES_IN: refreshTokenExpiresIn,
    JWT_ACCESS_SECRET: accessTokenSecret,
    JWT_REFRESH_SECRET: refreshTokenSecret,
    ACCESS_TTL: accessTokenExpiresIn,
    REFRESH_TTL: refreshTokenExpiresIn,
    FRONTEND_URL: frontendUrl,
    CORS_ORIGIN: frontendUrl,
    BASE_FARE_PAISA: baseFarePaisa,
    PER_KM_RATE_PAISA: perKmRatePaisa,
    DISCOUNT_BPS: discountBps,
    REDIS_URL: redisUrl,
    REDIS_HOST: redisHost,
    REDIS_PORT: redisPort,
    REDIS_USER: redisUser,
    REDIS_PASSWORD: redisPassword,
    REDIS_AGENT_MEMORY_SERVER_URL: redisAgentMemoryServerUrl,
    REDIS_AGENT_MEMORY_STORE_ID: redisAgentMemoryStoreId,
    REDIS_AGENT_MEMORY_API_KEY: redisAgentMemoryApiKey,
    redis_host: redisHost,
    redis_port: redisPort,
    redis_user: redisUser,
    redis_password: redisPassword,
    CLOUDINARY: {
      CLOUDINARY_CLOUD_NAME: cloudinaryCloudName,
      CLOUDINARY_API_KEY: cloudinaryApiKey,
      CLOUDINARY_API_SECRET: cloudinaryApiSecret,
    },
    CLOUDINARY_CLOUD_NAME: cloudinaryCloudName,
    CLOUDINARY_API_KEY: cloudinaryApiKey,
    CLOUDINARY_API_SECRET: cloudinaryApiSecret,
    REDIS: {
      HOST: redisHost,
      PORT: redisPort,
      USER: redisUser,
      PASSWORD: redisPassword,
    },
    FARES: {
      BASE_FARE_PAISA: baseFarePaisa,
      PER_KM_RATE_PAISA: perKmRatePaisa,
      DISCOUNT_BPS: discountBps,
    },
    SSLCOMMERZ_STORE_ID: sslcommerzStoreId,
    SSLCOMMERZ_STORE_PASS: sslcommerzStorePass,
    SSLCOMMERZ_IS_LIVE: sslcommerzIsLive,
    SSLCOMMERZ_SUCCESS_URL: sslcommerzSuccessUrl,
    SSLCOMMERZ_FAIL_URL: sslcommerzFailUrl,
    SSLCOMMERZ_CANCEL_URL: sslcommerzCancelUrl,
    SSLCOMMERZ_IPN_URL: sslcommerzIpnUrl,
  };
};

export const envVars: EnvConfig = loadEnvVariables();
export const env: EnvConfig = envVars;
export const config: EnvConfig = envVars;

export default envVars;
