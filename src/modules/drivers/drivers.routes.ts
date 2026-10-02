import { Router } from 'express';
import { driversController } from './drivers.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.guard.js';
import { validate } from '../../middleware/validate.middleware.js';
import { updateAvailabilitySchema, updateLocationSchema } from './drivers.schema.js';

const router = Router();

router.use(authenticate);

// Live map visible to all authenticated users (passengers and drivers)
router.get('/live-map', (req, res, next) => driversController.getLiveMap(req, res, next));

// Driver-only routes
router.use(requireRole('DRIVER'));

router.patch('/me/availability', validate(updateAvailabilitySchema), (req, res, next) =>
  driversController.setAvailability(req, res, next)
);

router.patch('/me/location', validate(updateLocationSchema), (req, res, next) =>
  driversController.updateLocation(req, res, next)
);

router.get('/me/tesla', (req, res, next) =>
  driversController.getMyTesla(req, res, next)
);

export const driversRoutes = router;

