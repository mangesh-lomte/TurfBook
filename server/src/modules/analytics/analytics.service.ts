import { prisma } from '../../config/prisma.js';
import { BookingStatus, PaymentStatus, VenueStatus } from '@prisma/client';

export class AnalyticsService {
  async getCustomerAnalytics(customerId: string) {
    const now = new Date();

    const [upcomingBookings, pastBookings, cancelledBookings, totalSpentResult] = await Promise.all([
      prisma.booking.count({
        where: {
          customerId,
          status: BookingStatus.CONFIRMED,
          startTime: { gte: now },
        },
      }),
      prisma.booking.count({
        where: {
          customerId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
          endTime: { lt: now },
        },
      }),
      prisma.booking.count({
        where: {
          customerId,
          status: BookingStatus.CANCELLED,
        },
      }),
      prisma.booking.aggregate({
        where: {
          customerId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        },
        _sum: { totalPrice: true },
      }),
    ]);

    const recentBookings = await prisma.booking.findMany({
      where: { customerId },
      orderBy: { startTime: 'desc' },
      take: 5,
      include: {
        ground: {
          include: {
            sport: true,
            venue: {
              select: { id: true, name: true, city: true },
            },
          },
        },
        payments: true,
      },
    });

    return {
      upcomingBookings,
      pastBookings,
      cancelledBookings,
      totalSpent: Number(totalSpentResult._sum.totalPrice || 0),
      recentBookings,
    };
  }

  async getOwnerAnalytics(ownerId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Get owner's venue IDs
    const venues = await prisma.venue.findMany({
      where: { ownerId },
      select: { id: true },
    });
    const venueIds = venues.map((v) => v.id);

    if (venueIds.length === 0) {
      return {
        totalVenues: 0,
        totalBookings: 0,
        todayBookings: 0,
        confirmedBookings: 0,
        totalRevenue: 0,
        occupancyRate: 0,
        recentReservations: [],
        topGrounds: [],
      };
    }

    const whereOwnerBookings = {
      ground: { venueId: { in: venueIds } },
    };

    const [
      totalBookings,
      todayBookings,
      confirmedBookings,
      revenueResult,
      recentReservations,
      groundsWithBookings,
    ] = await Promise.all([
      prisma.booking.count({ where: whereOwnerBookings }),
      prisma.booking.count({
        where: {
          ...whereOwnerBookings,
          startTime: { gte: startOfToday, lte: endOfToday },
        },
      }),
      prisma.booking.count({
        where: {
          ...whereOwnerBookings,
          status: BookingStatus.CONFIRMED,
        },
      }),
      // Sum of successful payments for this owner's bookings
      prisma.payment.aggregate({
        where: {
          status: PaymentStatus.SUCCESS,
          booking: whereOwnerBookings,
        },
        _sum: { amount: true },
      }),
      prisma.booking.findMany({
        where: whereOwnerBookings,
        orderBy: { startTime: 'desc' },
        take: 6,
        include: {
          customer: { select: { fullName: true, email: true, phone: true } },
          ground: {
            include: {
              sport: true,
              venue: { select: { name: true } },
            },
          },
        },
      }),
      prisma.ground.findMany({
        where: { venueId: { in: venueIds }, isActive: true },
        select: {
          id: true,
          name: true,
          hourlyRate: true,
          venue: { select: { name: true } },
          sport: { select: { name: true } },
          _count: {
            select: {
              bookings: {
                where: { status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } },
              },
            },
          },
        },
        orderBy: {
          bookings: { _count: 'desc' },
        },
        take: 5,
      }),
    ]);

    // Calculate realistic occupancy rate (booked hours vs total operating hours this month)
    const totalGroundsCount = groundsWithBookings.length || 1;
    // Assuming 14 operating hours/day * 30 days = 420 available hours per ground/month
    const estimatedAvailableHours = totalGroundsCount * 420;
    const hoursAgg = await prisma.booking.aggregate({
      where: {
        ...whereOwnerBookings,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      },
      _sum: { totalHours: true },
    });
    const bookedHours = Number(hoursAgg._sum.totalHours || 0);
    const occupancyRate = Math.min(
      100,
      Math.round((bookedHours / (estimatedAvailableHours || 1)) * 100 * 10) / 10
    );

    return {
      totalVenues: venueIds.length,
      totalBookings,
      todayBookings,
      confirmedBookings,
      totalRevenue: Number(revenueResult._sum.amount || 0),
      occupancyRate,
      recentReservations,
      topGrounds: groundsWithBookings.map((g) => ({
        id: g.id,
        name: g.name,
        venueName: g.venue.name,
        sportName: g.sport.name,
        hourlyRate: Number(g.hourlyRate),
        bookingCount: g._count.bookings,
      })),
    };
  }

  async getAdminAnalytics() {
    const [
      totalUsers,
      totalVenues,
      pendingVenues,
      approvedVenues,
      totalBookings,
      confirmedBookings,
      revenueResult,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.venue.count(),
      prisma.venue.count({ where: { status: VenueStatus.PENDING } }),
      prisma.venue.count({ where: { status: VenueStatus.APPROVED } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
      prisma.payment.aggregate({
        where: { status: PaymentStatus.SUCCESS },
        _sum: { amount: true },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { fullName: true, email: true, role: true } },
        },
      }),
    ]);

    return {
      totalUsers,
      totalVenues,
      pendingVenues,
      approvedVenues,
      totalBookings,
      confirmedBookings,
      platformRevenue: Number(revenueResult._sum.amount || 0),
      recentAuditLogs,
    };
  }
}

export const analyticsService = new AnalyticsService();
