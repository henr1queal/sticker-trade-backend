import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().min(1).default('0.0.0.0'),

  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  REDIS_URL: z.string().url().startsWith('redis://'),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1).default('7d'),
  COOKIE_SECRET: z.string().min(32),

  CORS_ORIGINS: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  ADMIN_API_KEY: z.string().min(32),

  /** Token opaco na URL — ex.: /api/ops/{token}/metrics. Se omitido, rotas ops ficam desligadas. */
  OPS_ROUTE_TOKEN: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().min(24).max(128).optional(),
  ),

  /** IPs permitidos para ops (vazio = qualquer IP, use em produção). */
  OPS_ALLOWED_IPS: z.preprocess(
    (value) => {
      if (typeof value !== 'string' || value.trim() === '') {
        return [];
      }

      return value
        .split(',')
        .map((ip) => ip.trim())
        .filter(Boolean);
    },
    z.array(z.string().min(3)).default([]),
  ),

  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(1000),
  RATE_LIMIT_TIME_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  AUTH_RATE_LIMIT_TIME_WINDOW_MS: z.coerce.number().int().positive().default(60_000),

  REGISTER_MIN_FORM_MS: z.coerce.number().int().positive().default(3_000),
  REGISTER_MAX_FORM_MS: z.coerce.number().int().positive().default(3_600_000),
  TURNSTILE_SECRET_KEY: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().min(1).optional(),
  ),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error(`[FATAL] Variáveis de ambiente inválidas ou ausentes:\n${formatted}`);
    process.exit(1);
  }

  return result.data;
}

export const env = parseEnv();
