import { Router } from 'express';
import { walletController } from './wallet.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Public SSLCommerz webhook / redirect callback endpoints
router.post('/topup/success', (req, res, next) => walletController.handleSuccess(req, res, next));
router.post('/topup/fail', (req, res, next) => walletController.handleFail(req, res, next));
router.post('/topup/cancel', (req, res, next) => walletController.handleCancel(req, res, next));
router.post('/topup/ipn', (req, res, next) => walletController.handleIpn(req, res, next));

// Protected passenger wallet endpoints
router.get('/', authenticate, (req, res, next) => walletController.getBalance(req, res, next));
router.post('/topup/init', authenticate, (req, res, next) => walletController.initTopUp(req, res, next));

export const walletRoutes = router;
