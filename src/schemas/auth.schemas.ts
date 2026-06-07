import { z } from 'zod';
import { shortIdParamSchema } from './short-id.schemas.js';

export const registerBodySchema = z
  .object({
    name: z.string().trim().min(1, 'Informe pelo menos um nome').max(120),
    email: z.string().trim().email().max(255).toLowerCase(),
    password: z.string().min(5).max(128),
    passwordConfirm: z.string().min(5, 'Confirme a senha (mínimo 5 caracteres)').max(128),
    formLoadedAt: z.number().int().positive(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'Você precisa aceitar os Termos e a Política de Privacidade' }),
    }),
    turnstileToken: z.string().trim().min(1).optional(),
    website: z.string().max(0).optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  });

export const loginBodySchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
  password: z.string().min(1).max(128),
});

export const deleteAccountBodySchema = z.object({
  password: z.string().min(1).max(128),
  confirmPhrase: z.literal('EXCLUIR MINHA CONTA'),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;

export type RegisterUserInput = Pick<RegisterBody, 'name' | 'email' | 'password'>;

export type LoginBody = z.infer<typeof loginBodySchema>;

export type DeleteAccountBody = z.infer<typeof deleteAccountBodySchema>;

export const publicUserSchema = z.object({
  shortId: shortIdParamSchema,
  name: z.string(),
});

export const authTokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  shortId: shortIdParamSchema,
  name: z.string(),
});

export type AuthTokenPayload = z.infer<typeof authTokenPayloadSchema>;
