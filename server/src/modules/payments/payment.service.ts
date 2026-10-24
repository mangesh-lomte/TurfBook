import { prisma } from '../../config/prisma.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors/AppError.js';
import { PaymentStatus, PaymentProvider, BookingStatus, Role, Prisma } from '@prisma/client';

export class PaymentService {
  async getMyPayments(customerId: string) {
    return prisma.payment.findMany({
      where: {
        booking: { customerId },
      },
      include: {
        booking: {
          include: {
            ground: {
              include: { venue: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPaymentForBooking(bookingId: string, customerId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.customerId !== customerId) {
      throw new ForbiddenError('You can only pay for your own bookings');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestError('Cannot pay for a cancelled booking');
    }

    // Check if an existing successful payment already exists
    const existing = await prisma.payment.findFirst({
      where: { bookingId, status: PaymentStatus.SUCCESS },
    });

    if (existing) {
      throw new BadRequestError('This booking is already paid');
    }

    const paymentNumber = `PAY-${booking.bookingNumber}-${Date.now().toString().slice(-4)}`;

    return prisma.payment.create({
      data: {
        paymentNumber,
        bookingId,
        amount: booking.totalPrice,
        currency: 'INR',
        status: PaymentStatus.PENDING,
        provider: PaymentProvider.SIMULATED,
      },
    });
  }

  async simulatePaymentResult(paymentId: string, result: 'SUCCESS' | 'FAILED', failureReason?: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!payment) {
      throw new NotFoundError('Payment record not found');
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      throw new BadRequestError('Payment is already marked as SUCCESS');
    }

    return prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: result === 'SUCCESS' ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
          transactionRef: `SIM-${Date.now()}`,
          failureReason: result === 'FAILED' ? failureReason || 'Card declined by issuer' : null,
        },
      });

      if (result === 'SUCCESS') {
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: BookingStatus.CONFIRMED },
        });
      }

      return updatedPayment;
    });
  }
}

export const paymentService = new PaymentService();
