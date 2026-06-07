# StickerTrade

Aplicativo web para **organizar o álbum de figurinhas** da Copa do Mundo 2026 e **facilitar trocas** entre colecionadores — com convite por link, arsenal público antes do cadastro, amizades e cruzamento de repetidas/faltas.

> Repositório do **backend** (API REST). O frontend SolidJS fica em [`sticker-trade-frontend`](https://github.com/RhuanLNO/sticker-trade-frontend) (projeto com colaboração do @RhuanLNO).

---

## Stack e detalhes sobre a aplicação

| Tópico | O que foi feito |
|--------|-----------------|
| **Stack** | Node 20 · Fastify 5 · TypeScript · Prisma · PostgreSQL · Redis |
| **Frontend** | Tauri · SolidJS · Vite · Tailwind (repo separado) |
| **Auth** | JWT em cookie httpOnly · Argon2 · rate limit em login/cadastro |
| **Dados** | Postgres (usuários, amizades, perfil) + Redis (álbum alto I/O) |
| **API docs** | OpenAPI 3 + Swagger UI em [`/docs`](http://127.0.0.1:3000/docs) |
| **LGPD** | Termos no cadastro · exclusão de conta · política de privacidade |
| **Observabilidade** | Métricas/logs em Redis · rotas ops protegidas por token opaco |

---

## Arquitetura (visão rápida)

```
┌─────────────┐     HTTPS/HTTP      ┌──────────────────────────────────┐
│  Frontend   │ ──────────────────► │  Fastify API (:3000)             │
│  SolidJS    │   cookie + /api     │  auth · album · friends · trade  │
└─────────────┘                     └───────────┬──────────┬───────────┘
                                                │          │
                                    ┌───────────▼──┐   ┌───▼────┐
                                    │  PostgreSQL  │   │ Redis  │
                                    │  users, etc. │   │ álbum  │
                                    └──────────────┘   └────────┘
```

- **~980 figurinhas** (FWC + 48 seleções × 20 + Coca-Cola) definidas em código (`src/data/sticker-catalog.ts`).
- Estado do álbum (`need` / `pasted` / `dupe`) vive em **sets Redis** por usuário.
- Link de convite: `{FRONTEND_URL}/add/{código}` — visitante vê o **arsenal público** (repetidas e faltas) antes de criar conta.

---

## Pré-requisitos

- **Node.js** ≥ 20
- **Docker** + Docker Compose (caminho mais simples)
- Ou Postgres 16 + Redis 7 instalados localmente

---

## Instalação rápida (Docker — recomendado)

```bash
git clone <url-do-repo> sticker-trade
cd sticker-trade/sticker-trade-backend   # ou nome do diretório do backend

cp .env.example .env
# Edite .env: JWT_SECRET, COOKIE_SECRET e ADMIN_API_KEY (mín. 32 caracteres cada)

docker compose up -d --build
```

A API sobe em **http://127.0.0.1:3000**.

Verifique:

```bash
curl http://127.0.0.1:3000/health
# → {"status":"ok","postgres":"ok","redis":"ok"}
```

Documentação interativa: **http://127.0.0.1:3000/docs**

---

## Desenvolvimento local (sem Docker na API)

### 1. Backend

```bash
cd sticker-trade-backend
cp .env.example .env
npm install

# Postgres + Redis (ex.: só infra via Docker)
docker compose up -d postgres redis

npm run db:migrate:dev   # primeira vez
npm run dev              # tsx watch — recarrega ao salvar
```

### 2. Frontend

```bash
cd ../sticker-trade-frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:1420 — proxy /api → :3000
```

### Scripts úteis (backend)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | API com hot reload |
| `npm run build` | Compila TypeScript → `dist/` |
| `npm start` | Produção (`node dist/server.js`) |
| `npm run db:migrate` | Aplica migrations (deploy) |
| `npm run db:generate` | Regenera Prisma Client |

---

## Documentação da API (Swagger)

Com a API rodando:

| URL | Conteúdo |
|-----|----------|
| http://127.0.0.1:3000/docs | Swagger UI (testar endpoints) |
| http://127.0.0.1:3000/docs/json | Spec OpenAPI 3 em JSON |

- Ligado por padrão em **development** (`DOCS_ENABLED=true` no `.env.example`).
- Em **production**, docs ficam **desligados** salvo `DOCS_ENABLED=true`.

Fluxo típico no Swagger:

1. `POST /api/auth/register` ou `/login`
2. Cookie `access_token` é definido (teste pelo browser) **ou** use **Authorize** com Bearer JWT
3. Explore `/api/stickers/catalog`, `/api/friends`, etc.

Spec mantida em `src/openapi/document.ts`.

---

## Variáveis de ambiente

Copie `.env.example` → `.env`. Principais:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Postgres |
| `REDIS_URL` | Redis |
| `JWT_SECRET` / `COOKIE_SECRET` | Segredos (≥ 32 chars) |
| `CORS_ORIGINS` | Origens do frontend (vírgula) |
| `ADMIN_API_KEY` | Token ops (`X-Ops-Token`) |
| `OPS_ROUTE_TOKEN` | Segmento opaco na URL ops |
| `DOCS_ENABLED` | Swagger UI (`/docs`) |
| `TURNSTILE_SECRET_KEY` | Anti-bot no cadastro (opcional) |

---

## Endpoints principais

| Grupo | Exemplos |
|-------|----------|
| **Público** | `GET /api/public/{código}` · `GET /api/public/{código}/collection` |
| **Auth** | `POST /api/auth/register` · `login` · `logout` |
| **Álbum** | `GET /api/stickers/catalog` · `PATCH /api/album/{code}` |
| **Amigos** | `POST /api/friends/requests` · `GET /api/friends/{código}` |
| **Trade** | `GET /api/trade/match/{código}` |
| **Saúde** | `GET /health` |

Detalhes, schemas e exemplos: **Swagger UI** (`/docs`).

---

## Deploy em produção (sem domínio)

1. Defina `NODE_ENV=production` e segredos fortes no `.env`.
2. `CORS_ORIGINS` com a URL real do frontend (IP ou domínio).
3. **HTTPS obrigatório** — cookie de sessão usa `secure: true` em produção.
4. `docker compose up -d --build` na VPS; exponha `:3000` atrás de **nginx/Caddy**.
5. Frontend: `npm run build` + servir `dist/` (nginx) com `VITE_API_URL` apontando para a API.
6. Opcional: Cloudflare Tunnel ou Tailscale se não tiver domínio/certificado.

---

## Estrutura do repositório (backend)

```
src/
├── app.ts              # bootstrap Fastify
├── routes/             # rotas HTTP
├── services/           # regras de negócio
├── plugins/            # auth, security, swagger, observability
├── data/               # catálogo de figurinhas e elencos
├── openapi/            # spec OpenAPI
└── config/env.ts       # validação de env (Zod)
prisma/                 # schema e migrations
docker-compose.yml
```

---

## Licença

Projeto de portfólio / uso pessoal. Ajuste a licença conforme publicar no GitHub.

---

## Contato

Configure no frontend: `VITE_DEVELOPER_NAME` e `VITE_DEVELOPER_LINKEDIN` (tela de perfil).
