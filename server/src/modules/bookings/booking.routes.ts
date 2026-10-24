import { Router } from 'express';
import { bookingController } from './booking.controller.js';
import { authenticate } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { createBookingSchema, cancelBookingSchema } from './booking.validation.js';

const bookingRouter = Router();

bookingRouter.use(authenticate);

bookingRouter.post('/', validateRequest({ body: createBookingSchema }), (req, res, next) =>
  bookingController.createBooking(req, res, next)
);

bookingRouter.get('/my', (req, res, next) => bookingController.getMyBookings(req, res, next));

bookingRouter.get('/:id', (req, res, next) => bookingController.getBookingById(req, res, next));

bookingRouter.post('/:id/cancel', validateRequest({ body: cancelBookingSchema }), (req, res, next) =>
  bookingController.cancelBooking(req, res, next)
);

bookingRouter.post('/:id/complete', (req, res, next) =>
  bookingController.completeBooking(req, res, next)
);

export { bookingRouter };
