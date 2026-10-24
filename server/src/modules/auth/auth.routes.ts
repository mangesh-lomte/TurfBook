import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authenticate } from '../../middleware/authMiddleware.js';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation.js';
import rateLimit from 'express-rate-limit';

const authRouter = Router();

// Rate limiter for authentication routes (login / register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts, please try again in 15 minutes',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post('/register', authLimiter, validateRequest({ body: registerSchema }), (req, res, next) =>
  authController.register(req, res, next)
);

authRouter.post('/login', authLimiter, validateRequest({ body: loginSchema }), (req, res, next) =>
  authController.login(req, res, next)
);

authRouter.post('/refresh', validateRequest({ body: refreshTokenSchema }), (req, res, next) =>
  authController.refresh(req, res, next)
);

authRouter.post('/logout', (req, res, next) => authController.logout(req, res, next));

authRouter.get('/me', authenticate, (req, res, next) => authController.getMe(req, res, next));

export { authRouter };
