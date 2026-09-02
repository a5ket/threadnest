# ThreadNest Web

Next.js 16 (App Router) frontend for ThreadNest. See the [repo-level README](../../README.md) for the overall architecture and domain model.

## Stack

- Next.js App Router, React 19
- React Query for server data, Zustand for client state that needs to survive across a route (current user, thread detail, nest detail)
- react-hook-form + zod for forms — schemas are largely reused straight from the generated API client's request types
- Tailwind v4, design tokens defined in `src/app/globals.css`
- An [orval](https://orval.dev)-generated API client in `src/generated/` — never hand-edit those files

## Setup

```bash
cp .env.example .env.local
pnpm install
pnpm dev   # http://localhost:3000, expects the API on NEXT_PUBLIC_API_URL
```

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm lint` | ESLint |
| `pnpm generate:api` | Regenerate `src/generated/` from the API's OpenAPI spec — run this after any API DTO/route change |

There is no test runner configured yet.

## Code layout

```
src/app/            Route tree. (main) and (auth) are route groups for layout isolation;
                     a nest's own pages are further split into (gated) — content behind
                     canViewNest — and (manage) — owner/moderator tooling.
src/features/<name>/  One directory per domain feature: components, hooks (React Query),
                     .server.ts (server-side fetchers for RSC), .types.ts, .schemas.ts
src/common/          Shared components and utilities with no feature ownership
src/generated/       orval output — the typed API client and Zod schemas
```

## Conventions worth knowing before changing UI

- **Design tokens, not raw colors.** `globals.css` defines a three-tier elevation system: `--canvas` (header, sidebars, chrome), `--background` (the main content area — deliberately *lighter* than canvas, not darker), `--card` (individual cards/panels sitting on the content area). Reuse these before reaching for a new color, and check both the light (`:root`) and dark (`.dark`) blocks when adding one.
- **`--border` vs `--divider`.** Border is for layout/card edges; divider is for internal list-row separators (`divide-y divide-divider`) — they're intentionally different shades.
- **List rows are flat, not cards.** Thread lists, comment lists, etc. use `divide-y divide-divider` rows with a `hover:bg-muted/50` wash, not individually bordered/backed cards — that pattern was deliberately moved away from mid-project; don't reintroduce boxed list items.
- **No inline comments beyond a rare, genuinely non-obvious WHY.** This codebase has been kept intentionally comment-light — names and structure should carry the meaning.
