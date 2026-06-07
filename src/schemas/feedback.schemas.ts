import { z } from 'zod';

export const createFeedbackBodySchema = z.object({
  category: z.enum(['SUGGESTION', 'BUG', 'OTHER']),
  message: z.string().trim().min(10, 'Descreva com pelo menos 10 caracteres').max(2000),
});

export type CreateFeedbackBody = z.infer<typeof createFeedbackBodySchema>;

export const adminLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const adminFeedbackQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
