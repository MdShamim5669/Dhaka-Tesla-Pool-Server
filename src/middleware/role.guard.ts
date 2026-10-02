import { Request, Response, NextFunction } from 'express';
import { AppError, ERROR_CODES } from '../utils/errors.js';
import { UserRole } from '../config/constants.js';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, ERROR_CODES.UNAUTHENTICATED, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'You do not have permission to access this resource');
    }

    next();
  };
}
