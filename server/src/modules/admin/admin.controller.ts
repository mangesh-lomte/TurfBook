import { Response, NextFunction } from 'express';
import { analyticsService } from '../analytics/analytics.service.js';
import { prisma } from '../../config/prisma.js';
import { AuthenticatedRequest } from '../../middleware/authMiddleware.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';
import { NotFoundError } from '../../common/errors/AppError.js';
import { VenueStatus, NotificationType } from '@prisma/client';

export class AdminController {
  async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getAdminAnalytics();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getPendingVenues(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const pendingVenues = await prisma.venue.findMany({
        where: { status: VenueStatus.PENDING },
        include: {
          owner: { select: { fullName: true, email: true, phone: true } },
          grounds: { include: { sport: true } },
          venueSports: { include: { sport: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ success: true, data: pendingVenues });
    } catch (error) {
      next(error);
    }
  }

  async approveVenue(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const venue = await prisma.venue.findUnique({ where: { id } });

      if (!venue) {
        throw new NotFoundError('Venue not found');
      }

      const updated = await prisma.venue.update({
        where: { id },
        data: { status: VenueStatus.APPROVED },
      });

      // Notify venue owner
      await prisma.notification.create({
        data: {
          userId: venue.ownerId,
          title: 'Venue Approved! 🎉',
          message: `Your venue "${venue.name}" has been approved by admin and is now live for bookings!`,
          type: NotificationType.VENUE_APPROVED,
          metadata: { venueId: venue.id },
        },
      });

      await recordAuditLog(req, 'VENUE_APPROVED', 'Venue', id, { venueName: venue.name });

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Venue approved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectVenue(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;
      const venue = await prisma.venue.findUnique({ where: { id } });

      if (!venue) {
        throw new NotFoundError('Venue not found');
      }

      const updated = await prisma.venue.update({
        where: { id },
        data: { status: VenueStatus.REJECTED },
      });

      await prisma.notification.create({
        data: {
          userId: venue.ownerId,
          title: 'Venue Submission Update',
          message: `Your venue "${venue.name}" was not approved. Reason: ${reason || 'Does not meet platform guidelines'}`,
          type: NotificationType.VENUE_REJECTED,
          metadata: { venueId: venue.id, reason },
        },
      });

      await recordAuditLog(req, 'VENUE_REJECTED', 'Venue', id, { reason });

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Venue submission rejected',
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { venues: true, bookings: true },
          },
        },
      });

      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  async toggleUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { isActive } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: { isActive },
        select: { id: true, email: true, isActive: true },
      });

      await recordAuditLog(req, 'USER_STATUS_UPDATED', 'User', id, { isActive });

      res.status(200).json({
        success: true,
        data: user,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllBookings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookings = await prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          customer: { select: { fullName: true, email: true } },
          ground: {
            include: {
              venue: { select: { name: true, city: true } },
              sport: true,
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

  async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: { select: { fullName: true, email: true, role: true } },
        },
      });

      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
