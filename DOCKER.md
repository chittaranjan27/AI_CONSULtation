# 🐳 Docker Environment Guide — Brahma Graha

This project includes a comprehensive, production-optimized containerized Docker setup designed for Next.js 16 (React 19), Prisma ORM, Redis, and cloud-hosted **Neon DB**.

---

## 🏗️ Services Architecture

```
                               ┌────────────────────────────────────────┐
                               │         Browser / API Clients          │
                               └───────────────────┬────────────────────┘
                                                   │ http://localhost:3000
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Docker Network: brahma_net                                                       │
│                                                                                  │
│   ┌─────────────────────────────────────────┐     ┌───────────────────────────┐  │
│   │  brahma-graha-web                       │     │  brahma-graha-redis       │  │
│   │  (Next.js 16 Standalone, Node 22 Alpine)│────▶│  (redis:7-alpine)         │  │
│   │  Port 3000:3000                         │     │  Port 6379:6379           │  │
│   └────────────────────┬────────────────────┘     └───────────────────────────┘  │
│                        │                                                         │
│                        │ TLS / SSL Handshake (sslmode=require)                   │
└────────────────────────┼─────────────────────────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Cloud Database (Neon DB)                                                         │
│ ep-*.us-east-1.aws.neon.tech:5432                                                │
│ Single source of truth shared between Local Dev & Docker Containers              │
└──────────────────────────────────────────────────────────────────────────────────┘

*Optional Local Sandbox Services (profile: local-db):
  - brahma-graha-postgres (postgres:16-alpine on host port 5433:5432)
  - brahma-graha-adminer (adminer:latest on host port 8080:8080)
```

---

## 🧩 Services Table

| Service | Container Name | Image / Tech | Host Port | Status & Purpose |
|---|---|---|---|---|
| **Web** | `brahma-graha-web` | Next.js 16 Standalone (Node 22 Alpine) | `3000:3000` | Core SaaS application & streaming AI routes |
| **Redis** | `brahma-graha-redis` | `redis:7-alpine` | `6379:6379` | In-memory cache & queue store |
| **PostgreSQL (Sandbox)** | `brahma-graha-postgres` | `postgres:16-alpine` | `5433:5432` | Optional offline sandbox (starts only with `--profile local-db`) |
| **Adminer (Sandbox GUI)** | `brahma-graha-adminer` | `adminer:latest` | `8080:8080` | Optional Web GUI for local DB (starts only with `--profile local-db`) |

---

## ☁️ Neon DB (Cloud Database) Configuration

### How It Works
- **Automatic Loading**: Docker Compose automatically loads your `.env` file via `env_file: - .env`.
- **Database Connection String**: Docker reads the exact same `DATABASE_URL` used by your local Windows environment:
  ```env
  DATABASE_URL="postgresql://neondb_owner:password@ep-your-subdomain.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30&connection_limit=3"
  ```
- **SSL Certificate Verification**: The Docker image installs Alpine's `ca-certificates` package (`apk add --no-cache ca-certificates`) to validate Amazon Trust Services root certificates used by Neon DB.
- **Serverless Resilience**: In serverless databases like Neon, the compute endpoint automatically suspends when inactive. The container's startup probe ([docker-entrypoint.sh](file:///c:/Users/HP/OneDrive/Desktop/Brahma%20Graha/brahma-graha/docker-entrypoint.sh)) waits for Neon compute to wake up before serving traffic.

---

## 🚀 Quick Start (Production Mode)

Starts the optimized, standalone Next.js container and Redis in the background:

```bash
# 1. Start services in background
npm run docker:up
# (Equivalent to: docker compose up -d)

# 2. View running containers
docker ps

# 3. Stream real-time container logs
npm run docker:logs
# (Equivalent to: docker compose logs -f)

# 4. Stop all containers
npm run docker:down
# (Equivalent to: docker compose down)
```

Application is available at **[http://localhost:3000](http://localhost:3000)**.

---

## 💻 Development Mode (Live Reload & Fast Refresh)

When actively writing code or tweaking UI components, run the development compose file. It mounts your host files directly into the container so file modifications trigger instant hot-reloading:

```bash
# Start in live development mode
npm run docker:dev
# (Equivalent to: docker compose -f docker-compose.dev.yml up)

# Stop development mode
docker compose -f docker-compose.dev.yml down
```

---

## 🧪 Optional: Local PostgreSQL Sandbox Mode

If you need to develop completely offline (without internet access to Neon DB), you can activate the local PostgreSQL container and Adminer dashboard using the `local-db` profile:

```bash
# Start with local database sandbox
docker compose --profile local-db up -d
```

### Adminer Web GUI
When the `local-db` profile is running, Adminer is accessible at:
👉 **[http://localhost:8080](http://localhost:8080)**

**Login Credentials for Adminer:**
- **System:** `PostgreSQL`
- **Server:** `postgres`
- **Username:** `postgres`
- **Password:** `postgres`
- **Database:** `brahma_graha`

> **Port Conflict Protection:** The local PostgreSQL container is mapped to host port **`5433`** (`5433:5432`) to prevent collisions with any native PostgreSQL running on port `5432` on your Windows machine.

---

## 🏗️ Multi-Stage Dockerfile Architecture

The [Dockerfile](file:///c:/Users/HP/OneDrive/Desktop/Brahma%20Graha/brahma-graha/Dockerfile) uses a 4-stage build to achieve a production image size of only **~188 MB**:

1. **Stage 1 (`base`)**:
   - `node:22-alpine` base image.
   - Installs `libc6-compat`, `openssl`, and `ca-certificates` for Prisma native binaries and cloud SSL verification.
2. **Stage 2 (`deps`)**:
   - Copies `package.json`, `package-lock.json`, and `prisma/schema.prisma`.
   - Runs `npm ci` with caching layers.
3. **Stage 3 (`builder`)**:
   - Generates Prisma client specifically for the container's Linux engine (`npx prisma generate`).
   - Builds the Next.js application using Turbopack with `output: "standalone"` enabled.
4. **Stage 4 (`runner`)**:
   - Creates a non-root system user (`nextjs:nodejs`).
   - Copies only the standalone bundle (`.next/standalone`), static files (`.next/static`), and `public`.
   - Sets non-root permissions and runs via `docker-entrypoint.sh`.

---

## 🔄 Management & Troubleshooting Commands

| Task | Command |
|---|---|
| Start full stack (Neon DB + Redis) | `npm run docker:up` |
| Stop all containers | `npm run docker:down` |
| Start live dev mode (hot reload) | `npm run docker:dev` |
| View live web logs | `docker compose logs -f web` |
| Rebuild containers after package changes | `npm run docker:build` |
| Push Prisma schema to Neon DB | `npx prisma db push` |
| Launch Prisma Studio | `npx prisma studio` |
| Open interactive shell inside web container | `docker compose exec web sh` |
| Test Redis connection | `docker compose exec redis redis-cli ping` |
| Clean reset (remove stopped containers & networks) | `docker compose down -v` |
