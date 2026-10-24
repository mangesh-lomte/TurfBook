import { Request, Response, NextFunction } from 'express';
import { reviewService } from './review.service.js';
import { AuthenticatedRequest } from '../../middleware/authMiddleware.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';

export class ReviewController {
  async getVenueReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.params.venueId as string;
      const reviews = await reviewService.getReviewsByVenue(venueId);
      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  }

  async createBookingReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const id = req.params.id as string;
      const review = await reviewService.createReviewForBooking(id, req.user.userId, req.body);

      await recordAuditLog(req, 'REVIEW_CREATED', 'Review', review.id, {
        bookingId: id,
        rating: review.rating,
      });

      res.status(201).json({
        success: true,
        data: review,
        message: 'Review submitted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();
