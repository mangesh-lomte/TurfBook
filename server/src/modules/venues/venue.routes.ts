import { Router } from 'express';
import { venueController } from './venue.controller.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { listVenuesQuerySchema, createVenueSchema, updateVenueSchema } from './venue.validation.js';
import { Role } from '@prisma/client';

const venueRouter = Router();

venueRouter.get('/', validateRequest({ query: listVenuesQuerySchema }), (req, res, next) =>
  venueController.listVenues(req, res, next)
);

venueRouter.get('/:id', (req, res, next) => venueController.getVenue(req, res, next));

venueRouter.post(
  '/',
  authenticate,
  authorize(Role.OWNER, Role.ADMIN),
  validateRequest({ body: createVenueSchema }),
  (req, res, next) => venueController.createVenue(req, res, next)
);

venueRouter.patch(
  '/:id',
  authenticate,
  authorize(Role.OWNER, Role.ADMIN),
  validateRequest({ body: updateVenueSchema }),
  (req, res, next) => venueController.updateVenue(req, res, next)
);

venueRouter.post(
  '/:id/submit-for-approval',
  authenticate,
  authorize(Role.OWNER, Role.ADMIN),
  (req, res, next) => venueController.submitForApproval(req, res, next)
);

// Grounds under a venue
import { groundController } from '../grounds/ground.controller.js';
import { createGroundSchema } from '../grounds/ground.validation.js';

venueRouter.get('/:venueId/grounds', (req, res, next) =>
  groundController.getGroundsByVenue(req, res, next)
);

venueRouter.post(
  '/:venueId/grounds',
  authenticate,
  authorize(Role.OWNER, Role.ADMIN),
  validateRequest({ body: createGroundSchema }),
  (req, res, next) => groundController.createGround(req, res, next)
);

export { venueRouter };
