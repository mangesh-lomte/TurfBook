import { Request, Response, NextFunction } from 'express';
import { groundService } from './ground.service.js';
import { AuthenticatedRequest } from '../../middleware/authMiddleware.js';
import { recordAuditLog } from '../../middleware/auditLogger.js';

export class GroundController {
  async getGroundsByVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venueId = req.params.venueId as string;
      const grounds = await groundService.getGroundsByVenue(venueId);
      res.status(200).json({
        success: true,
        data: grounds,
      });
    } catch (error) {
      next(error);
    }
  }

  async getGround(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const ground = await groundService.getGroundById(id);
      res.status(200).json({
        success: true,
        data: ground,
      });
    } catch (error) {
      next(error);
    }
  }

  async createGround(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const venueId = req.params.venueId as string;
      const ground = await groundService.createGround(
        venueId,
        req.user.userId,
        req.user.role,
        req.body
      );

      await recordAuditLog(req, 'GROUND_CREATED', 'Ground', ground.id, {
        venueId,
        name: ground.name,
      });

      res.status(201).json({
        success: true,
        data: ground,
        message: 'Ground created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateGround(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const id = req.params.id as string;
      const ground = await groundService.updateGround(
        id,
        req.user.userId,
        req.user.role,
        req.body
      );

      await recordAuditLog(req, 'GROUND_UPDATED', 'Ground', ground.id);

      res.status(200).json({
        success: true,
        data: ground,
        message: 'Ground updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const groundController = new GroundController();
