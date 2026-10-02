import { Request, Response, CookieOptions } from 'express';
import { env } from '../config/env.js';

export const defaultCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
};

export const CookieUtils = {
  /**
   * Set a cookie on response
   */
  setCookie(
    res: Response,
    name: string,
    value: string,
    options: CookieOptions = {}
  ): void {
    res.cookie(name, value, {
      ...defaultCookieOptions,
      ...options,
    });
  },

  /**
   * Get a cookie from request
   */
  getCookie(req: Request, name: string): string | undefined {
    return req.cookies?.[name] || undefined;
  },

  /**
   * Clear a cookie from response
   */
  clearCookie(
    res: Response,
    name: string,
    options: CookieOptions = {}
  ): void {
    res.clearCookie(name, {
      ...defaultCookieOptions,
      ...options,
    });
  },

  /**
   * Set refresh token cookie with 7 days expiration
   */
  setRefreshTokenCookie(res: Response, refreshToken: string): void {
    this.setCookie(res, 'refreshToken', refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  },

  /**
   * Clear refresh token cookie
   */
  clearRefreshTokenCookie(res: Response): void {
    this.clearCookie(res, 'refreshToken');
  },
};

export const {
  setCookie,
  getCookie,
  clearCookie,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = CookieUtils;

export default CookieUtils;
