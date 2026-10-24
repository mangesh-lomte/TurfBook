import { z } from 'zod';

export const createGroundSchema = z.object({
  name: z.string().min(2, 'Ground name must be at least 2 characters'),
  sportId: z.string().uuid('Valid sport ID required'),
  description: z.string().optional(),
  surfaceType: z.string().min(2, 'Surface type required (e.g. Artificial Turf, Hard Court)'),
  isIndoor: z.boolean().default(false),
  hourlyRate: z.number().positive('Hourly rate must be greater than 0'),
  minSlotDurationMinutes: z.number().default(60),
  maxSlotDurationMinutes: z.number().default(180),
});

export const updateGroundSchema = createGroundSchema.partial();
