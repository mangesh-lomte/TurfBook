import { prisma } from '../../config/prisma.js';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '../../common/errors/AppError.js';
import { BookingStatus } from '@prisma/client';

export class ReviewService {
  async getReviewsByVenue(venueId: string) {
    return prisma.review.findMany({
      where: { venueId },
      include: {
        customer: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReviewForBooking(
    bookingId: string,
    customerId: string,
    data: { rating: number; comment: string }
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ground: { select: { venueId: true } },
        review: true,
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.customerId !== customerId) {
      throw new ForbiddenError('You can only review your own bookings');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestError('Cannot review a cancelled booking');
    }

    if (booking.review) {
      throw new ConflictError('You have already submitted a review for this booking');
    }

    return prisma.review.create({
      data: {
        bookingId,
        venueId: booking.ground.venueId,
        customerId,
        rating: data.rating,
        comment: data.comment,
        isVerifiedStay: true,
      },
      include: {
        customer: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });
  }
}

export const reviewService = new ReviewService();
