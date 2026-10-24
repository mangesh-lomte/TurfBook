import { Router } from 'express';
import { ownerController } from './owner.controller.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';
import { Role } from '@prisma/client';

const ownerRouter = Router();

ownerRouter.use(authenticate);
ownerRouter.use(authorize(Role.OWNER, Role.ADMIN));

ownerRouter.get('/overview', (req, res, next) => ownerController.getOverview(req, res, next));
ownerRouter.get('/bookings', (req, res, next) => ownerController.getBookings(req, res, next));
ownerRouter.get('/revenue', (req, res, next) => ownerController.getRevenue(req, res, next));

export { ownerRouter };
