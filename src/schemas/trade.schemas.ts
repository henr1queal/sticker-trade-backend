import { z } from 'zod';
import { shortIdParamSchema } from './short-id.schemas.js';
import { stickerEntrySchema } from './sticker.schemas.js';

export const targetShortIdParamsSchema = z.object({
  targetShortId: shortIdParamSchema,
});

export type TargetShortIdParams = z.infer<typeof targetShortIdParamsSchema>;

export const tradeMatchResponseSchema = z.object({
  targetShortId: shortIdParamSchema,
  targetName: z.string(),
  iNeedFromThem: z.array(stickerEntrySchema),
  theyNeedFromMe: z.array(stickerEntrySchema),
});

export type TradeMatchResponse = z.infer<typeof tradeMatchResponseSchema>;
