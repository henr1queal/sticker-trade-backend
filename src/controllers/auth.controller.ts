import type { FastifyReply, FastifyRequest } from 'fastify';
import { clearSessionCookie, sessionUserResponse, setSessionCookie } from '../lib/session-cookie.js';
import { assertRegisterIsHuman, BotRejectedError } from '../lib/bot-protection.js';
import type { DeleteAccountBody, LoginBody, RegisterBody } from '../schemas/auth.schemas.js';
import {
  AuthService,
  ConflictError,
  UnauthorizedError,
} from '../services/auth.service.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as RegisterBody;

    try {
      await assertRegisterIsHuman({
        honeypot: body.website,
        formLoadedAt: body.formLoadedAt,
        turnstileToken: body.turnstileToken,
        remoteIp: request.ip,
      });

      const payload = await this.authService.register({
        name: body.name,
        email: body.email,
        password: body.password,
      });

      await setSessionCookie(reply, payload);

      return reply.status(201).send(sessionUserResponse(payload));
    } catch (error) {
      if (error instanceof BotRejectedError) {
        throw request.server.httpErrors.badRequest(error.message);
      }

      if (error instanceof ConflictError) {
        throw request.server.httpErrors.conflict(error.message);
      }

      throw error;
    }
  };

  login = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as LoginBody;

    try {
      const payload = await this.authService.login(body);
      await setSessionCookie(reply, payload);

      return reply.send(sessionUserResponse(payload));
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw request.server.httpErrors.unauthorized(error.message);
      }

      throw error;
    }
  };

  logout = async (_request: FastifyRequest, reply: FastifyReply) => {
    clearSessionCookie(reply);
    return reply.status(204).send();
  };

  deleteAccount = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as DeleteAccountBody;

    try {
      await this.authService.deleteAccount(request.user.sub, body);
      clearSessionCookie(reply);
      return reply.status(204).send();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw request.server.httpErrors.unauthorized(error.message);
      }

      throw error;
    }
  };
}
