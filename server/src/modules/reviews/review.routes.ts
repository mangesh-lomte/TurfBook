import { Router } from 'express';
import { reviewController } from './review.controller.js';
import { authenticate } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { createReviewSchema } from './review.validation.js';

const reviewRouter = Router();

// Public venue reviews
reviewRouter.get('/venue/:venueId', (req, res, next) =>
  reviewController.getVenueReviews(req, res, next)
);

// Customer submits review for their booking
reviewRouter.post(
  '/booking/:id',
  authenticate,
  validateRequest({ body: createReviewSchema }),
  (req, res, next) => reviewController.createBookingReview(req, res, next)
);

export { reviewRouter };
