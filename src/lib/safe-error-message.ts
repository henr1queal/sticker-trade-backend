import type { FastifyError } from 'fastify';
import { env } from '../config/env.js';

const NOT_FOUND_CODES = new Set(['FST_ERR_NOT_FOUND']);

export function resolveClientErrorMessage(error: FastifyError): string {
  const statusCode = error.statusCode ?? 500;

  if (statusCode === 404 || NOT_FOUND_CODES.has(String(error.code))) {
    return 'Recurso não encontrado.';
  }

  if (statusCode >= 500) {
    return env.NODE_ENV === 'production'
      ? 'Erro interno do servidor. Tente novamente em instantes.'
      : 'Erro interno do servidor.';
  }

  if (isInternalError(error)) {
    return 'Não foi possível concluir a operação. Tente novamente.';
  }

  return error.message || 'Requisição inválida.';
}

export function resolveClientErrorName(error: FastifyError): string {
  const statusCode = error.statusCode ?? 500;

  if (statusCode === 400) return 'Bad Request';
  if (statusCode === 401) return 'Unauthorized';
  if (statusCode === 403) return 'Forbidden';
  if (statusCode === 404) return 'Not Found';
  if (statusCode === 409) return 'Conflict';
  if (statusCode >= 500) return 'Internal Server Error';

  return 'Error';
}

function isInternalError(error: FastifyError): boolean {
  const name = error.name ?? '';
  const message = error.message ?? '';

  if (name.includes('Prisma') || message.includes('prisma')) {
    return true;
  }

  if (message.includes('Invalid `') || message.includes('invocation in')) {
    return true;
  }

  return false;
}
