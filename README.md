# Mcord

Discord-like MVP with NestJS + Prisma API and Electron + React desktop client. Built as a pnpm workspace monorepo.

## Stack
- **apps/api**: NestJS, Prisma, Socket.IO, PostgreSQL, Redis
- **apps/desktop**: Electron shell with Vite + React renderer
- **packages/shared**: Shared TypeScript enums and payload types
- **docker-compose**: PostgreSQL + Redis

## Setup
1. Install pnpm (v8+).
2. Start infrastructure:
   ```bash
   docker-compose up -d
   ```
3. Install dependencies from repo root:
   ```bash
   pnpm install
   ```
4. Apply Prisma schema and generate client:
   ```bash
   pnpm db:migrate
   pnpm --filter api prisma:generate
   pnpm --filter api seed   # optional demo data
   ```
5. Create environment files from examples:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/desktop/.env.example apps/desktop/.env
   ```
6. Run development servers (API on 3001, Vite on 5173, Electron auto-opens):
   ```bash
   pnpm dev
   ```

## API quick reference
Key REST endpoints:
- `POST /auth/register {email, username, password}`
- `POST /auth/login {email, password}`
- `GET /auth/me`
- `POST /servers {name}`
- `GET /servers`
- `POST /servers/:id/channels {name}`
- `GET /servers/:id/channels`
- `GET /channels/:id/messages?before&limit`
- `POST /channels/:id/messages {content}`
- `PATCH /messages/:id {content}`
- `DELETE /messages/:id`

WebSocket events (Socket.IO): `MESSAGE_CREATE`, `MESSAGE_UPDATE`, `MESSAGE_DELETE`, `PRESENCE_UPDATE`, `TYPING_START`.

Permissions follow Discord-like layering: @everyone + member roles, then per-channel overrides; ADMINISTRATOR allows all.

### Secure token storage
Electron preload saves the JWT token to a local file `.mcord-token`. Replace with a keytar-based store for production-grade security.

## Scripts
- `pnpm dev` – concurrently runs API and desktop dev servers
- `pnpm db:migrate` – Prisma migrate dev
- `pnpm lint` – run eslint across packages
- `pnpm test` – run Jest unit tests

## Architecture notes
- `GatewayModule` wires Socket.IO for realtime chat, presence, and typing (Redis-backed TTL for typing spam control).
- `PermissionsService` centralizes effective permission calculation with per-channel overrides.
- Server creation seeds @everyone/Admin/Member roles and a `#general` channel.
- Desktop client consumes REST + WebSocket API and shows login/register, servers, channels, chat with typing indicator and presence list.

## Windows 10/11 compatibility & public use
- **Local development on Windows**: Works on Windows 10/11 with Node 18+ and pnpm. Use Docker Desktop for Postgres/Redis; Electron/Vite run natively. If you prefer WSL2, ensure Docker is exposed to WSL and forward ports 3001/5173.
- **Building distributables**: Electron packaging for Windows is supported; install required Windows build tools (`windows-build-tools` or Visual Studio Build Tools) before running bundling commands.
- **Public/production readiness**: This is an MVP. Before exposing publicly, add HTTPS termination, strong JWT secrets in env, CORS/CSRF limits, rate limiting, per-user logging/monitoring, production token storage (swap `.mcord-token` for keytar or OS credential vault), and a backup/rotation plan for Postgres/Redis.
