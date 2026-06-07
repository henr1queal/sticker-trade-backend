import { z } from 'zod';

export const createPoiBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type CreatePoiBody = z.infer<typeof createPoiBodySchema>;

export const nearbyPoiQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(100).default(5),
});

export type NearbyPoiQuery = z.infer<typeof nearbyPoiQuerySchema>;

export const poiResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  distanceKm: z.number().optional(),
});

export type PoiResponse = z.infer<typeof poiResponseSchema>;
