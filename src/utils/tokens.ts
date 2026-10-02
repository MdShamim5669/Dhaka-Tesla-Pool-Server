import crypto from 'crypto';
import { env } from '../config/env.js';
import { jwtUtils } from './jwt.js';
import { ITokenPair } from './utils.interface.js';

export const tokenUtils = {
  /**
   * SHA-256 hash for secure refresh token storage
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  /**
   * Generate short-lived access token (default 15m)
   */
  generateAccessToken(userId: string, role: string): string {
    return jwtUtils.generateToken(
      { sub: userId, role },
      env.JWT_ACCESS_SECRET,
      env.ACCESS_TOKEN_EXPIRES_IN || '15m'
    );
  },

  /**
   * Generate raw random refresh token (opaque string)
   */
  generateRawRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  },

  /**
   * Generate full pair: access token, raw refresh token, token hash, and expiry
   */
  generateTokenPair(userId: string, role: string): ITokenPair {
    const accessToken = this.generateAccessToken(userId, role);
    const rawRefreshToken = this.generateRawRefreshToken();
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      tokenHash,
      expiresAt,
    };
  },
};

export const {
  hashToken,
  generateAccessToken,
  generateRawRefreshToken,
  generateTokenPair,
} = tokenUtils;

export default tokenUtils;
