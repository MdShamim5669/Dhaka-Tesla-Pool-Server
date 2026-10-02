export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  ACCESS_TOKEN_SECRET: string;
  REFRESH_TOKEN_SECRET: string;
  ACCESS_TOKEN_EXPIRES_IN: string;
  REFRESH_TOKEN_EXPIRES_IN: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ACCESS_TTL: string;
  REFRESH_TTL: string;
  FRONTEND_URL: string;
  CORS_ORIGIN: string;
  BASE_FARE_PAISA: number;
  PER_KM_RATE_PAISA: number;
  DISCOUNT_BPS: number;
  REDIS_URL?: string;
  REDIS_HOST: string;
  REDIS_PORT: string;
  REDIS_USER?: string;
  REDIS_PASSWORD?: string;
  REDIS_AGENT_MEMORY_SERVER_URL?: string;
  REDIS_AGENT_MEMORY_STORE_ID?: string;
  REDIS_AGENT_MEMORY_API_KEY?: string;
  redis_host: string;
  redis_port: string;
  redis_user?: string;
  redis_password?: string;
  CLOUDINARY: {
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
  };
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  REDIS: {
    HOST: string;
    PORT: string;
    USER?: string;
    PASSWORD?: string;
  };
  FARES: {
    BASE_FARE_PAISA: number;
    PER_KM_RATE_PAISA: number;
    DISCOUNT_BPS: number;
  };
  SSLCOMMERZ_STORE_ID: string;
  SSLCOMMERZ_STORE_PASS: string;
  SSLCOMMERZ_IS_LIVE: boolean;
  SSLCOMMERZ_SUCCESS_URL: string;
  SSLCOMMERZ_FAIL_URL: string;
  SSLCOMMERZ_CANCEL_URL: string;
  SSLCOMMERZ_IPN_URL: string;
}
