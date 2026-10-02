import { Router } from 'express';
import { poolsController } from './pools.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.guard.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('DRIVER'));

router.get('/requests', (req, res, next) =>
  poolsController.getRequests(req, res, next)
);

router.post('/requests/:rideId/accept', (req, res, next) =>
  poolsController.acceptRequest(req, res, next)
);

router.get('/pools/current', (req, res, next) =>
  poolsController.getCurrentPool(req, res, next)
);

router.post('/pools/:id/arrive', (req, res, next) =>
  poolsController.markArrived(req, res, next)
);

router.post('/pools/:id/start', (req, res, next) =>
  poolsController.startTrip(req, res, next)
);

router.post('/pools/:id/complete', (req, res, next) =>
  poolsController.completeTrip(req, res, next)
);

router.post('/pools/:id/cancel', (req, res, next) =>
  poolsController.cancelPool(req, res, next)
);

router.get('/pools', (req, res, next) =>
  poolsController.getHistory(req, res, next)
);

export const driverPoolsRoutes = router;
