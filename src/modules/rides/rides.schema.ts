import { z } from 'zod';

export const createRideSchema = z.object({
  body: z.object({
    pickupZoneId: z.number().int().positive(),
    destZoneId: z.number().int().positive(),
    seats: z.number().int().min(1).max(6),
    paymentMethod: z.enum(['CASH', 'TESLAPAY']).default('CASH'),
  }).refine((data) => data.pickupZoneId !== data.destZoneId, {
    message: 'Pickup and destination zones must be different',
    path: ['destZoneId'],
  }),
  headers: z.object({
    'idempotency-key': z.string().optional(),
  }).passthrough(),
});

export const cancelRideSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    reason: z.string().optional(),
  }).optional(),
});

export type CreateRideInput = z.infer<typeof createRideSchema>['body'];
