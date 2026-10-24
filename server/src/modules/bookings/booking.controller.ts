import { Response, NextFunction } from 'express';
import { bookingService } from './booking.service.js';
import { AuthenticatedRequest } from '../../middleware/authMiddleware.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';

export class BookingController {
  async createBooking(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const booking = await bookingService.createBooking({
        ...req.body,
        customerId: req.user.userId,
      });

      await recordAuditLog(req, 'BOOKING_CREATED', 'Booking', booking.id, {
        bookingNumber: booking.bookingNumber,
        totalPrice: booking.totalPrice,
      });

      res.status(201).json({
        success: true,
        data: booking,
        message: 'Booking created and confirmed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyBookings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const bookings = await bookingService.getMyBookings(req.user.userId);
      res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const id = req.params.id as string;
      const booking = await bookingService.getBookingById(id, req.user.userId, req.user.role);

      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const id = req.params.id as string;
      const { reason } = req.body;
      const booking = await bookingService.cancelBooking(id, req.user.userId, req.user.role, reason);

      await recordAuditLog(req, 'BOOKING_CANCELLED', 'Booking', id, { reason });

      res.status(200).json({
        success: true,
        data: booking,
        message: 'Booking cancelled successfully and availability restored',
      });
    } catch (error) {
      next(error);
    }
  }

  async completeBooking(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const id = req.params.id as string;
      const booking = await bookingService.completeBooking(id, req.user.userId, req.user.role);

      await recordAuditLog(req, 'BOOKING_COMPLETED', 'Booking', id);

      res.status(200).json({
        success: true,
        data: booking,
        message: 'Booking marked as completed',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const bookingController = new BookingController();
