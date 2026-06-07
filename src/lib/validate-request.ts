import type { FastifyRequest } from 'fastify';
import type { ZodSchema } from 'zod';
import { formatZodValidationError } from './format-validation.js';

type RequestPart = 'body' | 'query' | 'params';

export function validateRequest<T>(
  schema: ZodSchema<T>,
  part: RequestPart,
) {
  return async (request: FastifyRequest): Promise<void> => {
    const result = schema.safeParse(request[part]);

    if (!result.success) {
      throw request.server.httpErrors.badRequest(formatZodValidationError(result.error));
    }

    (request as FastifyRequest & Record<RequestPart, T>)[part] = result.data;
  };
}
