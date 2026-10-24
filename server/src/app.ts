import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { swaggerDocument } from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './common/errors/AppError.js';

// Route modules
import { authRouter } from './modules/auth/auth.routes.js';
import { venueRouter } from './modules/venues/venue.routes.js';
import { groundRouter } from './modules/grounds/ground.routes.js';
import { blockedPeriodsRouter } from './modules/availability/availability.routes.js';
import { bookingRouter } from './modules/bookings/booking.routes.js';
import { paymentRouter } from './modules/payments/payment.routes.js';
import { reviewRouter } from './modules/reviews/review.routes.js';
import { sportRouter } from './modules/sports/sport.routes.js';
import { notificationRouter } from './modules/notifications/notification.routes.js';
import { customerRouter } from './modules/customer/customer.routes.js';
import { ownerRouter } from './modules/owner/owner.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';

const app = express();

// Security and middleware
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  })
);

app.use(
  cors({
    origin: [env.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoints
const healthHandler = async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'turfbook-api',
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: err instanceof Error ? err.message : 'Database check failed',
      timestamp: new Date().toISOString(),
    });
  }
};

app.get('/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/api-docs.json', (_req, res) => res.json(swaggerDocument));

// API v1 Routes
const apiRouter = express.Router();
apiRouter.use('/auth', authRouter);
apiRouter.use('/venues', venueRouter);
apiRouter.use('/grounds', groundRouter);
apiRouter.use('/blocked-periods', blockedPeriodsRouter);
apiRouter.use('/bookings', bookingRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/reviews', reviewRouter);
apiRouter.use('/sports', sportRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/customer', customerRouter);
apiRouter.use('/owner', ownerRouter);
apiRouter.use('/admin', adminRouter);

app.use('/api/v1', apiRouter);

// 404 Route Handler
app.use((req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Centralized Error Handler
app.use(errorHandler);

export { app };
