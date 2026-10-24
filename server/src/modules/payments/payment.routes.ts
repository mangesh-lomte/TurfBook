import { Router } from 'express';
import { paymentController } from './payment.controller.js';
import { authenticate } from '../../middleware/authMiddleware.js';

const paymentRouter = Router();

paymentRouter.use(authenticate);

paymentRouter.get('/my', (req, res, next) => paymentController.getMyPayments(req, res, next));

paymentRouter.post('/booking/:id', (req, res, next) =>
  paymentController.createPaymentForBooking(req, res, next)
);

paymentRouter.post('/:id/simulate-result', (req, res, next) =>
  paymentController.simulatePaymentResult(req, res, next)
);

export { paymentRouter };
