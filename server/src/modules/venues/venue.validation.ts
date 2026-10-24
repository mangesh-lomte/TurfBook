import { z } from 'zod';

export const listVenuesQuerySchema = z.object({
  search: z.string().optional(),
  city: z.string().optional(),
  sport: z.string().optional(),
  sportId: z.string().optional(),
  page: z.string().optional().default('1').transform((v) => Math.max(1, parseInt(v, 10) || 1)),
  limit: z.string().optional().default('12').transform((v) => Math.min(50, Math.max(1, parseInt(v, 10) || 12))),
  sortBy: z.enum(['name', 'createdAt', 'rating', 'price']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const createVenueSchema = z.object({
  name: z.string().min(3, 'Venue name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(4, 'Postal code is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  contactPhone: z.string().min(6, 'Valid contact phone required'),
  contactEmail: z.string().email('Valid contact email required'),
  facilities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  sportIds: z.array(z.string()).min(1, 'Please select at least one sport'),
  operatingHours: z
    .array(
      z.object({
        dayOfWeek: z.number().min(0).max(6),
        openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM required'),
        closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM required'),
        isOpen: z.boolean().default(true),
      })
    )
    .optional(),
});

export const updateVenueSchema = createVenueSchema.partial();
