import { Router } from 'express';
import { zonesController } from './zones.controller.js';

const router = Router();

router.get('/', (req, res, next) => zonesController.getZones(req, res, next));

export const zonesRoutes = router;
