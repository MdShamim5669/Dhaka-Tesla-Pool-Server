import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import { notFound } from './middleware/notFound.js';
import { sendSuccess } from './utils/response.js';
import { prisma } from './db/prisma.js';

// Route imports
import { authRoutes } from './modules/auth/auth.routes.js';
import { zonesRoutes } from './modules/zones/zones.routes.js';
import { faresRoutes } from './modules/fares/fares.routes.js';
import { ridesRoutes } from './modules/rides/rides.routes.js';
import { driversRoutes } from './modules/drivers/drivers.routes.js';
import { driverPoolsRoutes } from './modules/pools/pools.routes.js';
import { walletRoutes } from './modules/wallet/wallet.routes.js';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID attachment
app.use((req, res, next) => {
  res.locals.requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  next();
});

// Root welcome & status endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dhaka Tesla Pool Backend API is running successfully!',
    data: {
      name: 'Dhaka Tesla Pool API',
      version: '1.0.0',
      status: 'active',
      health: '/api/v1/health',
      timestamp: new Date().toISOString(),
    },
  });
});

// Direct health check endpoint
app.get('/health', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    sendSuccess(res, {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// Health check endpoint
app.get('/api/v1/health', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    sendSuccess(res, {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// Base API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/zones', zonesRoutes);
app.use('/api/v1/fares', faresRoutes);
app.use('/api/v1/rides', ridesRoutes);
app.use('/api/v1/drivers', driversRoutes);
app.use('/api/v1/driver', driverPoolsRoutes);
app.use('/api/v1/wallet', walletRoutes);

// 404 Route Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

export default app;
