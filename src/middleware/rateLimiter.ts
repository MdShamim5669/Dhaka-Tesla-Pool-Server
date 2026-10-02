import rateLimit from 'express-rate-limit';
import { AppError, ERROR_CODES } from '../utils/errors.js';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError(429, ERROR_CODES.RATE_LIMITED, 'Too many attempts. Please try again after 15 minutes.'));
  },
});
