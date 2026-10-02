import { Router } from 'express';
import { faresController } from './fares.controller.js';

const router = Router();

router.post('/estimate', (req, res, next) => faresController.estimate(req, res, next));

export const faresRoutes = router;
