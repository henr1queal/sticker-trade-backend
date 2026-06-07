import { z } from 'zod';
import { shortIdParamSchema } from './short-id.schemas.js';

export const sendFriendRequestBodySchema = z.object({
  targetShortId: shortIdParamSchema,
});

export const friendRequestIdParamsSchema = z.object({
  requestId: z.string().uuid(),
});

export const friendShortIdParamsSchema = z.object({
  friendShortId: shortIdParamSchema,
});

export type SendFriendRequestBody = z.infer<typeof sendFriendRequestBodySchema>;
export type FriendRequestIdParams = z.infer<typeof friendRequestIdParamsSchema>;
export type FriendShortIdParams = z.infer<typeof friendShortIdParamsSchema>;

export const friendRequestItemSchema = z.object({
  id: z.string().uuid(),
  shortId: shortIdParamSchema,
  name: z.string(),
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED']),
  direction: z.enum(['incoming', 'outgoing']),
  createdAt: z.string().datetime(),
});

export const friendListItemSchema = z.object({
  shortId: shortIdParamSchema,
  name: z.string(),
  friendsSince: z.string().datetime(),
});

export const friendDetailSchema = z.object({
  shortId: shortIdParamSchema,
  name: z.string(),
  instagram: z.string().nullable(),
  whatsapp: z.string().nullable(),
  iNeedFromThem: z.array(z.unknown()),
  theyNeedFromMe: z.array(z.unknown()),
});
