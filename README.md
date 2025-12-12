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

## Distribute to friends (two parts)
There are two deliverables when you want others to use Mcord:

1. **User installer (.exe) for Windows** – so friends can install the desktop client.
2. **Server runtime** – so you (or a host) can run the API + database that everyone connects to.

### 1) Build a Windows installer (.exe)
- Install Windows build tools (Visual Studio Build Tools or `windows-build-tools`), then run these from the repo root:
  ```bash
  pnpm install
  pnpm --filter desktop build
  pnpm --filter desktop package:win
  ```
- Output: `apps/desktop/release/Mcord-Setup-<version>.exe`. Share this file with users; the installer lets them choose an install folder.
- Configure the client to point at your server by editing `apps/desktop/.env` (or the built-in env before packaging) to set `VITE_API_URL` to your public API URL (e.g., `https://chat.yourdomain.com`).

### 2) Run the server for public access
- Choose where to host: a Windows or Linux box works. Ensure ports 3001 (API) and 6379/5432 (or mapped equivalents) are reachable or behind a reverse proxy.
- Steps on the host:
  ```bash
  git clone <this repo>
  cd Mcord
  cp apps/api/.env.example apps/api/.env   # set strong JWT secret & DB creds
  docker-compose up -d                    # launches Postgres + Redis
  pnpm install
  pnpm db:migrate
  pnpm --filter api prisma:generate
  pnpm --filter api seed                  # optional demo user/roles
  pnpm --filter api start:dev             # or build a prod NestJS bundle
  ```
- Harden before going public: use HTTPS (reverse proxy like Nginx/Caddy), set firewall rules, enable rate limiting, rotate secrets, and back up Postgres/Redis regularly.
- After the server is reachable, rebuild the installer (or share a `.env` file) with `VITE_API_URL` pointing to the public host so the client connects correctly.

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
