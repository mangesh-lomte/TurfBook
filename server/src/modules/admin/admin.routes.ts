import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';
import { Role } from '@prisma/client';

const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(authorize(Role.ADMIN));

adminRouter.get('/overview', (req, res, next) => adminController.getOverview(req, res, next));
adminRouter.get('/venues/pending', (req, res, next) => adminController.getPendingVenues(req, res, next));
adminRouter.post('/venues/:id/approve', (req, res, next) => adminController.approveVenue(req, res, next));
adminRouter.post('/venues/:id/reject', (req, res, next) => adminController.rejectVenue(req, res, next));
adminRouter.get('/users', (req, res, next) => adminController.getUsers(req, res, next));
adminRouter.patch('/users/:id/status', (req, res, next) => adminController.toggleUserStatus(req, res, next));
adminRouter.get('/bookings', (req, res, next) => adminController.getAllBookings(req, res, next));
adminRouter.get('/audit-logs', (req, res, next) => adminController.getAuditLogs(req, res, next));

export { adminRouter };
