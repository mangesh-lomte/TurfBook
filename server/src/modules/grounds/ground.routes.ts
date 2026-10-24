import { Router } from 'express';
import { groundController } from './ground.controller.js';
import { availabilityController } from '../availability/availability.controller.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { createGroundSchema, updateGroundSchema } from './ground.validation.js';
import { availabilityQuerySchema, createBlockedPeriodSchema } from '../availability/availability.validation.js';
import { Role } from '@prisma/client';

const groundRouter = Router();

// Public ground details and availability
groundRouter.get('/:id', (req, res, next) => groundController.getGround(req, res, next));

groundRouter.get('/:id/availability', validateRequest({ query: availabilityQuerySchema }), (req, res, next) =>
  availabilityController.getAvailability(req, res, next)
);

// Owner / Admin updates ground
groundRouter.patch(
  '/:id',
  authenticate,
  authorize(Role.OWNER, Role.ADMIN),
  validateRequest({ body: updateGroundSchema }),
  (req, res, next) => groundController.updateGround(req, res, next)
);

// Blocked period management for ground
groundRouter.post(
  '/:id/blocked-periods',
  authenticate,
  authorize(Role.OWNER, Role.ADMIN),
  validateRequest({ body: createBlockedPeriodSchema }),
  (req, res, next) => availabilityController.createBlockedPeriod(req, res, next)
);

export { groundRouter };
