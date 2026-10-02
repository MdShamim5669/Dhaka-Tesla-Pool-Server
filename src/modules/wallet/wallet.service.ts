import crypto from 'crypto';
import { prisma } from '../../db/prisma.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { sslcommerzService } from '../sslcommerz/sslcommerz.service.js';
import { ITopUpInitResult } from './wallet.interface.js';

export class WalletService {
  async getBalance(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Wallet not found');
    }

    return {
      balancePaisa: wallet.balancePaisa,
      display: `৳${(wallet.balancePaisa / 100).toFixed(2)}`,
    };
  }

  async topUp(userId: string, amountPaisa: number) {
    if (amountPaisa <= 0) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Amount must be greater than zero');
    }

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found');
      }

      const updated = await tx.wallet.upsert({
        where: { userId },
        create: {
          userId,
          balancePaisa: amountPaisa,
        },
        update: {
          balancePaisa: { increment: amountPaisa },
        },
      });

      return {
        balancePaisa: updated.balancePaisa,
        display: `৳${(updated.balancePaisa / 100).toFixed(2)}`,
      };
    });
  }

  /**
   * Initiates an SSLCommerz payment session for wallet top-up.
   */
  async initTopUp(userId: string, amountPaisa: number): Promise<ITopUpInitResult> {
    if (!amountPaisa || amountPaisa < 1000) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Minimum top-up amount is ৳10.00 (1000 paisa)');
    }

    if (amountPaisa > 2500000) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Maximum top-up amount is ৳25,000.00 (2500000 paisa)');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found');
    }

    const tranId = `DTP-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Create a pending transaction record
    await prisma.walletTransaction.create({
      data: {
        tranId,
        userId,
        amountPaisa,
        status: 'PENDING',
      },
    });

    const session = await sslcommerzService.initPayment({
      tranId,
      amount: amountPaisa / 100,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone || undefined,
    });

    return {
      tranId,
      paymentUrl: session.paymentUrl,
    };
  }

  /**
   * Handles payment validation and atomically credits the user wallet on success.
   */
  async handlePaymentSuccess(valId: string, tranId: string) {
    if (!valId || !tranId) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'val_id and tran_id are required');
    }

    const txRecord = await prisma.walletTransaction.findUnique({
      where: { tranId },
    });

    if (!txRecord) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, `Transaction ${tranId} not found`);
    }

    // Idempotency check: if already processed, do not credit again
    if (txRecord.status === 'SUCCESS') {
      return { success: true, tranId, amountPaisa: txRecord.amountPaisa, alreadyProcessed: true };
    }

    // Validate with SSLCommerz Gateway
    const validationData = await sslcommerzService.validatePayment(valId);

    // Atomically credit the wallet and mark transaction SUCCESS
    return prisma.$transaction(async (tx) => {
      await tx.wallet.upsert({
        where: { userId: txRecord.userId },
        create: {
          userId: txRecord.userId,
          balancePaisa: txRecord.amountPaisa,
        },
        update: {
          balancePaisa: { increment: txRecord.amountPaisa },
        },
      });

      await tx.walletTransaction.update({
        where: { tranId },
        data: {
          status: 'SUCCESS',
          valId,
          bankTranId: validationData.bank_tran_id || null,
          gatewayResponse: validationData as any,
        },
      });

      return {
        success: true,
        tranId,
        amountPaisa: txRecord.amountPaisa,
        alreadyProcessed: false,
      };
    });
  }

  /**
   * Handles failed transaction callback.
   */
  async handlePaymentFail(tranId: string, errorDetails?: any) {
    const txRecord = await prisma.walletTransaction.findUnique({
      where: { tranId },
    });

    if (txRecord && txRecord.status === 'PENDING') {
      await prisma.walletTransaction.update({
        where: { tranId },
        data: {
          status: 'FAILED',
          gatewayResponse: errorDetails ? (errorDetails as any) : undefined,
        },
      });
    }

    return { success: false, tranId };
  }

  /**
   * Handles cancelled transaction callback.
   */
  async handlePaymentCancel(tranId: string) {
    const txRecord = await prisma.walletTransaction.findUnique({
      where: { tranId },
    });

    if (txRecord && txRecord.status === 'PENDING') {
      await prisma.walletTransaction.update({
        where: { tranId },
        data: {
          status: 'CANCELLED',
        },
      });
    }

    return { success: false, tranId, cancelled: true };
  }
}

export const walletService = new WalletService();

