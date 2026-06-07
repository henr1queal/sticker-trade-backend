import { z } from 'zod';
import {
  SHORT_ID_LENGTH,
  SHORT_ID_PATTERN,
  normalizeShortId,
} from '../lib/short-id.js';

export const shortIdParamSchema = z
  .string()
  .trim()
  .length(SHORT_ID_LENGTH)
  .transform(normalizeShortId)
  .refine((value) => SHORT_ID_PATTERN.test(value), {
    message: `Código deve ter 2 letras + 7 dígitos (ex: HE4829173)`,
  });

export const shortIdParamsSchema = z.object({
  targetShortId: shortIdParamSchema,
});

export type ShortIdParams = z.infer<typeof shortIdParamsSchema>;
