import { Request, Response, NextFunction } from 'express';
import { availabilityService } from './availability.service.js';
import { AuthenticatedRequest } from '../../middleware/authMiddleware.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';

export class AvailabilityController {
  async getAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

      const availability = await availabilityService.getGroundAvailability(id, date);
      res.status(200).json({
        success: true,
        data: availability,
      });
    } catch (error) {
      next(error);
    }
  }

  async createBlockedPeriod(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const id = req.params.id as string;
      const period = await availabilityService.createBlockedPeriod(
        id,
        req.user.userId,
        req.user.role,
        req.body
      );

      await recordAuditLog(req, 'BLOCKED_PERIOD_CREATED', 'BlockedPeriod', period.id, {
        groundId: id,
        startTime: period.startTime,
        endTime: period.endTime,
      });

      res.status(201).json({
        success: true,
        data: period,
        message: 'Blocked period created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBlockedPeriod(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const id = req.params.id as string;
      await availabilityService.deleteBlockedPeriod(id, req.user.userId, req.user.role);

      await recordAuditLog(req, 'BLOCKED_PERIOD_DELETED', 'BlockedPeriod', id);

      res.status(200).json({
        success: true,
        message: 'Blocked period removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const availabilityController = new AvailabilityController();
