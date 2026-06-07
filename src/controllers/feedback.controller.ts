import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CreateFeedbackBody } from '../schemas/feedback.schemas.js';
import { FeedbackService } from '../services/feedback.service.js';

export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as CreateFeedbackBody;
    const result = await this.feedbackService.create(request.user.sub, body);
    return reply.status(201).send(result);
  };
}
