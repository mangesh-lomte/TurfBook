import { z } from 'zod';

export const createBookingSchema = z.object({
  groundId: z.string().uuid('Valid ground ID is required'),
  slotId: z.string().optional(),
  startTime: z.string().datetime({ message: 'Valid ISO startTime is required' }),
  endTime: z.string().datetime({ message: 'Valid ISO endTime is required' }),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  idempotencyKey: z.string().optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason must be at least 3 characters'),
});
