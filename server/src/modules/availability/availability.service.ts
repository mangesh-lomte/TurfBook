import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors/AppError.js';
import { BookingStatus, Role } from '@prisma/client';

export interface TimeSlot {
  slotId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  startTimeFormatted: string; // "06:00"
  endTimeFormatted: string; // "07:00"
  isAvailable: boolean;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'PAST';
  price: number;
  reason?: string;
}

export class AvailabilityService {
  async getGroundAvailability(groundId: string, dateStr: string) {
    const ground = await prisma.ground.findUnique({
      where: { id: groundId },
      include: {
        venue: {
          include: {
            operatingHours: true,
          },
        },
      },
    });

    if (!ground) {
      throw new NotFoundError('Ground not found');
    }

    // Parse the requested date (YYYY-MM-DD)
    const [year, month, day] = dateStr.split('-').map(Number);
    // Construct local midnight and day of week
    const targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const dayOfWeek = targetDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ...

    const operatingHour = ground.venue.operatingHours.find((h) => h.dayOfWeek === dayOfWeek);

    if (!operatingHour || !operatingHour.isOpen) {
      return {
        groundId: ground.id,
        groundName: ground.name,
        date: dateStr,
        isOpen: false,
        message: 'Venue is closed on this day',
        slots: [],
      };
    }

    const [openHour, openMin] = operatingHour.openTime.split(':').map(Number);
    const [closeHour, closeMin] = operatingHour.closeTime.split(':').map(Number);

    const dayStartUtc = new Date(Date.UTC(year, month - 1, day, openHour, openMin, 0));
    const dayEndUtc = new Date(Date.UTC(year, month - 1, day, closeHour, closeMin, 0));

    // Fetch overlapping active bookings for this ground on this day
    const existingBookings = await prisma.booking.findMany({
      where: {
        groundId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT] },
        startTime: { lt: dayEndUtc },
        endTime: { gt: dayStartUtc },
      },
      select: {
        id: true,
        bookingNumber: true,
        startTime: true,
        endTime: true,
      },
    });

    // Fetch overlapping blocked periods
    const blockedPeriods = await prisma.blockedPeriod.findMany({
      where: {
        groundId,
        startTime: { lt: dayEndUtc },
        endTime: { gt: dayStartUtc },
      },
    });

    const now = new Date();
    const slots: TimeSlot[] = [];

    // Generate 1-hour slots
    let currentSlotStart = new Date(dayStartUtc);

    while (currentSlotStart < dayEndUtc) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + 60 * 60 * 1000);
      if (currentSlotEnd > dayEndUtc) break;

      const slotStartMs = currentSlotStart.getTime();
      const slotEndMs = currentSlotEnd.getTime();

      // Format HH:MM
      const startH = currentSlotStart.getUTCHours().toString().padStart(2, '0');
      const startM = currentSlotStart.getUTCMinutes().toString().padStart(2, '0');
      const endH = currentSlotEnd.getUTCHours().toString().padStart(2, '0');
      const endM = currentSlotEnd.getUTCMinutes().toString().padStart(2, '0');

      let status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'PAST' = 'AVAILABLE';
      let reason: string | undefined = undefined;

      // Check if slot has passed
      if (currentSlotEnd.getTime() <= now.getTime()) {
        status = 'PAST';
        reason = 'This time has already passed';
      } else {
        // Check if overlaps booking
        const overlappingBooking = existingBookings.find((b) => {
          const bStart = b.startTime.getTime();
          const bEnd = b.endTime.getTime();
          return slotStartMs < bEnd && slotEndMs > bStart;
        });

        if (overlappingBooking) {
          status = 'BOOKED';
          reason = 'Reserved by customer';
        } else {
          // Check if overlaps blocked period
          const overlappingBlock = blockedPeriods.find((bp) => {
            const bpStart = bp.startTime.getTime();
            const bpEnd = bp.endTime.getTime();
            return slotStartMs < bpEnd && slotEndMs > bpStart;
          });

          if (overlappingBlock) {
            status = 'BLOCKED';
            reason = overlappingBlock.reason || 'Maintenance block';
          }
        }
      }

      slots.push({
        slotId: `${groundId}-${currentSlotStart.toISOString()}`,
        startTime: currentSlotStart.toISOString(),
        endTime: currentSlotEnd.toISOString(),
        startTimeFormatted: `${startH}:${startM}`,
        endTimeFormatted: `${endH}:${endM}`,
        isAvailable: status === 'AVAILABLE',
        status,
        price: Number(ground.hourlyRate),
        reason,
      });

      // Advance by 1 hour
      currentSlotStart = currentSlotEnd;
    }

    return {
      groundId: ground.id,
      groundName: ground.name,
      hourlyRate: Number(ground.hourlyRate),
      venueName: ground.venue.name,
      date: dateStr,
      isOpen: true,
      operatingHours: {
        openTime: operatingHour.openTime,
        closeTime: operatingHour.closeTime,
      },
      slots,
    };
  }

  async createBlockedPeriod(
    groundId: string,
    userId: string,
    userRole: Role,
    data: { startTime: string; endTime: string; reason: string }
  ) {
    const ground = await prisma.ground.findUnique({
      where: { id: groundId },
      include: { venue: true },
    });

    if (!ground) {
      throw new NotFoundError('Ground not found');
    }

    if (userRole !== Role.ADMIN && ground.venue.ownerId !== userId) {
      throw new ForbiddenError('You can only block periods for your own grounds');
    }

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end <= start) {
      throw new BadRequestError('End time must be after start time');
    }

    // Check for conflicting active bookings
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        groundId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT] },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (conflictingBooking) {
      throw new BadRequestError(
        'Cannot block period: there is already an active booking reserved during this interval'
      );
    }

    return prisma.blockedPeriod.create({
      data: {
        groundId,
        startTime: start,
        endTime: end,
        reason: data.reason,
        createdById: userId,
      },
    });
  }

  async deleteBlockedPeriod(blockedPeriodId: string, userId: string, userRole: Role) {
    const period = await prisma.blockedPeriod.findUnique({
      where: { id: blockedPeriodId },
      include: { ground: { include: { venue: true } } },
    });

    if (!period) {
      throw new NotFoundError('Blocked period not found');
    }

    if (userRole !== Role.ADMIN && period.ground.venue.ownerId !== userId) {
      throw new ForbiddenError('You can only remove blocks on your own grounds');
    }

    return prisma.blockedPeriod.delete({
      where: { id: blockedPeriodId },
    });
  }
}

export const availabilityService = new AvailabilityService();
