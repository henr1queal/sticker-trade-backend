import type { FastifyReply, FastifyRequest } from 'fastify';
import { AdminObservabilityService } from '../services/admin-observability.service.js';

export class AdminController {
  constructor(private readonly adminService: AdminObservabilityService) {}

  metrics = async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send(await this.adminService.getMetrics());
  };

  logs = async (request: FastifyRequest, reply: FastifyReply) => {
    const limit = Number((request.query as { limit?: string }).limit ?? 100);
    return reply.send(await this.adminService.getRecentLogs(limit));
  };

  feedback = async (request: FastifyRequest, reply: FastifyReply) => {
    const limit = Number((request.query as { limit?: string }).limit ?? 50);
    return reply.send(await this.adminService.listFeedback(limit));
  };

  /** Simula erros para validar logs/métricas ops (rota protegida). */
  debugError = async (request: FastifyRequest, _reply: FastifyReply) => {
    const type = (request.query as { type?: '404' | '409' | '429' | '500' }).type ?? '500';

    switch (type) {
      case '404':
        throw request.server.httpErrors.notFound('[debug] Recurso não encontrado (simulado).');
      case '409':
        throw request.server.httpErrors.conflict('[debug] Conflito simulado.');
      case '429':
        throw request.server.httpErrors.tooManyRequests('[debug] Rate limit simulado.');
      case '500':
      default:
        throw new Error('[debug] Erro interno simulado.');
    }
  };
}
