import { z } from 'zod';

export const updateAvailabilitySchema = z.object({
  body: z.object({
    isOnline: z.boolean(),
  }),
});

export const updateLocationSchema = z.object({
  body: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    heading: z.number().min(0).max(360).optional(),
  }),
});

export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>['body'];
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>['body'];

