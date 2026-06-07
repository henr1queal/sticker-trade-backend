const shortIdParam = {
  name: 'targetShortId',
  in: 'path' as const,
  required: true,
  schema: {
    type: 'string' as const,
    pattern: '^[A-HJ-NP-Z]{2}[0-9]{7}$',
    example: 'HE4829173',
  },
  description: 'Código público do usuário (2 letras + 7 dígitos)',
};

const friendShortIdParam = {
  name: 'friendShortId',
  in: 'path' as const,
  required: true,
  schema: {
    type: 'string' as const,
    pattern: '^[A-HJ-NP-Z]{2}[0-9]{7}$',
    example: 'HE4829173',
  },
};

const requestIdParam = {
  name: 'requestId',
  in: 'path' as const,
  required: true,
  schema: { type: 'string' as const, format: 'uuid' },
};

const stickerCodeParam = {
  name: 'code',
  in: 'path' as const,
  required: true,
  schema: { type: 'string' as const, example: 'BRA2' },
};

const errorResponse = (description = 'Erro') => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
});

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'StickerTrade API',
    version: '1.0.0',
    description: [
      'API REST para troca de figurinhas da Copa do Mundo 2026.',
      '',
      '**Autenticação:** após login/registro, a sessão fica em cookie httpOnly `access_token`.',
      'No Swagger UI use **Authorize** com Bearer (cole o token se testar via header) ou faça login antes no frontend.',
      '',
      '**Rotas ops** (`/api/ops/{token}/…`) exigem header `X-Ops-Token` e só existem se `OPS_ROUTE_TOKEN` estiver configurado no servidor.',
    ].join('\n'),
    contact: {
      name: 'StickerTrade',
    },
  },
  servers: [
    { url: 'http://127.0.0.1:3000', description: 'Local (Docker ou npm run dev)' },
  ],
  tags: [
    { name: 'Health', description: 'Disponibilidade da API' },
    { name: 'Auth', description: 'Cadastro, login e conta' },
    { name: 'Public', description: 'Dados públicos por código (sem login)' },
    { name: 'Album', description: 'Álbum e catálogo do usuário logado' },
    { name: 'Trade', description: 'Cruzamento de figurinhas' },
    { name: 'Friends', description: 'Amizades e solicitações' },
    { name: 'Profile', description: 'Perfil e redes sociais' },
    { name: 'Feedback', description: 'Sugestões e bugs' },
    { name: 'POI', description: 'Pontos de interesse (geo)' },
    { name: 'Ops', description: 'Observabilidade interna (protegida)' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description: 'JWT emitido no login (httpOnly). Preferencial em browsers.',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Alternativa para testes via curl/Postman.',
      },
      opsToken: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Ops-Token',
        description: 'Valor de ADMIN_API_KEY no .env do servidor.',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          statusCode: { type: 'integer' },
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
      PublicUser: {
        type: 'object',
        properties: {
          shortId: { type: 'string', example: 'HE4829173' },
          name: { type: 'string', example: 'Henrique' },
        },
      },
      StickerSummary: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          need: { type: 'integer' },
          dupe: { type: 'integer' },
          pasted: { type: 'integer' },
        },
      },
      StickerEntry: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'BRA2' },
          type: { type: 'string', enum: ['fwc', 'team', 'cc'] },
          number: { type: 'integer' },
          label: { type: 'string' },
          playerName: { type: 'string' },
          teamCode: { type: 'string' },
          teamName: { type: 'string' },
          state: { type: 'string', enum: ['need', 'dupe', 'pasted'] },
        },
      },
      PublicCollection: {
        type: 'object',
        properties: {
          shortId: { type: 'string' },
          name: { type: 'string' },
          summary: { $ref: '#/components/schemas/StickerSummary' },
          needs: { type: 'array', items: { $ref: '#/components/schemas/StickerEntry' } },
          dupes: { type: 'array', items: { $ref: '#/components/schemas/StickerEntry' } },
        },
      },
      AuthUser: {
        type: 'object',
        properties: {
          shortId: { type: 'string' },
          name: { type: 'string' },
        },
      },
      RegisterBody: {
        type: 'object',
        required: ['name', 'email', 'password', 'passwordConfirm', 'formLoadedAt', 'acceptTerms'],
        properties: {
          name: { type: 'string', maxLength: 120 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 5 },
          passwordConfirm: { type: 'string' },
          formLoadedAt: { type: 'integer', description: 'Date.now() ao carregar o formulário' },
          acceptTerms: { type: 'boolean', enum: [true] },
          turnstileToken: { type: 'string' },
          website: { type: 'string', maxLength: 0, description: 'Honeypot — deixe vazio' },
        },
      },
      LoginBody: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      UpdateAlbumBody: {
        type: 'object',
        required: ['state'],
        properties: {
          state: { type: 'string', enum: ['need', 'pasted', 'dupe'] },
        },
      },
      SendFriendRequestBody: {
        type: 'object',
        required: ['targetShortId'],
        properties: {
          targetShortId: { type: 'string', example: 'HE4829173' },
        },
      },
      CreateFeedbackBody: {
        type: 'object',
        required: ['category', 'message'],
        properties: {
          category: { type: 'string', enum: ['SUGGESTION', 'BUG', 'OTHER'] },
          message: { type: 'string', minLength: 10, maxLength: 2000 },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'API, Postgres e Redis ok',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    postgres: { type: 'string' },
                    redis: { type: 'string' },
                  },
                },
              },
            },
          },
          '503': errorResponse('Dependência indisponível'),
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Criar conta',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } },
        },
        responses: {
          '201': {
            description: 'Conta criada; cookie de sessão definido',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/AuthUser' } },
                },
              },
            },
          },
          '400': errorResponse,
          '409': errorResponse,
          '429': errorResponse,
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Entrar',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } },
        },
        responses: {
          '200': {
            description: 'Login ok; cookie de sessão definido',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/AuthUser' } },
                },
              },
            },
          },
          '401': errorResponse,
          '429': errorResponse,
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Sair',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { '204': { description: 'Sessão encerrada' } },
      },
    },
    '/api/auth/account': {
      delete: {
        tags: ['Auth'],
        summary: 'Excluir conta (LGPD)',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password', 'confirmPhrase'],
                properties: {
                  password: { type: 'string' },
                  confirmPhrase: { type: 'string', enum: ['EXCLUIR MINHA CONTA'] },
                },
              },
            },
          },
        },
        responses: { '204': { description: 'Conta removida' }, '401': errorResponse },
      },
    },
    '/api/public/{targetShortId}': {
      get: {
        tags: ['Public'],
        summary: 'Perfil público (nome + código)',
        parameters: [shortIdParam],
        responses: {
          '200': {
            description: 'Usuário encontrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PublicUser' } } },
          },
          '404': errorResponse,
        },
      },
    },
    '/api/public/{targetShortId}/collection': {
      get: {
        tags: ['Public'],
        summary: 'Arsenal público (repetidas e faltas)',
        description: 'Visível para quem possui o link de convite `/add/{código}`.',
        parameters: [shortIdParam],
        responses: {
          '200': {
            description: 'Coleção de troca',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PublicCollection' } } },
          },
          '404': errorResponse,
        },
      },
    },
    '/api/stickers/catalog': {
      get: {
        tags: ['Album'],
        summary: 'Catálogo do álbum com estados',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['fwc', 'team', 'cc'] } },
          { name: 'team', in: 'query', schema: { type: 'string', example: 'BRA' } },
          { name: 'state', in: 'query', schema: { type: 'string', enum: ['need', 'pasted', 'dupe'] } },
        ],
        responses: {
          '200': { description: 'Catálogo filtrado' },
          '401': errorResponse,
        },
      },
    },
    '/api/album/{code}': {
      patch: {
        tags: ['Album'],
        summary: 'Atualizar estado de uma figurinha',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [stickerCodeParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateAlbumBody' } } },
        },
        responses: { '200': { description: 'Estado atualizado' }, '400': errorResponse, '401': errorResponse },
      },
    },
    '/api/trade/match/{targetShortId}': {
      get: {
        tags: ['Trade'],
        summary: 'Cruzamento de trocas com outro usuário',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [shortIdParam],
        responses: {
          '200': { description: 'Listas iNeedFromThem / theyNeedFromMe' },
          '401': errorResponse,
          '404': errorResponse,
        },
      },
    },
    '/api/friends': {
      get: {
        tags: ['Friends'],
        summary: 'Listar amigos',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { '200': { description: 'Lista de amigos' }, '401': errorResponse },
      },
    },
    '/api/friends/requests': {
      get: {
        tags: ['Friends'],
        summary: 'Solicitações de amizade (entrada e saída)',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { '200': { description: 'Solicitações' }, '401': errorResponse },
      },
      post: {
        tags: ['Friends'],
        summary: 'Enviar solicitação de amizade',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SendFriendRequestBody' } },
          },
        },
        responses: { '201': { description: 'Solicitação criada' }, '401': errorResponse, '409': errorResponse },
      },
    },
    '/api/friends/requests/incoming/count': {
      get: {
        tags: ['Friends'],
        summary: 'Contagem de solicitações pendentes recebidas',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { '200': { description: 'Número de pendentes' }, '401': errorResponse },
      },
    },
    '/api/friends/relationship/{targetShortId}': {
      get: {
        tags: ['Friends'],
        summary: 'Status da relação com outro usuário',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [shortIdParam],
        responses: { '200': { description: 'Status (none, friends, pending, …)' }, '401': errorResponse },
      },
    },
    '/api/friends/requests/{requestId}/accept': {
      post: {
        tags: ['Friends'],
        summary: 'Aceitar solicitação',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [requestIdParam],
        responses: { '200': { description: 'Amizade criada' }, '401': errorResponse, '404': errorResponse },
      },
    },
    '/api/friends/requests/{requestId}/reject': {
      post: {
        tags: ['Friends'],
        summary: 'Recusar solicitação',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [requestIdParam],
        responses: { '204': { description: 'Recusada' }, '401': errorResponse },
      },
    },
    '/api/friends/requests/{requestId}': {
      delete: {
        tags: ['Friends'],
        summary: 'Cancelar solicitação enviada',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [requestIdParam],
        responses: { '204': { description: 'Cancelada' }, '401': errorResponse },
      },
    },
    '/api/friends/{friendShortId}': {
      get: {
        tags: ['Friends'],
        summary: 'Detalhe do amigo (match + contatos)',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [friendShortIdParam],
        responses: { '200': { description: 'Perfil e trocas' }, '401': errorResponse, '403': errorResponse },
      },
      delete: {
        tags: ['Friends'],
        summary: 'Remover amizade',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [friendShortIdParam],
        responses: { '204': { description: 'Amizade removida' }, '401': errorResponse },
      },
    },
    '/api/profile/me': {
      get: {
        tags: ['Profile'],
        summary: 'Meu perfil',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { '200': { description: 'Perfil' }, '401': errorResponse },
      },
      patch: {
        tags: ['Profile'],
        summary: 'Atualizar perfil',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  instagram: { type: 'string' },
                  whatsapp: { type: 'string' },
                  shareInstagramWithFriends: { type: 'boolean' },
                  shareWhatsappWithFriends: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Perfil atualizado' }, '401': errorResponse },
      },
    },
    '/api/feedback': {
      post: {
        tags: ['Feedback'],
        summary: 'Enviar feedback',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateFeedbackBody' } },
          },
        },
        responses: { '201': { description: 'Feedback registrado' }, '401': errorResponse },
      },
    },
    '/api/poi/nearby': {
      get: {
        tags: ['POI'],
        summary: 'POIs próximos (geo)',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'lat', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'lng', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'radiusKm', in: 'query', schema: { type: 'number', default: 5 } },
        ],
        responses: { '200': { description: 'Lista de POIs' }, '401': errorResponse },
      },
    },
    '/api/ops/{opsToken}/metrics': {
      get: {
        tags: ['Ops'],
        summary: 'Métricas por endpoint',
        description: 'Rota só registrada se OPS_ROUTE_TOKEN estiver no .env.',
        security: [{ opsToken: [] }],
        parameters: [
          {
            name: 'opsToken',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Valor de OPS_ROUTE_TOKEN',
          },
        ],
        responses: { '200': { description: 'Métricas agregadas' }, '404': errorResponse },
      },
    },
    '/api/ops/{opsToken}/logs': {
      get: {
        tags: ['Ops'],
        summary: 'Logs recentes de erro',
        security: [{ opsToken: [] }],
        parameters: [
          { name: 'opsToken', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', maximum: 200, default: 100 } },
        ],
        responses: { '200': { description: 'Logs' }, '404': errorResponse },
      },
    },
    '/api/ops/{opsToken}/feedback': {
      get: {
        tags: ['Ops'],
        summary: 'Feedback dos usuários',
        security: [{ opsToken: [] }],
        parameters: [
          { name: 'opsToken', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', maximum: 100, default: 50 } },
        ],
        responses: { '200': { description: 'Lista de feedback' }, '404': errorResponse },
      },
    },
  },
};
