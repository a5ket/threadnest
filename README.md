# ThreadNest

A Reddit-style community platform, built end to end: nests (communities) contain threads (posts), threads contain nested comments, and nests can be public or private, free or paywalled behind a real Stripe subscription — with the money actually payable out to the nest owner via Stripe Connect.

It has per-nest configurable permission levels, a two-tier moderation system (nest-level and platform-level, independently), an event-driven notification/realtime pipeline and live chat over Socket.IO.

**Stack:** NestJS 11 · Next.js 16 (App Router) · Prisma 7 · PostgreSQL · Redis · Socket.IO · Stripe (Checkout + Connect) · S3-compatible storage · TypeScript throughout

## Features

### Communities (nests)

- **Visibility**: `PUBLIC` or `PRIVATE`, orthogonal to paywall status (see [Domain model](#domain-model-in-brief))
- **Join policy**: `OPEN` (join instantly), `BY_REQUEST` (owner/moderator approves or rejects), `BY_INVITE` (invite-only)
- **15 independently configurable permission thresholds per nest** — not a fixed role table. An owner sets a minimum level (non-member / member / moderator / owner) for each of: creating threads, creating comments, voting on threads, voting on comments, editing the nest, locking threads, pinning threads, pinning comments, moderating content, viewing the member list, managing invites, removing members, managing join requests, managing bans, and viewing the action log
- Invites (issue, accept/decline, revoke), join requests (approve/reject with a message), member role changes, ownership transfer, member bans (issue/revoke)
- Every moderation-relevant change is written to a per-nest action log — an audit trail moderators can review, separate from the platform-wide one below

### Content

- Threads: title + body, up to 4 image attachments, pin/lock (moderator-configurable level), edit, soft-delete
- Comments: threaded/nested replies, single image attachment, vote, edit, soft-delete
- Soft-deleted content stays visible to moderators for a grace period before disappearing for everyone — long enough to actually review a removal, not an instant black hole
- Save/bookmark threads for later
- Search across nests, threads, and users; per-nest sort by New or Top; a discover feed that falls back to platform-wide public content when a viewer is signed out or has no nests yet, so the app never shows an empty homepage

### Moderation — two independent tiers

- **Nest-level**: content reports (thread/comment) with reasons (spam, harassment, misinformation, rule violation, other) routed to a per-nest resolution queue, resolved by anyone meeting that nest's configured moderation level
- **Platform-level**: a *separate* reports queue and action log, its own report reasons (illegal content, ban evasion, spam network, harassment, impersonation, platform rule violation, other), and its own `ADMIN`/`MODERATOR` roles (granted via `PlatformRoleGrant`, not tied to any nest) — able to remove content or suspend a user regardless of that nest's local permission settings

### Monetization

- Per-nest Stripe subscription pricing, checked out via Stripe's Embedded Checkout (not a redirect), self-service subscription view/cancel
- Stripe Connect Express onboarding so a nest owner can receive real payouts
- A ledger recording every credit (subscription payment) and debit (withdrawal) against a nest's balance, with a withdrawal flow that creates a real Stripe transfer

### Real-time & notifications

- Socket.IO gateway authenticated over the connection handshake with the same JWT the REST API uses (no separate socket-auth mechanism to keep in sync)
- Chat: 1:1 or group conversations, typing indicators, read receipts, all pushed live
- 9 notification types — thread reply, comment reply, join request approved/rejected, nest invite received, banned from nest, ownership transferred, report resolved, content removed — surfaced both as a live push and in a persistent in-app notification center
- Cross-module side effects (a comment triggers a notification *and* a possible realtime push *and* an action-log entry) are handled by independent event subscribers reacting to one published event, not by the comment service knowing about notifications, sockets, or logging directly

### Accounts

- JWT access (15 min) + refresh (30 day) tokens, email verification, password reset
- Profile customization (avatar, display name, bio), a public activity feed, blocking other users
- Preferences at both the global level (e.g. activity visibility) and per-nest level (e.g. notification muting)

### Tooling

- A bulk demo-data seeder (`pnpm demo-seed`) that *guarantees* every generated user gets real activity — nest membership, at least one thread, at least one comment — computed deterministically rather than left to random sampling, so a 300-user run doesn't quietly leave dozens of accounts looking dead. See [Seeding data](#seeding-data-for-local-testing) below.

## Repository layout

This is **not** a pnpm/yarn workspace — `apps/api` and `apps/web` are two independent Node projects, each with its own `package.json` and lockfile. Run all commands from inside the relevant app directory.

```
apps/
  api/   NestJS 11 API — Fastify, Prisma 7 (driver adapters), PostgreSQL, Redis, Socket.IO, Stripe, S3-compatible storage
  web/   Next.js 16 (App Router) — React Query, Zustand, react-hook-form + zod, Tailwind v4
docker-compose.yml   MinIO (local S3-compatible storage) — Postgres and Redis are expected to run elsewhere
```

See [apps/api/README.md](apps/api/README.md) and [apps/web/README.md](apps/web/README.md) for per-app details.

## Prerequisites

- Node.js, pnpm
- A PostgreSQL database (developed against [Neon](https://neon.tech); any Postgres works)
- Redis (caching, BullMQ queues, rate limiting, and the event bus all use it)
- Docker, for the bundled MinIO container (or point `STORAGE_*` env vars at real S3)

## First-time setup

```bash
# 1. Object storage
docker compose up -d minio

# 2. API
cd apps/api
cp .env.example .env   # fill in DATABASE_URL, JWT secrets, Stripe keys, etc.
pnpm install
pnpm exec prisma migrate dev
pnpm start:dev          # http://localhost:3001, Swagger at /docs

# 3. Web (separate terminal)
cd apps/web
cp .env.example .env.local
pnpm install
pnpm dev                # http://localhost:3000
```

The web app talks to the API through a generated client (orval, from the API's OpenAPI spec) — run `pnpm generate:api` in `apps/web` after changing any API DTO or route.

## Seeding data for local testing

Two separate commands, both in `apps/api`:

- `pnpm seed` — a small, hand-authored fixture set (a handful of users and nests covering public/private/paywalled combinations). Meant for day-to-day dev testing.
- `pnpm demo-seed -- --users 300 --nests 30` — bulk randomized data for demos. Every user is guaranteed at least one nest membership, one thread, and one comment — deliberately not left to random sampling, so a large run doesn't end up with a long tail of silent, activity-less accounts. See `pnpm exec nest build && node dist/src/cli.js demo-seed --help` for all flags (including `--with-images` for generated avatars/attachments). This writes real data through the actual service layer, not raw SQL, so it's slow-ish at scale (a few minutes for 300 users) but exercises the same code paths real usage does.

Both are idempotent by email/slug — safe to re-run.

## Domain model, in brief

- **Nest** — a community. `visibility` (`PUBLIC`/`PRIVATE`) and paywall status are independent axes. See `NestAccess.getContext` (`apps/api/src/nest/nest.access.ts`) for the exact rules — it's the single source of truth for `canViewNest` (can see content) vs `canViewNestMetadata` (can see name/description/icon, used to let a public paywalled nest advertise itself without leaking content).
- **Roles** — `MEMBER` / `MODERATOR` / `OWNER`, each with a numeric level (10/20/30; non-members are 0). Every permission in a nest is a per-nest-configurable minimum level, not a hardcoded role check.
- **Platform roles** — `ADMIN` / `MODERATOR`, separate from nest roles, granted via `PlatformRoleGrant`. A second, site-wide authority axis that bypasses nest-level moderation entirely.
- **Moderation grace period** — deleted content stays visible to moderators for a window after deletion before disappearing for everyone, to support review.

## Architecture patterns

**API** — one module per domain (`nest`, `thread`, `comment`, `chat`, ...), each typically split into:
- `*.controller.ts` — HTTP layer only
- `*.service.ts` — orchestration
- `*.policy.ts` — authorization checks (`assertCanX`), one per module, all unit-tested
- `*.access.ts` (where present) — computes a full permission context object for a viewer
- `*.repository.ts` (+ `.prisma.repository.ts` / `.cached.repository.ts`) — data access, with a cache-decorator layer over the Prisma implementation for hot paths
- `*.presenter.ts` — maps internal shapes to response DTOs

Side effects that cross module boundaries (notifications, action log entries, realtime pushes) go through a Redis Streams-backed event bus (`src/event/`) — services publish a typed event, and independent `EventSubscriber` classes react to it, each with their own consumer group (`groupName`) so, e.g., the notification subscriber and the realtime-push subscriber both see every event without competing for it.

**Web** — App Router with route groups for layout isolation (`(main)`, `(auth)`, the un-grouped checkout flow), Zustand for small pieces of client state that need to survive across a route boundary (thread detail, nest detail, current user), React Query for server data, and a design-token system in `apps/web/src/app/globals.css` (`--canvas` for chrome/header/sidebar, `--background` for content areas, `--card` for individual cards).

## A few implementation notes worth calling out

- **Prisma 7's driver-adapter architecture changed how unique-constraint errors surface** (`error.meta.target` is no longer populated; the real data moved under `error.meta.driverAdapterError.cause.constraint.fields`). `PrismaService.isUniqueConstraintError` handles both shapes — found by reading the actual error object during a live webhook test, not by guessing.
- **The realtime notification pipeline is resilient to running outside an HTTP context.** CLI tools (the seed commands) boot the same `AppModule` the API does, including the Socket.IO gateway — but no HTTP server ever starts, so the gateway's `Server` instance is never attached. `RealtimeGateway.emitToRoom()` centralizes that guard once, so no individual event subscriber can forget it.
- **Access control distinguishes "can view content" from "can view metadata."** A naive `isPrivate ? memberOnly : everyone` check would either leak a paywalled-public nest's existence entirely or block it from advertising itself to potential subscribers — `canViewNest` and `canViewNestMetadata` are computed and checked separately for exactly this reason.

## Tests

`apps/api` has Jest unit tests (hand-built mocks, no `Test.createTestingModule` — see any `*.spec.ts` for the pattern) — run with `pnpm test` inside `apps/api`. Every authorization `*.policy.ts` has a spec; that's a convention worth keeping for new ones. `apps/web` currently has no test runner configured — a real gap, not an oversight to hide.
