import { z } from 'zod';

const instagramHandleSchema = z
  .string()
  .trim()
  .max(30)
  .regex(/^[a-zA-Z0-9._]{1,30}$/, 'Use apenas letras, números, ponto e underline')
  .optional()
  .or(z.literal(''));

const whatsappPhoneSchema = z
  .string()
  .trim()
  .max(20)
  .regex(/^\+?[0-9]{10,15}$/, 'Informe o número com DDD (apenas dígitos, opcional +)')
  .optional()
  .or(z.literal(''));

export const updateProfileBodySchema = z.object({
  instagramHandle: instagramHandleSchema,
  whatsappPhone: whatsappPhoneSchema,
  shareInstagramWithFriends: z.boolean().optional(),
  shareWhatsappWithFriends: z.boolean().optional(),
});

export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;

export const profileMeSchema = z.object({
  shortId: z.string(),
  name: z.string(),
  instagramHandle: z.string().nullable(),
  whatsappPhone: z.string().nullable(),
  shareInstagramWithFriends: z.boolean(),
  shareWhatsappWithFriends: z.boolean(),
});
