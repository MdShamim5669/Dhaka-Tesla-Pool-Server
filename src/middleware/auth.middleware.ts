import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError, ERROR_CODES } from '../utils/errors.js';

export interface AuthUser {
  id: string;
  role: 'PASSENGER' | 'DRIVER';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, ERROR_CODES.UNAUTHENTICATED, 'Missing or invalid authorization header');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; role: 'PASSENGER' | 'DRIVER' };
    req.user = {
      id: payload.sub,
      role: payload.role,
    };
    next();
  } catch (_err) {
    throw new AppError(401, ERROR_CODES.UNAUTHENTICATED, 'Invalid or expired access token');
  }
}
