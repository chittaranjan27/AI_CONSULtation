# 🧠 Brahma Graha — AI Consultation & Lead Conversion SaaS

> **Multi-tenant AI chatbot platform** that powers intelligent consultation workflows, automated lead capture, RAG-based knowledge retrieval, and a rich embeddable widget ecosystem — built for modern businesses across wellness, e-commerce, and beyond.

---

## ✨ Features

### 🏢 Multi-Tenancy
- Full tenant isolation with slug-based routing and optional custom domains
- Role-based access control: `SUPER_ADMIN`, `TENANT_OWNER`, `MANAGER`, `SUPPORT_AGENT`, `ANALYST`
- Team invitations with expiring tokens
- Per-tenant branding (colors, fonts, logo)

### 🤖 AI Chatbots
- Create unlimited chatbots with custom system prompts, personalities, and consultation step flows
- **AI Providers supported**: OpenAI, Anthropic (Claude), Google Gemini, Groq, OpenRouter, Sarvam
- Per-chatbot model selection, temperature, token limits, and fallback providers
- Multilingual support with configurable supported languages
- Embeddable widget modes: **Floating**, **Inline**, **Full Page**
- Widget position: Bottom-Right, Bottom-Left, Top-Right, Top-Left

### 📚 Knowledge Base (RAG)
- Upload documents (PDF, DOCX, TXT, CSV) for Retrieval-Augmented Generation
- URL crawling & ingestion with job tracking
- Vector embedding storage and semantic search (`DocumentChunk` with float embeddings)
- Per-chatbot knowledge isolation

### 🎯 Lead Capture & CRM
- Configurable lead capture fields per chatbot
- Lead scoring (0–100), status pipeline: `NEW → CONTACTED → QUALIFIED → WON/LOST`
- Full lead event timeline (notes, emails, state changes)
- Lead analytics and export

### 📊 Analytics & Reporting
- Daily stats: conversations, messages, leads, widget opens, completion rate
- LLM token usage tracking (input/output tokens, cost per conversation)
- **Voice analytics**: STT/TTS request counts, audio duration, characters synthesized, voice cost
- Per-tenant and per-chatbot breakdown

### 💳 Billing & Subscriptions
- Stripe integration (subscriptions, invoices, webhooks)
- Plan tiers: **Free**, **Starter**, **Pro**, **Enterprise**
- Usage records at conversation/session level
- Admin-configurable plan limits (chatbots, team members, token cap, lead cap)

### 🔗 Integrations
- Google Sheets, HubSpot, Salesforce, Calendly, Slack, Zapier, and more
- Webhook-based config storage (encrypted)

### 🔐 Security & Audit
- Full audit log trail (`user.login`, `chatbot.create`, `lead.export`, etc.)
- NextAuth.js v5 with Google & GitHub OAuth + email/OTP fallback
- Encrypted API key storage per tenant
- IP hashing for privacy-safe analytics

### 🛠️ Admin Dashboard
- Super Admin panel with tenant management, user management, billing oversight
- System notifications: new tenants, suspended accounts, high AI costs, payment failures
- Real-time analytics charts (Recharts)
- System operations panel

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Auth | [NextAuth.js v5](https://authjs.dev) + Prisma Adapter |
| Containerization | [Docker](https://www.docker.com) & Docker Compose (Multi-stage Node 22 Alpine) |
| Database | [Neon DB](https://neon.tech) / PostgreSQL via [Prisma ORM](https://prisma.io) |
| Cache & Queue | [Redis](https://redis.io) (Containerized) |
| AI SDK | [Vercel AI SDK v6](https://sdk.vercel.ai) |
| AI Providers | OpenAI, Anthropic, Google AI, Groq, OpenRouter |
| Charts | [Recharts](https://recharts.org) |
| Animations | [Framer Motion](https://framer.motion) |
| Forms | React Hook Form + Zod |
| Email | Nodemailer (SMTP) |
| File Storage | AWS S3 |
| Payments | Stripe |
| PDF Parsing | pdf-parse |
| Excel Export | xlsx |

---

## 📁 Project Structure

```
brahma-graha/
├── app/
│   ├── (admin)/admin/          # Super Admin routes
│   │   ├── page.tsx            # Admin dashboard
│   │   ├── tenants/            # Tenant management
│   │   ├── users/              # User management
│   │   ├── analytics/          # Platform analytics
│   │   ├── billing/            # Billing oversight
│   │   ├── notifications/      # System notifications
│   │   ├── settings/           # Platform settings
│   │   └── system-ops/         # System operations
│   ├── (auth)/                 # Auth pages (login, register, OTP)
│   ├── (dashboard)/dashboard/  # Tenant dashboard routes
│   │   ├── page.tsx            # Dashboard home
│   │   ├── chatbots/           # Chatbot management
│   │   ├── conversations/      # Conversation inbox
│   │   ├── knowledge-base/     # Document & crawl management
│   │   ├── leads/              # CRM & lead pipeline
│   │   ├── analytics/          # Tenant analytics
│   │   ├── products/           # Product catalog
│   │   ├── integrations/       # Third-party integrations
│   │   └── settings/           # Tenant settings
│   ├── api/                    # API route handlers
│   │   ├── admin/              # Admin APIs
│   │   ├── auth/               # Auth endpoints
│   │   ├── chat/               # Chat & streaming AI
│   │   ├── chatbots/           # Chatbot CRUD
│   │   ├── conversations/      # Conversation APIs
│   │   ├── knowledge/          # Knowledge base APIs
│   │   ├── knowledge-base/     # Document ingestion
│   │   ├── leads/              # Lead APIs
│   │   ├── products/           # Product APIs
│   │   ├── analytics/          # Analytics events
│   │   ├── integrations/       # Integration webhooks
│   │   ├── voice/              # STT / TTS APIs
│   │   ├── invite/             # Team invitation
│   │   └── tenant/             # Tenant management
│   └── embed/[chatbotId]/      # Embeddable widget page
├── components/
│   ├── admin/                  # Admin UI components
│   ├── dashboard/              # Tenant dashboard components
│   ├── landing/                # Landing page components
│   └── BubbleBackground.tsx    # Animated background
├── prisma/
│   ├── schema.prisma           # Full database schema
│   └── migrations/             # DB migration history
├── lib/                        # Shared utilities & server logic
├── types/                      # TypeScript type definitions
├── public/                     # Static assets
├── .env.example                # Environment variable template
└── next.config.ts              # Next.js configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Docker Desktop** (Recommended for full-stack containerized runs) — [Download Docker](https://www.docker.com/products/docker-desktop/)
- **Node.js** 20+ (if running without Docker)
- **Neon DB** account / PostgreSQL database — [Neon Console](https://neon.tech)
- **npm** (v10+)

---

### Option A: Running with Docker (Recommended)

The Docker setup runs the entire stack (Next.js 16 standalone web application + Redis) with zero manual environment configuration and connects directly to your cloud **Neon DB**.

```bash
# 1. Clone the repository
git clone <repo-url>
cd brahma-graha

# 2. Configure environment variables (using your Neon DB connection string)
cp .env.example .env

# 3. Start the entire container stack in the background
npm run docker:up
# Or: docker compose up -d

# 4. View real-time container logs
npm run docker:logs
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

To stop the containers:
```bash
npm run docker:down
```

---

### Option B: Running Locally (Node.js)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env

# 3. Synchronize database schema with Neon DB
npx prisma db push

# 4. Start local development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🐳 Docker Architecture & Environments

Brahma Graha includes a production-optimized container setup designed for high performance, small image size, and cloud database synchronization:

### 🧩 Active Services

| Service | Container Name | Technology | Ports | Purpose |
|---|---|---|---|---|
| **Web** | `brahma-graha-web` | Next.js 16 Standalone (Node 22 Alpine) | `3000:3000` | Full SaaS application & REST/Streaming APIs |
| **Redis** | `brahma-graha-redis` | `redis:7-alpine` | `6379:6379` | In-memory caching and session/queue management |
| **PostgreSQL (Optional)** | `brahma-graha-postgres` | `postgres:16-alpine` | `5433:5432` | Local offline sandbox (profile: `local-db`) |
| **Adminer (Optional)** | `brahma-graha-adminer` | `adminer:latest` | `8080:8080` | Local DB visual GUI dashboard (profile: `local-db`) |

### ☁️ Cloud Database (Neon DB) Integration

- **Single Source of Truth**: Docker directly loads your `.env` file, reading your `DATABASE_URL` for Neon DB (`ep-xyz.aws.neon.tech`).
- **Cloud SSL Security**: Built with `ca-certificates` inside the Alpine runner container to guarantee encrypted TLS handshakes with Neon DB in AWS (`sslmode=require`).
- **Cold-Start Resilience**: The container entrypoint ([docker-entrypoint.sh](file:///c:/Users/HP/OneDrive/Desktop/Brahma%20Graha/brahma-graha/docker-entrypoint.sh)) automatically detects and handles serverless compute sleep/wake cycles gracefully.
- **Zero Conflicts**: Your cloud data is shared between your local Windows workspace and Docker containers without duplicate databases or conflicting ports.

### 💻 Development with Live Reload (Docker Dev Mode)

For live code editing inside a container with Fast Refresh and hot-reloading:

```bash
npm run docker:dev
# Or: docker compose -f docker-compose.dev.yml up
```

This mounts your local files into the container while preserving isolated `node_modules` inside a Docker volume.

### 🧪 Optional Local Database Sandbox (`local-db` Profile)

If you ever wish to develop completely offline without an internet connection, you can spin up the isolated local PostgreSQL container and Adminer dashboard using the `local-db` profile:

```bash
docker compose --profile local-db up -d
```

- **Adminer GUI:** [http://localhost:8080](http://localhost:8080) (Server: `postgres`, User: `postgres`, Pass: `postgres`, DB: `brahma_graha`)
- **Host Port:** `5433` (Prevents port conflict with any native PostgreSQL running on port `5432`).

---

## 🗄️ Database Schema Overview

The Prisma schema (`prisma/schema.prisma`) defines the full multi-tenant data model:

| Model | Purpose |
|---|---|
| `Tenant` | Core tenant entity with branding, plan, Stripe ID |
| `User` | Tenant users with role-based access |
| `Chatbot` | AI chatbot config (model, prompt, widget, lead capture) |
| `Conversation` / `Message` | Chat sessions and message history with token tracking |
| `Visitor` | Anonymous or identified website visitors |
| `Document` / `DocumentChunk` | Knowledge base documents and vector embeddings |
| `CrawlJob` | URL crawl ingestion jobs |
| `Lead` / `LeadEvent` | CRM leads with scoring and event timeline |
| `AnalyticsEvent` / `DailyStats` | Platform analytics with voice & LLM cost breakdown |
| `Subscription` / `UsageRecord` / `Invoice` | Billing and per-conversation usage tracking |
| `Integration` | Third-party integration configs (encrypted) |
| `AuditLog` | Full audit trail per tenant |
| `Product` | Local product catalog linked to chatbots |
| `Plan` | Admin-defined plan tiers with feature gates |
| `SystemNotification` | Super admin notification center |
| `TenantApiKey` | Per-tenant encrypted AI provider keys |
| `Invitation` | Team member invitations with expiry |

---

## 🧩 Embedding the Widget

To embed a chatbot on any website, add this snippet to your HTML:

```html
<script
  src="https://your-domain.com/embed/CHATBOT_ID"
  async
></script>
```

Widget modes:
- **Floating** — Fixed chat bubble in corner (default)
- **Inline** — Embedded directly in a container element
- **Full Page** — Full-screen chat experience

Widget position and appearance are configured per chatbot in the dashboard.

---

## 🔑 AI Provider Support

Brahma Graha supports multiple AI providers. The platform admin can set default API keys, and individual tenants can supply their own:

| Provider | Models |
|---|---|
| **OpenAI** | GPT-4o, GPT-4o-mini, GPT-4-turbo, etc. |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Haiku, etc. |
| **Google** | Gemini 1.5 Pro, Gemini 1.5 Flash, etc. |
| **Groq** | Llama 3, Mixtral (ultra-fast inference) |
| **OpenRouter** | 100+ models via unified API |
| **Sarvam** | Indian language models |

---

## 📜 Available Scripts

```bash
npm run dev           # Start local development server
npm run build         # Build production bundle
npm run start         # Start production server
npm run lint          # Run ESLint
npx prisma studio     # Open Prisma GUI
npx prisma generate   # Regenerate Prisma client

# --- Docker Commands ---
npm run docker:up     # Launch entire Docker stack in background (Web, Postgres, Redis, Adminer)
npm run docker:down   # Stop all Docker containers
npm run docker:build  # Rebuild Docker images
npm run docker:logs   # View live logs from Docker containers
npm run docker:dev    # Start Docker development environment with live reload
```

> 📖 **Full Docker Guide:** See [DOCKER.md](file:///c:/Users/HP/OneDrive/Desktop/Brahma%20Graha/brahma-graha/DOCKER.md) for complete details on architecture, container ports, database credentials, and troubleshooting.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push and open a Pull Request

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

<p align="center">Built with ❤️ by the Brahma Graha Team</p>
