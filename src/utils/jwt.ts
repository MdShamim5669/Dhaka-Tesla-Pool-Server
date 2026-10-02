/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { IJwtVerifyResult } from './utils.interface.js';

export const jwtUtils = {
  /**
   * Sign a new JWT token
   */
  generateToken(
    payload: object,
    secret: string = env.JWT_ACCESS_SECRET,
    expiresIn: string | number = env.ACCESS_TOKEN_EXPIRES_IN || '15m'
  ): string {
    const options: SignOptions = {
      expiresIn: expiresIn as any,
    };
    return jwt.sign(payload, secret, options);
  },

  /**
   * Safely verify a JWT token and return success boolean with data or error message
   */
  verifyToken<T = any>(token: string, secret: string = env.JWT_ACCESS_SECRET): IJwtVerifyResult<T> {
    try {
      const decoded = jwt.verify(token, secret) as T;
      return {
        success: true,
        data: decoded,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Invalid or expired token',
      };
    }
  },

  /**
   * Decode token without verifying signature
   */
  decodeToken<T = any>(token: string): T | null {
    try {
      return jwt.decode(token) as T;
    } catch {
      return null;
    }
  },
};

export const { generateToken, verifyToken, decodeToken } = jwtUtils;
export default jwtUtils;
