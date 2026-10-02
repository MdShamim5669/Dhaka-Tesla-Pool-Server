import { Request, Response, NextFunction } from 'express';
import { driversService } from './drivers.service.js';
import { sendSuccess } from '../../utils/response.js';

export class DriversController {
  async setAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const driver = await driversService.setAvailability(req.user!.id, req.body.isOnline);
      sendSuccess(res, driver);
    } catch (err) {
      next(err);
    }
  }

  async getMyTesla(req: Request, res: Response, next: NextFunction) {
    try {
      const tesla = await driversService.getMyTesla(req.user!.id);
      sendSuccess(res, tesla);
    } catch (err) {
      next(err);
    }
  }

  async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await driversService.updateLocation(req.user!.id, req.body);
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  async getLiveMap(_req: Request, res: Response, next: NextFunction) {
    try {
      const liveFleet = await driversService.getLiveDriversMap();
      sendSuccess(res, liveFleet);
    } catch (err) {
      next(err);
    }
  }
}

export const driversController = new DriversController();
