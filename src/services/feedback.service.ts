import type { PrismaClient } from '@prisma/client';
import { generateUuidV7 } from '../lib/uuid.js';
import type { CreateFeedbackBody } from '../schemas/feedback.schemas.js';

export class FeedbackService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(userId: string, input: CreateFeedbackBody) {
    const feedback = await this.prisma.userFeedback.create({
      data: {
        id: generateUuidV7(),
        userId,
        category: input.category,
        message: input.message.trim(),
      },
      select: {
        id: true,
        category: true,
        createdAt: true,
      },
    });

    return {
      id: feedback.id,
      category: feedback.category,
      createdAt: feedback.createdAt.toISOString(),
    };
  }
}
