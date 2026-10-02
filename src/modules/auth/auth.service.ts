import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db/prisma.js';
import { env } from '../../config/env.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { RegisterInput, LoginInput } from './auth.schema.js';

export class AuthService {
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateTokens(userId: string, role: string) {
    const accessToken = jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return { accessToken, rawRefreshToken, tokenHash, expiresAt };
  }

  async register(data: RegisterInput) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, ...(data.phone ? [{ phone: data.phone }] : [])],
      },
    });

    if (existing) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'User with this email or phone already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          passwordHash,
          role: data.role,
        },
      });

      // If passenger, initialize wallet
      await tx.wallet.create({
        data: {
          userId: newUser.id,
          balancePaisa: 0,
        },
      });

      // If driver, initialize driver record
      if (data.role === 'DRIVER') {
        await tx.driver.create({
          data: {
            userId: newUser.id,
            isOnline: false,
          },
        });
      }

      return newUser;
    });

    const { accessToken, rawRefreshToken, tokenHash, expiresAt } = this.generateTokens(user.id, user.role);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError(401, ERROR_CODES.UNAUTHENTICATED, 'Invalid credentials');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new AppError(401, ERROR_CODES.UNAUTHENTICATED, 'Invalid credentials');
    }

    const { accessToken, rawRefreshToken, tokenHash, expiresAt } = this.generateTokens(user.id, user.role);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async refreshToken(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw new AppError(401, ERROR_CODES.UNAUTHENTICATED, 'Refresh token required');
    }

    const tokenHash = this.hashToken(rawRefreshToken);

    return prisma.$transaction(async (tx) => {
      const storedToken = await tx.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!storedToken) {
        throw new AppError(401, ERROR_CODES.UNAUTHENTICATED, 'Invalid refresh token');
      }

      // Reuse detection
      if (storedToken.revokedAt) {
        // Revoke all tokens for this user
        await tx.refreshToken.updateMany({
          where: { userId: storedToken.userId },
          data: { revokedAt: new Date() },
        });
        throw new AppError(401, ERROR_CODES.UNAUTHENTICATED, 'Token reuse detected. All sessions revoked.');
      }

      if (new Date() > storedToken.expiresAt) {
        throw new AppError(401, ERROR_CODES.UNAUTHENTICATED, 'Refresh token expired');
      }

      // Revoke old token
      await tx.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      // Issue new pair
      const { accessToken, rawRefreshToken: newRaw, tokenHash: newHash, expiresAt } = this.generateTokens(
        storedToken.user.id,
        storedToken.user.role
      );

      await tx.refreshToken.create({
        data: {
          userId: storedToken.user.id,
          tokenHash: newHash,
          expiresAt,
        },
      });

      return {
        accessToken,
        refreshToken: newRaw,
      };
    });
  }

  async logout(rawRefreshToken: string) {
    if (!rawRefreshToken) return;
    const tokenHash = this.hashToken(rawRefreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        wallet: { select: { balancePaisa: true } },
        driver: {
          select: {
            isOnline: true,
            tesla: { select: { id: true, name: true, plateNo: true, capacity: true } },
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found');
    }

    return user;
  }
}

export const authService = new AuthService();
