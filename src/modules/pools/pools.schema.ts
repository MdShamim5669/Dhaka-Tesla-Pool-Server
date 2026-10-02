import { z } from 'zod';

export const acceptRideSchema = z.object({
  params: z.object({
    rideId: z.string().uuid(),
  }),
});

export const poolActionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    reason: z.string().optional(),
  }).optional(),
});
