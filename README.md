<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/BullMQ-Async%20Queue-DC2626" />
  <img src="https://img.shields.io/badge/Redis-Background%20Jobs-red?logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Resend-Email%20Automation-7C3AED" />
  <img src="https://img.shields.io/badge/DeepSeek-AI%20SDR-4F46E5" />
  <img src="https://img.shields.io/badge/Vercel-Web%20Deploy-black?logo=vercel" />
  <img src="https://img.shields.io/badge/Railway-Worker%20Runtime-0B0D0E?logo=railway" />
</p>

<h1 align="center">
  SalesAgent AI
</h1>

<p align="center">
  AI sales agents that qualify, follow up, and book meetings automatically.
</p>

<p align="center">
  AI SDR infrastructure for outbound sales — multi-channel inbox, campaign orchestration, and real-time monitoring.
</p>

---

# What is this?

SalesAgent AI is an **AI SDR (Sales Development Representative) platform**.

Not a generic CRM.
Not a workflow builder.
Not an AI chatbot wrapper.

It's infrastructure for running AI-powered outbound sales at scale:

- AI agents that respond to inbound leads automatically
- Outbound email campaigns with personalized AI sequences
- Lead qualification and scoring
- Conversation memory across channels
- Real-time inbox for human oversight
- Campaign analytics and reply tracking

---

# Who is this for?

- **SaaS startups** that need to scale outbound without hiring a 10-person SDR team
- **Agencies** running outreach for multiple clients
- **Sales teams** that want AI to handle first-touch qualification
- **Founders** doing their own sales who need AI assistant

---

# Core Product

## AI SDR Agents

Configure AI sales agents with personality, product knowledge, and goals. Each agent handles conversations autonomously — qualifying leads, answering questions, handling objections, and booking meetings.

```
Agent "Inbound SDR"
  ├── Personality: Friendly, consultative, SPIN methodology
  ├── Knowledge: Product docs, pricing, FAQs, competitor comparisons
  ├── Goals: Qualify inbound leads → book discovery calls
  └── Constraints: Max 50 emails/day, human review for leads scored > 80
```

## Conversation Inbox

Unified inbox across all channels. See every conversation, AI-generated draft replies, lead context, and qualification scores in one view.

```
┌─ Inbox ─────────────────────────────────────────────┐
│                                                      │
│  Conversations          │  Thread + AI Draft         │
│  ├─ Alice · Hot · 85   │  ├─ Lead: Alice Chen       │
│  ├─ Bob · Warm · 62    │  │   Score: 85 · Qualified │
│  ├─ Carol · Cold · 35  │  ├─ Conversation history   │
│  └─ Dave · Hot · 91    │  └─ AI Draft → Edit → Send │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Outbound Campaigns

Create multi-step outbound sequences with AI personalization, delays, and automatic reply detection.

```
Campaign "SaaS Founder Outreach"
  Day 1  → AI-personalized cold email
  Day 3  → Follow-up (no reply detected)
  Day 7  → Value prop + case study
  Day 14 → Breakup email

  Reply detected? → Stop sequence, route to inbox
  No reply?       → Continue to next step
```

## Lead Qualification

AI scores every lead across 5 dimensions: intent, budget, authority, need, and timeline. Hot leads get auto-routed to human SDRs. Warm leads stay in AI nurture. Cold leads enter long-term re-engagement.

## Script Playground

Type a natural language prompt and get a complete sales playbook:

> "Generate a cold outbound campaign for SaaS founders who just raised Series A"

AI outputs: complete email sequence with subject lines, templates, follow-up timing, and personalization variables.

---

# Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 14 Web App                    │
│                  (Vercel, pnpm hoisted)                  │
│                                                         │
│  Landing · Dashboard · Inbox · Agents · Campaigns        │
│  Leads · Scripts · Settings · API Docs                  │
│  35 API Routes + SSE + Webhook                          │
└──────────┬──────────────────────────────────────────────┘
           │
    ┌──────┼──────────────────┐
    │      │                  │
    ▼      ▼                  ▼
┌──────┐ ┌──────────┐ ┌─────────────┐
│Supabase│ │Upstash   │ │ DeepSeek    │
│Postgres│ │Redis     │ │ AI API      │
│        │ │          │ │             │
│schema: │ │4 queues: │ │ compose     │
│sales_  │ │conversation│ │ score      │
│agent   │ │email     │ │ summarize   │
│        │ │campaign  │ │ gen-script  │
│10      │ │scoring   │ │             │
│models  │ │prefix:   │ │             │
└───┬────┘ │sales-agent│ └─────────────┘
    │      └─────┬─────┘
    │            │
    ▼            ▼
┌──────────────────────────────────────┐
│         Railway Worker               │
│                                       │
│  AI Response Pipeline                 │
│  Campaign Sequence Engine             │
│  Email Delivery (Resend)              │
│  Lead Scoring                         │
│  Healthcheck HTTP Server              │
└──────────────────────────────────────┘
```

---

# Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 App Router, React 18, Tailwind CSS |
| Language | TypeScript (strict) |
| UI | shadcn/ui components, glass morphism design system, Plus Jakarta Sans |
| State | TanStack Query + Zustand |
| Validation | Zod (16 schemas) |
| Database | PostgreSQL (Supabase, `sales_agent` schema) |
| ORM | Prisma 6 |
| Queue | BullMQ + Upstash Redis (4 queues, `prefix: "sales-agent"`) |
| Email | Resend (AI composition, template engine, open/click tracking) |
| AI | DeepSeek API (4 endpoints: compose, score, summarize, generate-script) |
| Auth | Custom JWT (jose) + bcryptjs + httpOnly cookies + email verification |
| Worker | Railway (standalone Node.js process) |
| Hosting | Vercel (web) + Railway (worker) |
| Testing | Vitest + Playwright (3 layers: unit, integration, E2E) |
| Monorepo | pnpm workspaces + Turborepo |

---

# Monorepo Structure

```
apps/
  web/         — Next.js 14 (App Router, RSC, React 18), 35 API routes
  worker/      — BullMQ Worker (AI response + campaigns + email + scoring)
packages/
  db/          — Prisma 6 schema + client (10 models, sales_agent schema)
  core/        — (reserved)
  ui/          — (reserved)
```

---

# Multi-Tenant SaaS

Every organization has isolated data, AI agent configurations, and campaign history.

- **4 roles**: Owner, Admin, Operator, Viewer
- **10 permissions**: Granular control over agents, leads, campaigns, members, audit log
- **Org switching**: Multi-org users can switch workspaces from sidebar
- **Scoped everything**: All queries, AI context, campaign audiences are org-scoped

---

# Security

- JWT auth (HS256, httpOnly Secure SameSite=Lax cookies)
- bcryptjs password hashing (10 rounds, min 8 characters)
- Email verification required for registration
- Upstash Redis rate limiting (100 req/min per IP)
- CSP, HSTS, X-Frame-Options, X-Content-Type-Options headers
- Zod input validation on all mutation endpoints
- JWT revocation via Redis blacklist
- PII hashing in logs (SHA256)
- Timing-safe webhook comparison
- Organization enumeration prevention

---

# AI Features

AI is embedded as an operational layer, not a chatbot wrapper:

- **Response composition** — AI drafts personalized replies using agent personality + product knowledge
- **Lead scoring** — 5-dimension scoring (intent, budget, authority, need, timeline)
- **Conversation summarization** — Extracts key points, action items, objections from threads
- **Script generation** — Natural language → complete sales playbook with email sequences

All AI features are feature-flagged and can be toggled independently.

---

# Getting Started

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL (Supabase)
- Upstash Redis

## Install

```bash
pnpm install
```

## Environment

```bash
# packages/db/.env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# apps/web/.env.local
JWT_SECRET="64-char-random-string"
DEEPSEEK_API_KEY="sk-..."
REDIS_URL="redis://..."
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# apps/worker/.env
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
DEEPSEEK_API_KEY="sk-..."
RESEND_API_KEY="re_..."
EMAIL_FROM="agent@yourdomain.com"
```

## Develop

```bash
pnpm dev                    # Start web app + worker
pnpm --filter @salesagent/db push     # Push schema to DB
pnpm seed                   # Reset + seed demo data
pnpm seed-prod <org-slug>   # Idempotent seed (3 scripts + 5 leads)
```

## Deploy

```bash
# Web
npx vercel --prod --cwd apps/web

# Worker (auto-deploys on git push to main via Railway)
```

---

# Demo

```bash
pnpm seed-demo
```

Creates **Acme Corp** with:
- 15 leads across 6 pipeline stages
- 3 AI SDR agents (Inbound Qualifier, Outbound SDR, Enterprise Closer)
- 10 conversations with AI-generated replies
- 2 active campaigns with analytics
- Dashboard fully populated

Login: `demo@acmecorp.com` / `demo123456`

---

# From OpsFlow to SalesAgent

This project was migrated from [OpsFlow AI](https://github.com/gloria238/opsflow-ai), a multi-tenant AI workflow CRM. The infrastructure (auth, multi-tenant, queue, email, deployment, security) was carried over. The domain model was replaced:

| OpsFlow | SalesAgent |
|---------|------------|
| Workflow Builder canvas | Conversation Inbox |
| DAG execution engine | AI response pipeline |
| Workflow templates | Sales playbook scripts |
| Lead management (basic) | Lead qualification + scoring |
| 7 AI endpoints | 4 SDR-focused AI endpoints |
| `opsflow` schema | `sales_agent` schema |
| `workflow-runs` queue | 4 queues with `sales-agent` prefix |

---

# Author

**Gloria Han**

Focus: AI SDR Systems, SaaS Architecture, Outbound Automation, Async Processing, Full-Stack Product Engineering
