import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../common/errors/AppError.js';
import { logger } from '../common/utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Operational AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Zod Validation Error
  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input parameters',
        details: formatted,
      },
    });
    return;
  }

  // Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
      res.status(409).json({
        success: false,
        error: {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: `A record with this ${target} already exists.`,
        },
      });
      return;
    }

    // Record not found
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Requested record does not exist or has been removed.',
        },
      });
      return;
    }

    // Foreign key constraint failure
    if (err.code === 'P2003') {
      res.status(400).json({
        success: false,
        error: {
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'Referenced entity does not exist.',
        },
      });
      return;
    }
  }

  // Check for PostgreSQL exclusion constraint error (23P01 - exclusion_violation)
  // This is raised by PostgreSQL when our GiST exclusion constraint catches overlapping bookings!
  const pgError = err as { code?: string; routine?: string; message?: string };
  if (
    pgError?.code === '23P01' ||
    (typeof pgError?.message === 'string' &&
      (pgError.message.includes('exclusion constraint') ||
        pgError.message.includes('no_overlapping_active_bookings') ||
        pgError.message.includes('no_overlapping_blocked_periods')))
  ) {
    res.status(409).json({
      success: false,
      error: {
        code: 'BOOKING_SLOT_CONFLICT',
        message: 'This ground has already been booked or blocked for the requested time range. Please choose another slot.',
      },
    });
    return;
  }

  // Unknown Internal Error
  logger.error('Unhandled server error', err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected internal error occurred. Please try again later.'
      : err instanceof Error
      ? err.message
      : 'Unknown internal error';

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message,
    },
  });
}
