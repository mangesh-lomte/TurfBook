import { prisma } from '../../config/prisma.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../common/errors/AppError.js';
import { calculateBookingPrice } from '../../common/utils/pricing.js';
import { BookingStatus, VenueStatus, Role, NotificationType, PaymentStatus, Prisma } from '@prisma/client';

export interface CreateBookingDTO {
  customerId: string;
  groundId: string;
  startTime: string;
  endTime: string;
  notes?: string;
  idempotencyKey?: string;
}

function generateBookingNumber(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TB-${dateStr}-${randomStr}`;
}

export class BookingService {
  async createBooking(data: CreateBookingDTO) {
    const { customerId, groundId, startTime, endTime, notes, idempotencyKey } = data;

    // 1. Validate requested time interval
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError('Invalid start time or end time format');
    }

    if (end <= start) {
      throw new BadRequestError('End time must be after start time');
    }

    // 2. Booking cannot be in the past (allow 60s clock skew)
    if (start.getTime() < now.getTime() - 60000) {
      throw new BadRequestError('Cannot book slots in the past');
    }

    // 3. Check ground and venue validity
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

    if (!ground || !ground.isActive) {
      throw new NotFoundError('Selected ground is unavailable or inactive');
    }

    if (ground.venue.status !== VenueStatus.APPROVED) {
      throw new BadRequestError('This venue is currently not approved for public bookings');
    }

    // 4. Validate against venue operating hours
    const dayOfWeek = start.getUTCDay();
    const operatingHour = ground.venue.operatingHours.find((h) => h.dayOfWeek === dayOfWeek);

    if (!operatingHour || !operatingHour.isOpen) {
      throw new BadRequestError('The venue is closed on the selected day');
    }

    const [openH, openM] = operatingHour.openTime.split(':').map(Number);
    const [closeH, closeM] = operatingHour.closeTime.split(':').map(Number);

    const year = start.getUTCFullYear();
    const month = start.getUTCMonth();
    const day = start.getUTCDate();

    const allowedDayStart = new Date(Date.UTC(year, month, day, openH, openM, 0));
    const allowedDayEnd = new Date(Date.UTC(year, month, day, closeH, closeM, 0));

    if (start < allowedDayStart || end > allowedDayEnd) {
      throw new BadRequestError(
        `Requested booking time is outside operating hours (${operatingHour.openTime} - ${operatingHour.closeTime})`
      );
    }

    // 5. Authoritatively calculate price on server
    const pricing = calculateBookingPrice(start, end, ground.hourlyRate);

    // 6. Concurrency-Safe Transaction with PostgreSQL GiST exclusion constraint backing
    try {
      const booking = await prisma.$transaction(
        async (tx) => {
          // Pre-check for overlapping active bookings in this transaction
          const conflictingBooking = await tx.booking.findFirst({
            where: {
              groundId,
              status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT] },
              startTime: { lt: end },
              endTime: { gt: start },
            },
          });

          if (conflictingBooking) {
            throw new ConflictError(
              'This slot has already been reserved by another customer. Please choose a different time.'
            );
          }

          // Pre-check for overlapping blocked periods
          const conflictingBlock = await tx.blockedPeriod.findFirst({
            where: {
              groundId,
              startTime: { lt: end },
              endTime: { gt: start },
            },
          });

          if (conflictingBlock) {
            throw new ConflictError(
              `This slot is unavailable due to maintenance: ${conflictingBlock.reason}`
            );
          }

          // Create the booking record
          const bookingNumber = generateBookingNumber();

          const newBooking = await tx.booking.create({
            data: {
              bookingNumber,
              customerId,
              groundId,
              startTime: start,
              endTime: end,
              totalHours: new Prisma.Decimal(pricing.totalHours),
              hourlyRate: new Prisma.Decimal(pricing.hourlyRate),
              subtotal: new Prisma.Decimal(pricing.subtotal),
              discount: new Prisma.Decimal(pricing.discount),
              tax: new Prisma.Decimal(pricing.tax),
              totalPrice: new Prisma.Decimal(pricing.totalPrice),
              status: BookingStatus.CONFIRMED, // In our direct booking flow, it is confirmed with payment
              notes: notes || null,
            },
            include: {
              ground: {
                include: {
                  sport: true,
                  venue: {
                    select: {
                      id: true,
                      name: true,
                      address: true,
                      city: true,
                      ownerId: true,
                    },
                  },
                },
              },
              customer: {
                select: { id: true, fullName: true, email: true, phone: true },
              },
            },
          });

          // Create payment record automatically (simulated instant confirmation)
          const paymentNumber = `PAY-${newBooking.bookingNumber}`;
          await tx.payment.create({
            data: {
              paymentNumber,
              bookingId: newBooking.id,
              amount: new Prisma.Decimal(pricing.totalPrice),
              currency: 'INR',
              status: PaymentStatus.SUCCESS,
              transactionRef: `SIM-${Date.now()}`,
            },
          });

          // In-app notification to customer
          await tx.notification.create({
            data: {
              userId: customerId,
              title: 'Booking Confirmed!',
              message: `Your booking #${newBooking.bookingNumber} at ${ground.venue.name} (${ground.name}) is confirmed for ${start.toLocaleDateString()}.`,
              type: NotificationType.BOOKING_CONFIRMED,
              metadata: { bookingId: newBooking.id, bookingNumber: newBooking.bookingNumber },
            },
          });

          // In-app notification to venue owner
          await tx.notification.create({
            data: {
              userId: ground.venue.ownerId,
              title: 'New Reservation Received',
              message: `New booking #${newBooking.bookingNumber} by ${newBooking.customer.fullName} for ground ${ground.name}.`,
              type: NotificationType.BOOKING_CONFIRMED,
              metadata: { bookingId: newBooking.id },
            },
          });

          return newBooking;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );

      return booking;
    } catch (err: unknown) {
      // Check for PostgreSQL exclusion violation (error code 23P01)
      const pgErr = err as { code?: string; message?: string };
      if (
        pgErr?.code === '23P01' ||
        (typeof pgErr?.message === 'string' &&
          (pgErr.message.includes('exclusion constraint') ||
            pgErr.message.includes('no_overlapping_active_bookings')))
      ) {
        throw new ConflictError(
          'This slot was just reserved by another customer. Please choose a different slot.'
        );
      }
      throw err;
    }
  }

  async getMyBookings(customerId: string) {
    return prisma.booking.findMany({
      where: { customerId },
      orderBy: { startTime: 'desc' },
      include: {
        ground: {
          include: {
            sport: true,
            venue: {
              select: {
                id: true,
                name: true,
                slug: true,
                address: true,
                city: true,
                images: true,
              },
            },
          },
        },
        payments: true,
        review: {
          select: { id: true, rating: true, comment: true },
        },
      },
    });
  }

  async getBookingById(bookingId: string, userId: string, userRole: Role) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        ground: {
          include: {
            sport: true,
            venue: {
              select: {
                id: true,
                name: true,
                slug: true,
                address: true,
                city: true,
                contactPhone: true,
                ownerId: true,
                images: true,
              },
            },
          },
        },
        payments: true,
        review: true,
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Role-based authorization: Customer sees only their own booking; Owner sees only their venue bookings; Admin sees all
    if (userRole === Role.CUSTOMER && booking.customerId !== userId) {
      throw new ForbiddenError('You do not have permission to view this booking');
    }

    if (userRole === Role.OWNER && booking.ground.venue.ownerId !== userId) {
      throw new ForbiddenError('You can only view bookings for your own venue');
    }

    return booking;
  }

  async cancelBooking(bookingId: string, userId: string, userRole: Role, reason: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ground: { include: { venue: true } },
        payments: true,
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Check permissions
    if (userRole === Role.CUSTOMER && booking.customerId !== userId) {
      throw new ForbiddenError('You can only cancel your own bookings');
    }

    if (userRole === Role.OWNER && booking.ground.venue.ownerId !== userId) {
      throw new ForbiddenError('You can only cancel bookings for your venue');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestError('Booking is already cancelled');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestError('Cannot cancel a completed booking');
    }

    const now = new Date();
    // Customer cancellation rule: must be at least 2 hours before start time
    if (userRole === Role.CUSTOMER) {
      const hoursUntilStart = (booking.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilStart < 2) {
        throw new BadRequestError(
          'Bookings can only be cancelled at least 2 hours before the scheduled start time'
        );
      }
    }

    // Execute cancellation in transaction (releases availability by updating status to CANCELLED)
    return prisma.$transaction(async (tx) => {
      const cancelledBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: now,
          cancellationReason: reason,
        },
      });

      // Update payment to REFUNDED if payment was successful
      for (const payment of booking.payments) {
        if (payment.status === PaymentStatus.SUCCESS) {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.REFUNDED,
              refundedAt: now,
            },
          });
        }
      }

      // Notify customer
      await tx.notification.create({
        data: {
          userId: booking.customerId,
          title: 'Booking Cancelled',
          message: `Booking #${booking.bookingNumber} was cancelled. Refund processed. Reason: ${reason}`,
          type: NotificationType.BOOKING_CANCELLED,
          metadata: { bookingId: booking.id },
        },
      });

      return cancelledBooking;
    });
  }

  async completeBooking(bookingId: string, userId: string, userRole: Role) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ground: { include: { venue: true } },
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (userRole === Role.OWNER && booking.ground.venue.ownerId !== userId) {
      throw new ForbiddenError('You can only complete bookings for your venue');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestError('Only confirmed bookings can be marked as completed');
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.COMPLETED },
    });
  }
}

export const bookingService = new BookingService();
