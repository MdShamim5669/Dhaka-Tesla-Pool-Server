import { Request, Response, NextFunction } from 'express';
import { ridesService } from './rides.service.js';
import { sendSuccess } from '../../utils/response.js';
import { RideRequestStatus } from '@prisma/client';

export class RidesController {
  async createRide(req: Request, res: Response, next: NextFunction) {
    try {
      const passengerId = req.user!.id;
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
      const ride = await ridesService.createRide(passengerId, req.body, idempotencyKey);
      sendSuccess(res, ride, 201);
    } catch (err) {
      next(err);
    }
  }

  async getMyRides(req: Request, res: Response, next: NextFunction) {
    try {
      const passengerId = req.user!.id;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as RideRequestStatus | undefined;

      const result = await ridesService.getPassengerRides(passengerId, page, limit, status);
      sendSuccess(res, result.rides, 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  }

  async getRideDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const passengerId = req.user!.id;
      const ride = await ridesService.getRideDetails(passengerId, req.params.id);
      sendSuccess(res, ride);
    } catch (err) {
      next(err);
    }
  }

  async cancelRide(req: Request, res: Response, next: NextFunction) {
    try {
      const passengerId = req.user!.id;
      const { reason } = req.body || {};
      const ride = await ridesService.cancelRide(passengerId, req.params.id, reason);
      sendSuccess(res, ride);
    } catch (err) {
      next(err);
    }
  }

  async getLiveTracking(req: Request, res: Response, next: NextFunction) {
    try {
      const passengerId = req.user!.id;
      const tracking = await ridesService.getRideLiveTracking(passengerId, req.params.id);
      sendSuccess(res, tracking);
    } catch (err) {
      next(err);
    }
  }
}

export const ridesController = new RidesController();
