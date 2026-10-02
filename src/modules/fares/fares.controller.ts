import { Request, Response, NextFunction } from 'express';
import { zonesService } from '../zones/zones.service.js';
import { estimateFare } from './fares.service.js';
import { AppError, ERROR_CODES } from '../../utils/errors.js';
import { sendSuccess } from '../../utils/response.js';

export class FaresController {
  async estimate(req: Request, res: Response, next: NextFunction) {
    try {
      const { pickupZoneId, destZoneId, seats } = req.body;

      if (!pickupZoneId || !destZoneId || !seats) {
        throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'pickupZoneId, destZoneId, and seats are required');
      }

      if (pickupZoneId === destZoneId) {
        throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Pickup and destination zones must be different');
      }

      const distanceRecord = await zonesService.getDistanceBetweenZones(Number(pickupZoneId), Number(destZoneId));
      if (!distanceRecord) {
        throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Distance between selected zones not found');
      }

      const estimate = estimateFare(distanceRecord.distanceM, Number(seats));
      sendSuccess(res, {
        distanceM: distanceRecord.distanceM,
        seats: Number(seats),
        ...estimate,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const faresController = new FaresController();
