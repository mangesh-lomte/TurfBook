import { prisma } from '../../config/prisma.js';
import { NotFoundError, ForbiddenError } from '../../common/errors/AppError.js';
import { VenueStatus, Role, Prisma } from '@prisma/client';

export interface ListVenuesFilter {
  search?: string;
  city?: string;
  sport?: string;
  sportId?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  status?: VenueStatus;
  ownerId?: string;
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base}-${Math.random().toString(36).substring(2, 7)}`;
}

export class VenueService {
  async listVenues(filter: ListVenuesFilter) {
    const { search, city, sport, sportId, page, limit, sortBy, sortOrder, status, ownerId } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.VenueWhereInput = {};

    // By default, public list returns only APPROVED venues unless filtered by owner or admin
    if (status) {
      where.status = status;
    } else if (!ownerId) {
      where.status = VenueStatus.APPROVED;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (city) {
      where.city = { equals: city, mode: 'insensitive' };
    }

    if (sportId) {
      where.venueSports = {
        some: { sportId },
      };
    } else if (sport) {
      where.venueSports = {
        some: {
          sport: {
            slug: { equals: sport.toLowerCase(), mode: 'insensitive' },
          },
        },
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [venues, totalCount] = await Promise.all([
      prisma.venue.findMany({
        where,
        skip,
        take: limit,
        orderBy:
          sortBy === 'name'
            ? { name: sortOrder }
            : sortBy === 'price'
            ? { grounds: { _count: sortOrder } }
            : { createdAt: sortOrder },
        include: {
          grounds: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              hourlyRate: true,
              surfaceType: true,
              isIndoor: true,
              sport: {
                select: { id: true, name: true, slug: true, icon: true },
              },
            },
          },
          venueSports: {
            include: {
              sport: true,
            },
          },
          reviews: {
            select: { rating: true },
          },
          _count: {
            select: { reviews: true, grounds: true },
          },
        },
      }),
      prisma.venue.count({ where }),
    ]);

    // Compute average ratings and starting prices
    const transformed = venues.map((v) => {
      const avgRating =
        v.reviews.length > 0
          ? Math.round((v.reviews.reduce((acc, r) => acc + r.rating, 0) / v.reviews.length) * 10) / 10
          : 0;

      const rates = v.grounds.map((g) => Number(g.hourlyRate));
      const minHourlyRate = rates.length > 0 ? Math.min(...rates) : null;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { reviews, ...rest } = v;
      return {
        ...rest,
        averageRating: avgRating,
        totalReviews: v._count.reviews,
        startingPrice: minHourlyRate,
        sports: v.venueSports.map((vs) => vs.sport),
      };
    });

    return {
      venues: transformed,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getVenueByIdOrSlug(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      idOrSlug
    );

    const venue = await prisma.venue.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        grounds: {
          where: { isActive: true },
          include: {
            sport: true,
          },
          orderBy: { hourlyRate: 'asc' },
        },
        operatingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
        venueSports: {
          include: { sport: true },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { reviews: true, grounds: true },
        },
      },
    });

    if (!venue) {
      throw new NotFoundError('Venue not found');
    }

    const avgRating =
      venue.reviews.length > 0
        ? Math.round(
            (venue.reviews.reduce((acc, r) => acc + r.rating, 0) / venue.reviews.length) * 10
          ) / 10
        : 0;

    return {
      ...venue,
      averageRating: avgRating,
      sports: venue.venueSports.map((vs) => vs.sport),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createVenue(ownerId: string, data: any) {
    const slug = generateSlug(data.name);

    return prisma.$transaction(async (tx) => {
      const venue = await tx.venue.create({
        data: {
          ownerId,
          name: data.name,
          slug,
          description: data.description,
          address: data.address,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail,
          facilities: data.facilities || [],
          images: data.images || [],
          status: VenueStatus.PENDING,
        },
      });

      // Link sports
      if (data.sportIds && data.sportIds.length > 0) {
        await tx.venueSport.createMany({
          data: data.sportIds.map((sportId: string) => ({
            venueId: venue.id,
            sportId,
          })),
        });
      }

      // Add operating hours (default 7 days 06:00 to 23:00 if not provided)
      const hoursToInsert =
        data.operatingHours && data.operatingHours.length > 0
          ? data.operatingHours
          : [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
              dayOfWeek,
              openTime: '06:00',
              closeTime: '23:00',
              isOpen: true,
            }));

      await tx.operatingHours.createMany({
        data: hoursToInsert.map(
          (h: { dayOfWeek: number; openTime: string; closeTime: string; isOpen?: boolean }) => ({
            venueId: venue.id,
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isOpen: h.isOpen !== undefined ? h.isOpen : true,
          })
        ),
      });

      return venue;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateVenue(venueId: string, userId: string, userRole: Role, data: any) {
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      throw new NotFoundError('Venue not found');
    }

    if (userRole !== Role.ADMIN && venue.ownerId !== userId) {
      throw new ForbiddenError('You can only update venues that you own');
    }

    return prisma.$transaction(async (tx) => {
      // Update basic fields
      const updated = await tx.venue.update({
        where: { id: venueId },
        data: {
          name: data.name !== undefined ? data.name : undefined,
          description: data.description !== undefined ? data.description : undefined,
          address: data.address !== undefined ? data.address : undefined,
          city: data.city !== undefined ? data.city : undefined,
          state: data.state !== undefined ? data.state : undefined,
          postalCode: data.postalCode !== undefined ? data.postalCode : undefined,
          latitude: data.latitude !== undefined ? data.latitude : undefined,
          longitude: data.longitude !== undefined ? data.longitude : undefined,
          contactPhone: data.contactPhone !== undefined ? data.contactPhone : undefined,
          contactEmail: data.contactEmail !== undefined ? data.contactEmail : undefined,
          facilities: data.facilities !== undefined ? data.facilities : undefined,
          images: data.images !== undefined ? data.images : undefined,
        },
      });

      // Update sports if provided
      if (data.sportIds && Array.isArray(data.sportIds)) {
        await tx.venueSport.deleteMany({ where: { venueId } });
        await tx.venueSport.createMany({
          data: data.sportIds.map((sportId: string) => ({
            venueId,
            sportId,
          })),
        });
      }

      // Update operating hours if provided
      if (data.operatingHours && Array.isArray(data.operatingHours)) {
        for (const h of data.operatingHours) {
          await tx.operatingHours.upsert({
            where: { venueId_dayOfWeek: { venueId, dayOfWeek: h.dayOfWeek } },
            create: {
              venueId,
              dayOfWeek: h.dayOfWeek,
              openTime: h.openTime,
              closeTime: h.closeTime,
              isOpen: h.isOpen ?? true,
            },
            update: {
              openTime: h.openTime,
              closeTime: h.closeTime,
              isOpen: h.isOpen ?? true,
            },
          });
        }
      }

      return updated;
    });
  }

  async submitForApproval(venueId: string, userId: string, userRole: Role) {
    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      throw new NotFoundError('Venue not found');
    }

    if (userRole !== Role.ADMIN && venue.ownerId !== userId) {
      throw new ForbiddenError('You can only submit your own venues');
    }

    return prisma.venue.update({
      where: { id: venueId },
      data: { status: VenueStatus.PENDING },
    });
  }
}

export const venueService = new VenueService();
