import { Request, Response, NextFunction } from 'express';
import { walletService } from './wallet.service.js';
import { sendSuccess } from '../../utils/response.js';

export class WalletController {
  async getBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const balance = await walletService.getBalance(req.user!.id);
      sendSuccess(res, balance);
    } catch (err) {
      next(err);
    }
  }

  async initTopUp(req: Request, res: Response, next: NextFunction) {
    try {
      const { amountPaisa } = req.body;
      const result = await walletService.initTopUp(req.user!.id, Number(amountPaisa));
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async handleSuccess(req: Request, res: Response, next: NextFunction) {
    try {
      const { val_id, tran_id } = req.body;
      const result = await walletService.handlePaymentSuccess(val_id, tran_id);

      // If requested as JSON (e.g. tests or API client)
      if (req.headers.accept?.includes('application/json')) {
        return sendSuccess(res, result);
      }

      // Default browser redirect to Frontend URL
      const redirectUrl = new URL(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet`);
      redirectUrl.searchParams.set('status', 'success');
      redirectUrl.searchParams.set('tranId', result.tranId);
      return res.redirect(redirectUrl.toString());
    } catch (err: any) {
      if (req.headers.accept?.includes('application/json')) {
        return next(err);
      }
      const redirectUrl = new URL(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet`);
      redirectUrl.searchParams.set('status', 'error');
      redirectUrl.searchParams.set('message', err.message || 'Payment processing error');
      return res.redirect(redirectUrl.toString());
    }
  }

  async handleFail(req: Request, res: Response, next: NextFunction) {
    try {
      const { tran_id } = req.body;
      const result = await walletService.handlePaymentFail(tran_id, req.body);

      if (req.headers.accept?.includes('application/json')) {
        return sendSuccess(res, result);
      }

      const redirectUrl = new URL(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet`);
      redirectUrl.searchParams.set('status', 'failed');
      redirectUrl.searchParams.set('tranId', tran_id || '');
      return res.redirect(redirectUrl.toString());
    } catch (err) {
      next(err);
    }
  }

  async handleCancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { tran_id } = req.body;
      const result = await walletService.handlePaymentCancel(tran_id);

      if (req.headers.accept?.includes('application/json')) {
        return sendSuccess(res, result);
      }

      const redirectUrl = new URL(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet`);
      redirectUrl.searchParams.set('status', 'cancelled');
      redirectUrl.searchParams.set('tranId', tran_id || '');
      return res.redirect(redirectUrl.toString());
    } catch (err) {
      next(err);
    }
  }

  async handleIpn(req: Request, res: Response, next: NextFunction) {
    try {
      const { val_id, tran_id, status } = req.body;
      if (status === 'VALID' || status === 'VALIDATED') {
        await walletService.handlePaymentSuccess(val_id, tran_id);
      } else if (status === 'FAILED') {
        await walletService.handlePaymentFail(tran_id, req.body);
      } else if (status === 'CANCELLED') {
        await walletService.handlePaymentCancel(tran_id);
      }

      sendSuccess(res, { message: 'IPN processed successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const walletController = new WalletController();
