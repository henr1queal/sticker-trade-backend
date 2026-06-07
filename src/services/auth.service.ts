import * as argon2 from 'argon2';
import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
import { userAlbumKeys } from '../lib/redis-keys.js';
import { generateShortId } from '../lib/short-id.js';
import { generateUuidV7 } from '../lib/uuid.js';
import type { AuthTokenPayload } from '../schemas/auth.schemas.js';
import type { DeleteAccountBody, LoginBody, RegisterUserInput } from '../schemas/auth.schemas.js';

const MAX_SHORT_ID_ATTEMPTS = 20;

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly redis: Redis,
  ) {}

  async register(input: RegisterUserInput): Promise<AuthTokenPayload> {
    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    for (let attempt = 0; attempt < MAX_SHORT_ID_ATTEMPTS; attempt += 1) {
      const shortId = generateShortId(input.name);

      try {
        const user = await this.prisma.user.create({
          data: {
            id: generateUuidV7(),
            shortId,
            name: input.name,
            email: input.email,
            passwordHash,
            termsAcceptedAt: new Date(),
          },
          select: {
            id: true,
            shortId: true,
            name: true,
          },
        });

        return {
          sub: user.id,
          shortId: user.shortId,
          name: user.name,
        };
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          const target = getUniqueTarget(error);

          if (target === 'shortId') {
            continue;
          }

          if (target === 'email') {
            throw new ConflictError('E-mail já está cadastrado');
          }
        }

        if (isPrismaClientError(error)) {
          throw new Error('Não foi possível criar a conta. Tente novamente.');
        }

        throw error;
      }
    }

    throw new Error('Não foi possível gerar um código único');
  }

  async login(input: LoginBody): Promise<AuthTokenPayload> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        shortId: true,
        name: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const passwordValid = await argon2.verify(user.passwordHash, input.password);

    if (!passwordValid) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    return {
      sub: user.id,
      shortId: user.shortId,
      name: user.name,
    };
  }

  async deleteAccount(userId: string, input: DeleteAccountBody): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Usuário não encontrado');
    }

    const passwordValid = await argon2.verify(user.passwordHash, input.password);

    if (!passwordValid) {
      throw new UnauthorizedError('Senha incorreta');
    }

    const pipeline = this.redis.pipeline();

    for (const key of userAlbumKeys(userId)) {
      pipeline.del(key);
    }

    await pipeline.exec();
    await this.prisma.user.delete({ where: { id: userId } });
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

function isUniqueConstraintError(error: unknown): error is { code: string; meta?: { target?: string[] } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

function getUniqueTarget(error: { meta?: { target?: string[] } }): string | undefined {
  return error.meta?.target?.[0];
}

function isPrismaClientError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    String((error as { name: string }).name).includes('Prisma')
  );
}
