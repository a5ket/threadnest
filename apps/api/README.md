# ThreadNest API

NestJS 11 API for ThreadNest. See the [repo-level README](../../README.md) for the overall architecture, domain model, and how this fits with `apps/web`.

## Stack

- NestJS 11 on Fastify
- Prisma 7 with driver adapters (`@prisma/adapter-pg`) — schema is split across `prisma/schema/*.prisma`
- PostgreSQL, Redis (cache, BullMQ queues, rate limiting, event bus)
- Socket.IO (`src/realtime/`) for live notification/chat push
- Stripe for nest subscriptions (Connect for creator payouts)
- S3-compatible object storage (MinIO locally) for avatars, nest icons, thread/comment attachments

## Setup

```bash
cp .env.example .env   # see that file for every required variable
pnpm install
pnpm exec prisma migrate dev
pnpm start:dev          # http://localhost:3001
```

Swagger UI is served at `/docs` once the server is running.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm start:dev` | API with hot reload |
| `pnpm build` | Compile to `dist/` |
| `pnpm test` / `test:watch` / `test:cov` | Jest unit tests |
| `pnpm lint` | ESLint with autofix |
| `pnpm seed` | Small hand-authored fixture data for local dev |
| `pnpm demo-seed -- --users 300 --nests 30` | Bulk randomized demo data, every user gets guaranteed activity |
| `pnpm admin:grant <email> <ADMIN\|MODERATOR>` | Grant a platform role by email |

The seed/demo-seed/admin:grant scripts are `nest-commander` CLI commands (`src/*/​*.command.ts`), registered in the same `AppModule` as the HTTP server and invoked via `src/cli.ts` instead of `src/main.ts`. Because of that, anything in these commands that depends on the app actually being an HTTP server (notably `RealtimeGateway.server`, the Socket.IO instance) won't be attached — `RealtimeGateway.emitToRoom()` guards against this so a CLI run doesn't crash on every domain event it happens to trigger.

## Code layout

Each domain module (`nest`, `thread`, `comment`, `chat`, `platform`, ...) generally follows:

```
foo.controller.ts        HTTP layer
foo.service.ts           orchestration
foo.policy.ts            assertCanX(...) authorization checks — unit tested
foo.access.ts            (some modules) full permission context for a viewer
foo.repository.ts        abstract repository
foo.prisma.repository.ts concrete Prisma implementation
foo.cached.repository.ts cache-decorator wrapping the Prisma implementation, for hot read paths
foo.presenter.ts         internal shape -> response DTO
dto/                     request/response DTOs (class-validator + swagger decorators)
exceptions/              domain-specific exceptions, mapped to HTTP status via the DTOs' @ApiExceptionResponses
```

Cross-module side effects (notifications, action log entries, realtime push) go through `src/event/` — a Redis Streams event bus. A service publishes a typed event (`void this.eventBus.publish(new XEvent({...}))`, fire-and-forget); independent `EventSubscriber` subclasses react to it, each declaring its own `groupName` so multiple subscribers can consume the same event stream without competing for messages.

## Testing conventions

Specs use hand-built mocks and construct the class under test directly (`new FooService(mockRepo, mockPolicy, ...)`) rather than `Test.createTestingModule` — see any existing `*.spec.ts` or `test/factories/` for the pattern before adding a new one. Every `*.policy.ts` file has a spec; that's the convention to keep up for new policies.
