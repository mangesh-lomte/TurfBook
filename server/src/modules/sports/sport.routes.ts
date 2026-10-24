import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma.js';
import { authenticate, authorize } from '../../middleware/authMiddleware.js';
import { Role } from '@prisma/client';

const sportRouter = Router();

// Public: list all active sports
sportRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sports = await prisma.sport.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ success: true, data: sports });
  } catch (err) {
    next(err);
  }
});

// Admin: create sport
sportRouter.post(
  '/',
  authenticate,
  authorize(Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, icon, description, minPlayers, maxPlayers } = req.body;
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      const sport = await prisma.sport.create({
        data: {
          name,
          slug,
          icon,
          description,
          minPlayers: minPlayers || 2,
          maxPlayers: maxPlayers || 22,
        },
      });
      res.status(201).json({ success: true, data: sport });
    } catch (err) {
      next(err);
    }
  }
);

export { sportRouter };
