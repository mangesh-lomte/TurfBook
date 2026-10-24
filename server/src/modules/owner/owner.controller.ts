import { Response, NextFunction } from 'express';
import { analyticsService } from '../analytics/analytics.service.js';
import { prisma } from '../../config/prisma.js';
import { AuthenticatedRequest } from '../../middleware/authMiddleware.js';

export class OwnerController {
  async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const data = await analyticsService.getOwnerAnalytics(req.user.userId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getBookings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      // Fetch bookings for all grounds belonging to this owner's venues
      const bookings = await prisma.booking.findMany({
        where: {
          ground: {
            venue: { ownerId: req.user.userId },
          },
        },
        orderBy: { startTime: 'desc' },
        include: {
          customer: { select: { id: true, fullName: true, email: true, phone: true } },
          ground: {
            include: {
              sport: true,
              venue: { select: { id: true, name: true } },
            },
          },
          payments: true,
        },
      });

      res.status(200).json({ success: true, data: bookings });
    } catch (error) {
      next(error);
    }
  }

  async getRevenue(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      // Get payments grouped by status
      const payments = await prisma.payment.findMany({
        where: {
          booking: {
            ground: { venue: { ownerId: req.user.userId } },
          },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            select: {
              bookingNumber: true,
              startTime: true,
              customer: { select: { fullName: true } },
              ground: { select: { name: true, venue: { select: { name: true } } } },
            },
          },
        },
      });

      res.status(200).json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  }
}

export const ownerController = new OwnerController();
