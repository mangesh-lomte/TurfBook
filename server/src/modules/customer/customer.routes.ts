import { Router, Response, NextFunction } from 'express';
import { analyticsService } from '../analytics/analytics.service.js';
import { authenticate, AuthenticatedRequest } from '../../middleware/authMiddleware.js';

const customerRouter = Router();

customerRouter.use(authenticate);

customerRouter.get('/overview', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    const data = await analyticsService.getCustomerAnalytics(req.user.userId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export { customerRouter };
