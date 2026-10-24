import { Router } from 'express';
import { availabilityController } from './availability.controller.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';
import { Role } from '@prisma/client';

const blockedPeriodsRouter = Router();

blockedPeriodsRouter.delete(
  '/:id',
  authenticate,
  authorize(Role.OWNER, Role.ADMIN),
  (req, res, next) => availabilityController.deleteBlockedPeriod(req, res, next)
);

export { blockedPeriodsRouter };
