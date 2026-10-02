import { Request, Response, NextFunction } from 'express';
import { zonesService } from './zones.service.js';
import { sendSuccess } from '../../utils/response.js';

export class ZonesController {
  async getZones(_req: Request, res: Response, next: NextFunction) {
    try {
      const zones = await zonesService.getAllZones();
      sendSuccess(res, zones);
    } catch (err) {
      next(err);
    }
  }
}

export const zonesController = new ZonesController();
