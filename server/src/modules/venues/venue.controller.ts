import { Request, Response, NextFunction } from 'express';
import { venueService } from './venue.service.js';
import { AuthenticatedRequest } from '../../middleware/authMiddleware.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';
import { Role } from '@prisma/client';

export class VenueController {
  async listVenues(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as any;
      const result = await venueService.listVenues({
        search: query.search,
        city: query.city,
        sport: query.sport,
        sportId: query.sportId,
        page: query.page ? parseInt(query.page as string, 10) : 1,
        limit: query.limit ? parseInt(query.limit as string, 10) : 12,
        sortBy: (query.sortBy as string) || 'createdAt',
        sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc',
      });

      res.status(200).json({
        success: true,
        data: result.venues,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const venue = await venueService.getVenueByIdOrSlug(id);
      res.status(200).json({
        success: true,
        data: venue,
      });
    } catch (error) {
      next(error);
    }
  }

  async createVenue(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const venue = await venueService.createVenue(req.user.userId, req.body);
      await recordAuditLog(req, 'VENUE_CREATED', 'Venue', venue.id, { name: venue.name });

      res.status(201).json({
        success: true,
        data: venue,
        message: 'Venue created successfully and submitted for review',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateVenue(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const id = req.params.id as string;
      const venue = await venueService.updateVenue(id, req.user.userId, req.user.role, req.body);
      await recordAuditLog(req, 'VENUE_UPDATED', 'Venue', venue.id);

      res.status(200).json({
        success: true,
        data: venue,
        message: 'Venue updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async submitForApproval(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const id = req.params.id as string;
      const venue = await venueService.submitForApproval(id, req.user.userId, req.user.role);
      await recordAuditLog(req, 'VENUE_SUBMITTED_FOR_APPROVAL', 'Venue', venue.id);

      res.status(200).json({
        success: true,
        data: venue,
        message: 'Venue submitted for approval',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const venueController = new VenueController();
