import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UpdateProfileBody } from '../schemas/profile.schemas.js';
import {
  ProfileNotFoundError,
  ProfileService,
  ProfileValidationError,
} from '../services/profile.service.js';

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  getMe = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return reply.send(await this.profileService.getMe(request.user.sub));
    } catch (error) {
      return mapProfileError(request, error);
    }
  };

  updateMe = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as UpdateProfileBody;

    try {
      return reply.send(await this.profileService.updateMe(request.user.sub, body));
    } catch (error) {
      return mapProfileError(request, error);
    }
  };
}

function mapProfileError(request: FastifyRequest, error: unknown): never {
  if (error instanceof ProfileNotFoundError) {
    throw request.server.httpErrors.notFound(error.message);
  }

  if (error instanceof ProfileValidationError) {
    throw request.server.httpErrors.badRequest(error.message);
  }

  throw error;
}
