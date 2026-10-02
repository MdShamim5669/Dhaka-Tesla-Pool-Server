/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../db/prisma.js';
import { AppError, ERROR_CODES } from '../utils/errors.js';

export interface JwtPayload {
  sub: string;
  role: Role;
  email?: string;
  iat?: number;
  exp?: number;
}

export const checkAuth = (...authRoles: Role[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Extract token from Authorization header or cookie
      let token: string | undefined;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
      }

      if (!token) {
        throw new AppError(
          401,
          ERROR_CODES.UNAUTHENTICATED,
          'Unauthorized access! No access token provided.'
        );
      }

      // 2. Verify JWT access token
      let payload: JwtPayload;
      try {
        payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      } catch (_err) {
        throw new AppError(
          401,
          ERROR_CODES.UNAUTHENTICATED,
          'Unauthorized access! Invalid or expired access token.'
        );
      }

      // 3. Verify user exists in database
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new AppError(
          401,
          ERROR_CODES.UNAUTHENTICATED,
          'Unauthorized access! User does not exist.'
        );
      }

      // 4. Role Authorization check
      if (authRoles.length > 0 && !authRoles.includes(user.role)) {
        throw new AppError(
          403,
          ERROR_CODES.FORBIDDEN,
          'Forbidden access! You do not have permission to access this resource.'
        );
      }

      // 5. Attach authenticated user to request
      req.user = {
        id: user.id,
        role: user.role,
      };

      next();
    } catch (error: any) {
      next(error);
    }
  };
};

export const CheckAuth = checkAuth;
export default checkAuth;
