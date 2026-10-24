import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError } from '../../common/errors/AppError.js';
import { Role } from '@prisma/client';

export class GroundService {
  async getGroundsByVenue(venueId: string) {
    return prisma.ground.findMany({
      where: { venueId, isActive: true },
      include: {
        sport: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getGroundById(groundId: string) {
    const ground = await prisma.ground.findUnique({
      where: { id: groundId },
      include: {
        sport: true,
        venue: {
          include: {
            operatingHours: { orderBy: { dayOfWeek: 'asc' } },
          },
        },
      },
    });

    if (!ground) {
      throw new NotFoundError('Ground not found');
    }

    return ground;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createGround(venueId: string, userId: string, userRole: Role, data: any) {
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      throw new NotFoundError('Venue not found');
    }

    if (userRole !== Role.ADMIN && venue.ownerId !== userId) {
      throw new ForbiddenError('You can only add grounds to your own venue');
    }

    return prisma.ground.create({
      data: {
        venueId,
        sportId: data.sportId,
        name: data.name,
        description: data.description || null,
        surfaceType: data.surfaceType,
        isIndoor: data.isIndoor ?? false,
        hourlyRate: data.hourlyRate,
        minSlotDurationMinutes: data.minSlotDurationMinutes || 60,
        maxSlotDurationMinutes: data.maxSlotDurationMinutes || 180,
      },
      include: {
        sport: true,
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateGround(groundId: string, userId: string, userRole: Role, data: any) {
    const ground = await prisma.ground.findUnique({
      where: { id: groundId },
      include: { venue: true },
    });

    if (!ground) {
      throw new NotFoundError('Ground not found');
    }

    if (userRole !== Role.ADMIN && ground.venue.ownerId !== userId) {
      throw new ForbiddenError('You can only update grounds in your own venue');
    }

    return prisma.ground.update({
      where: { id: groundId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        sportId: data.sportId !== undefined ? data.sportId : undefined,
        description: data.description !== undefined ? data.description : undefined,
        surfaceType: data.surfaceType !== undefined ? data.surfaceType : undefined,
        isIndoor: data.isIndoor !== undefined ? data.isIndoor : undefined,
        hourlyRate: data.hourlyRate !== undefined ? data.hourlyRate : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
      include: {
        sport: true,
      },
    });
  }
}

export const groundService = new GroundService();
