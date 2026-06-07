import { z } from 'zod';
import { isValidStickerCode, normalizeStickerCode } from '../data/sticker-catalog.js';

export const stickerTypeSchema = z.enum(['fwc', 'team', 'cc']);

export const stickerStateSchema = z.enum(['need', 'dupe', 'pasted']);

export type StickerState = z.infer<typeof stickerStateSchema>;

export const stickerCodeSchema = z
  .string()
  .trim()
  .transform(normalizeStickerCode)
  .refine(isValidStickerCode, { message: 'Código de figurinha inválido' });

export const stickerEntrySchema = z.object({
  code: z.string(),
  type: stickerTypeSchema,
  number: z.number().int().positive(),
  label: z.string(),
  playerName: z.string().optional(),
  teamCode: z.string().optional(),
  teamName: z.string().optional(),
});

export const stickerWithStateSchema = stickerEntrySchema.extend({
  state: stickerStateSchema,
});

export type StickerEntryDto = z.infer<typeof stickerEntrySchema>;
export type StickerWithStateDto = z.infer<typeof stickerWithStateSchema>;

export const catalogQuerySchema = z.object({
  type: stickerTypeSchema.optional(),
  team: z
    .string()
    .trim()
    .length(3)
    .regex(/^[A-Z]{3}$/i)
    .transform((value) => value.toUpperCase())
    .optional(),
  state: stickerStateSchema.optional(),
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;

export const stickerCodeParamsSchema = z.object({
  code: stickerCodeSchema,
});

export type StickerCodeParams = z.infer<typeof stickerCodeParamsSchema>;

export const updateStickerBodySchema = z.object({
  state: stickerStateSchema,
});

export type UpdateStickerBody = z.infer<typeof updateStickerBodySchema>;

export const catalogResponseSchema = z.object({
  summary: z.object({
    total: z.number().int().nonnegative(),
    need: z.number().int().nonnegative(),
    dupe: z.number().int().nonnegative(),
    pasted: z.number().int().nonnegative(),
  }),
  teams: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
    }),
  ),
  stickers: z.array(stickerWithStateSchema),
});

export const updateStickerResponseSchema = z.object({
  sticker: stickerWithStateSchema,
  summary: catalogResponseSchema.shape.summary,
});
