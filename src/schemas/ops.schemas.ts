import { z } from 'zod';

export const opsDebugErrorQuerySchema = z.object({
  type: z.enum(['404', '409', '429', '500']).default('500'),
});

export type OpsDebugErrorQuery = z.infer<typeof opsDebugErrorQuerySchema>;
