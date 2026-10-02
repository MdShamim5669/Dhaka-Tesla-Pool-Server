import { Request, Response, NextFunction } from 'express';
import { poolsService } from './pools.service.js';
import { sendSuccess } from '../../utils/response.js';

export class PoolsController {
  async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await poolsService.getCompatibleRequests(req.user!.id);
      sendSuccess(res, requests);
    } catch (err) {
      next(err);
    }
  }

  async acceptRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await poolsService.acceptRequest(req.user!.id, req.params.rideId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getCurrentPool(req: Request, res: Response, next: NextFunction) {
    try {
      const pool = await poolsService.getCurrentPool(req.user!.id);
      sendSuccess(res, pool);
    } catch (err) {
      next(err);
    }
  }

  async markArrived(req: Request, res: Response, next: NextFunction) {
    try {
      const pool = await poolsService.markDriverArrived(req.user!.id, req.params.id);
      sendSuccess(res, pool);
    } catch (err) {
      next(err);
    }
  }

  async startTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const pool = await poolsService.startTrip(req.user!.id, req.params.id);
      sendSuccess(res, pool);
    } catch (err) {
      next(err);
    }
  }

  async completeTrip(req: Request, res: Response, next: NextFunction) {
    try {
      const pool = await poolsService.completeTrip(req.user!.id, req.params.id);
      sendSuccess(res, pool);
    } catch (err) {
      next(err);
    }
  }

  async cancelPool(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body || {};
      const pool = await poolsService.cancelPool(req.user!.id, req.params.id, reason);
      sendSuccess(res, pool);
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const history = await poolsService.getPoolHistory(req.user!.id);
      sendSuccess(res, history);
    } catch (err) {
      next(err);
    }
  }
}

export const poolsController = new PoolsController();
