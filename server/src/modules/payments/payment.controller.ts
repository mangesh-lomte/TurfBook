import { Response, NextFunction } from 'express';
import { paymentService } from './payment.service.js';
import { AuthenticatedRequest } from '../../middleware/authMiddleware.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';

export class PaymentController {
  async getMyPayments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const payments = await paymentService.getMyPayments(req.user.userId);
      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  async createPaymentForBooking(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const id = req.params.id as string;
      const payment = await paymentService.createPaymentForBooking(id, req.user.userId);

      await recordAuditLog(req, 'PAYMENT_INITIATED', 'Payment', payment.id, {
        bookingId: id,
        amount: payment.amount,
      });

      res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment session created',
      });
    } catch (error) {
      next(error);
    }
  }

  async simulatePaymentResult(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { result, failureReason } = req.body;

      const payment = await paymentService.simulatePaymentResult(
        id,
        result === 'FAILED' ? 'FAILED' : 'SUCCESS',
        failureReason
      );

      await recordAuditLog(req, 'PAYMENT_SIMULATED', 'Payment', id, { result });

      res.status(200).json({
        success: true,
        data: payment,
        message: `Payment marked as ${payment.status}`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
