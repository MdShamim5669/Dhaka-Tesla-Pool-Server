import { Router } from 'express';
import { ridesController } from './rides.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.guard.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createRideSchema, cancelRideSchema } from './rides.schema.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('PASSENGER'));

router.post('/', validate(createRideSchema), (req, res, next) =>
  ridesController.createRide(req, res, next)
);

router.get('/', (req, res, next) =>
  ridesController.getMyRides(req, res, next)
);

router.get('/:id', (req, res, next) =>
  ridesController.getRideDetails(req, res, next)
);

router.get('/:id/live-tracking', (req, res, next) =>
  ridesController.getLiveTracking(req, res, next)
);

router.post('/:id/cancel', validate(cancelRideSchema), (req, res, next) =>
  ridesController.cancelRide(req, res, next)
);

export const ridesRoutes = router;
