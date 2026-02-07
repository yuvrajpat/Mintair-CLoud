# Mintair Cloud

Mintair Cloud is a full-stack cloud infrastructure and GPU marketplace platform with a Next.js frontend, Node.js backend, PostgreSQL database, Prisma ORM, and session-based authentication.

## Stack

- Frontend: Next.js (App Router), TypeScript, Tailwind CSS, React Query
- Backend: Node.js, Express, TypeScript, REST API, service-layer architecture
- Database: PostgreSQL + Prisma
- Auth: Email/password + session cookies + email verification + password reset
  - Optional Google OAuth login

## Repository Structure

- `/frontend` Next.js app and UI
- `/backend` Express API and business logic
- `/database` Prisma schema, migrations, and seed scripts
- `/shared` shared schemas/types
- `/config` shared configuration (base TypeScript config)
- `/scripts` utility scripts

## Features Included

- Authentication
  - Sign up, login, logout
  - Email verification token flow
  - Forgot/reset password flow
  - Session persistence via HTTP-only cookies
- Onboarding
  - Welcome, user type, use case, region preference
  - State persisted in database
- Dashboard
  - Active instances, GPU hours, monthly spend, referral earnings
  - Usage/spend charts and quick actions
- Marketplace
  - Browse GPU offers with filters/sorting
  - Detail page with estimate + deployment flow
- Instance lifecycle
  - Deploy, provisioning simulation, success/failure states
  - Start, stop, restart, terminate actions
  - Detail tabs: Overview, Metrics, SSH, Logs, Settings
- SSH keys
  - Add, rename, delete
  - Public key format validation + fingerprinting
- Billing and usage
  - Current balance, invoices, payment methods (mock processing)
  - Usage grouped by instance/GPU/region
- Credits wallet
  - Top-right credit balance bar with quick add-credits dropdown
  - CopperX checkout session redirect for top-ups
  - Webhook-confirmed balance crediting + ledger records
- Referrals
  - Unique referral code and referral link
  - Signup tracking + reward on first deployment
- Quotations
  - Submit quote requests
  - Status tracking: Pending, Approved, Rejected
- Documentation
  - Searchable docs pages with markdown rendering
  - Copy buttons for code blocks
- Settings
  - Profile, security, notifications
  - API keys: generate, copy once, revoke

## Prerequisites

- Node.js `>=20.11.0`
- npm `>=10`
- PostgreSQL running locally

## Local Setup

1. Create environment file:

```bash
cp .env.example .env
```

2. Update `DATABASE_URL` in `.env` to your PostgreSQL instance.

3. Install dependencies:

```bash
npm install
```

4. Generate Prisma client:

```bash
npm run db:generate
```

5. Run database migrations:

```bash
npm run db:migrate -- --name init
```

6. Seed data:

```bash
npm run db:seed
```

7. Start backend + frontend:

```bash
npm run dev
```

## Default Local URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Health check: `http://localhost:4000/api/health`

## Demo Accounts (Seed)

- `alice@mintair.dev` / `Mintair123!`
- `bob@mintair.dev` / `Mintair123!`

## Environment Variables

See `.env.example` for full list. Key values:

- `DATABASE_URL`
- `PORT`
- `NEXT_PUBLIC_API_BASE_URL`
- `APP_BASE_URL`
- `SESSION_COOKIE_NAME`
- `SESSION_TTL_HOURS`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `COPPERX_API_KEY`
- `COPPERX_WEBHOOK_SECRET`
- `COPPERX_API_BASE_URL`
- `COPPERX_CHECKOUT_SUCCESS_URL`
- `COPPERX_CHECKOUT_CANCEL_URL`
- `REFERRAL_REWARD_USD`
- `DEFAULT_CREDIT_USD`

## Useful Commands

```bash
npm run dev
npm run build
npm run typecheck
npm run db:generate
npm run db:migrate -- --name <migration_name>
npm run db:seed
```

## Notes

- Payment method processing is intentionally mocked for local development.
- Credit top-ups are processed via CopperX checkout and confirmed by webhook at `POST /api/billing/webhooks/copperx`.
- Email verification/reset use preview tokens in development mode (`DEV_EMAIL_PREVIEW=true`).
- Provisioning is simulated with timed state transitions and deterministic failure scenarios.
