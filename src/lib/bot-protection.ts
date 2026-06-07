import { env } from '../config/env.js';

export class BotRejectedError extends Error {
  constructor(message = 'Cadastro rejeitado') {
    super(message);
    this.name = 'BotRejectedError';
  }
}

type TurnstileResponse = {
  success: boolean;
  'error-codes'?: string[];
};

export async function assertRegisterIsHuman(input: {
  honeypot?: string;
  formLoadedAt: number;
  turnstileToken?: string;
  remoteIp?: string;
}): Promise<void> {
  if (input.honeypot && input.honeypot.length > 0) {
    throw new BotRejectedError();
  }

  const elapsedMs = Date.now() - input.formLoadedAt;

  if (!Number.isFinite(elapsedMs) || elapsedMs < env.REGISTER_MIN_FORM_MS) {
    throw new BotRejectedError('Aguarde alguns segundos antes de enviar o cadastro');
  }

  if (elapsedMs > env.REGISTER_MAX_FORM_MS) {
    throw new BotRejectedError('Formulário expirado. Recarregue a página e tente novamente');
  }

  if (!env.TURNSTILE_SECRET_KEY) {
    return;
  }

  if (!input.turnstileToken) {
    throw new BotRejectedError('Verificação anti-bot obrigatória');
  }

  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: input.turnstileToken,
  });

  if (input.remoteIp) {
    body.set('remoteip', input.remoteIp);
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    throw new BotRejectedError('Falha na verificação anti-bot');
  }

  const result = (await response.json()) as TurnstileResponse;

  if (!result.success) {
    throw new BotRejectedError('Verificação anti-bot inválida');
  }
}
