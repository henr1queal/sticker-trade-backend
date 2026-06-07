import type { FastifyReply } from 'fastify';
import { env } from '../config/env.js';
import type { AuthTokenPayload } from '../schemas/auth.schemas.js';

export function setSessionCookie(reply: FastifyReply, payload: AuthTokenPayload): Promise<string> {
  return reply.jwtSign(payload).then((token) => {
    reply.setCookie('access_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return token;
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie('access_token', {
    path: '/',
  });
}

export function sessionUserResponse(payload: AuthTokenPayload) {
  return {
    shortId: payload.shortId,
    name: payload.name,
  };
}
