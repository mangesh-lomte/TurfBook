import { Request } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthenticatedRequest } from './authMiddleware.js';
import { logger } from '../common/utils/logger.js';
import { Prisma } from '@prisma/client';

export async function recordAuditLog(
  req: Request | AuthenticatedRequest,
  action: string,
  resourceType: string,
  resourceId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.userId || null;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId: resourceId || null,
        ipAddress: typeof ipAddress === 'string' ? ipAddress.slice(0, 45) : null,
        userAgent: typeof userAgent === 'string' ? userAgent.slice(0, 255) : null,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  } catch (err) {
    logger.error('Failed to write audit log', err, { action, resourceType, resourceId });
  }
}
