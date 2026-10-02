import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';
import { registerSchema, loginSchema } from './auth.schema.js';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);

router.post('/login', authRateLimiter, validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

router.post('/refresh', (req, res, next) =>
  authController.refresh(req, res, next)
);

router.post('/logout', (req, res, next) =>
  authController.logout(req, res, next)
);

router.get('/me', authenticate, (req, res, next) =>
  authController.getMe(req, res, next)
);

export const authRoutes = router;
