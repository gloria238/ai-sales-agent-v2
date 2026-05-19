# Deployment Guide — SalesAgent AI

> Lessons from Vercel + Railway + Supabase + Upstash deployment debugging.
> Updated: 2026-05-19 (post OpsFlow → SalesAgent migration)

---

## Recent Deploy Issues (SalesAgent AI)

### Error D1: pnpm frozen-lockfile fails — @opsflow packages missing

```
ERR_PNPM_OUTDATED_LOCKFILE
specifiers in the lockfile don't match specifiers in package.json
```

**Cause**: After renaming packages from `@opsflow/*` → `@salesagent/*`, the `pnpm-lock.yaml` on the remote (GitHub) still referenced `@opsflow/db`, `@opsflow/worker`, `@opsflow/web`. Vercel clones the repo and runs `pnpm install --frozen-lockfile` which requires exact lockfile match.

**Fix**: Delete `pnpm-lock.yaml`, run `pnpm install` locally to regenerate with `@salesagent/*` references, commit and push the new lockfile.

**Prevention**: After any package rename, always regenerate and commit the lockfile before deploying.

### Error D2: $transaction incompatible with pgBouncer → 500 on POST/PATCH

```
P2028: Transaction API error: Transaction not found.
Transaction already closed: timeout was 5000ms, however 5939ms passed.
```

**Cause**: Supabase connection pooler (pgBouncer) does not support interactive Prisma `$transaction()` calls. This is a well-known Prisma + Supabase limitation.

**Affected routes**: `leads/route.ts` (POST), `leads/[id]/route.ts` (PATCH + DELETE), `register/route.ts`

**Fix**: Replace all `prisma.$transaction(async (tx) => { ... })` with sequential `prisma.xxx()` calls. For registration, add try/catch rollback to delete orphaned user if org creation fails.

```ts
// BEFORE (broken on pgBouncer)
const lead = await prisma.$transaction(async (tx) => {
  const l = await tx.lead.create({ data: ... });
  await tx.leadActivity.create({ data: ... });
  return l;
});

// AFTER (sequential, pgBouncer-safe)
const l = await prisma.lead.create({ data: ... });
await prisma.leadActivity.create({ data: ... });
const lead = l;
```

### Error D3: JSX build errors on Vercel (not caught by `pnpm dev`)

**Errors encountered**:
- Stray `</Link>` closing tag in `leads/[id]/page.tsx` — caused "Unexpected token div" webpack error
- Missing outer `</div>` wrapper — same symptom
- `DialogHeader`/`DialogTitle` not exported from custom `@/components/ui/dialog`
- `Badge variant="outline"` — Badge only supports `default | success | warning | danger`

**Cause**: `pnpm dev` (Next.js dev mode) is more lenient with JSX/type errors. Vercel runs `next build` which is strict.

**Fix**: Always run `npx next build` locally before pushing. `pnpm dev` is NOT a valid build test.

### Error D4: Upstash Redis max requests limit

```
ERR max requests limit exceeded. Limit: 500000, Usage: 500000.
```

**Cause**: Upstash Redis free tier has a 500K command limit per day. Running 4 BullMQ workers + heavy integration tests exhausts this quickly.

**Fix**: 
- Kill the worker during integration tests if Redis is not needed
- Or upgrade Upstash plan
- The workers DID start correctly with `prefix: "sales-agent"` isolation — the limit hit confirms isolation is working

### Error D5: Cross-project Redis queue collision (prevention)

**Risk**: Running OpsFlow and SalesAgent on the same Upstash Redis instance without queue prefix isolation.

**Fix applied**: All BullMQ Queue and Worker instances use `prefix: "sales-agent"`:

```ts
const Q_PREFIX = "sales-agent";
new Queue("conversation-jobs", { connection, prefix: Q_PREFIX });
new Worker("conversation-jobs", processor, { connection, prefix: Q_PREFIX });
```

Redis keys: `sales-agent:conversation-jobs:...` vs OpsFlow's `bull:workflow-runs:...` — fully isolated.

---

## Legacy OpsFlow Issues (still relevant)

## Error 1: Outdated lockfile

```
ERR_PNPM_OUTDATED_LOCKFILE — Cannot install with "frozen-lockfile"
specifiers in the lockfile don't match specifiers in package.json:
* 1 dependencies were removed: zod@^4.4.3
```

**Cause**: A dependency was removed from `package.json` but `pnpm-lock.yaml` was not regenerated. Vercel runs `pnpm install --frozen-lockfile` which requires exact lockfile match.

**Fix**: Run `pnpm install --no-frozen-lockfile` locally, commit updated `pnpm-lock.yaml`.

**Prevention**: After any change to `dependencies` or `devDependencies` in `package.json`, always run `pnpm install` and commit the lockfile.

## Error 2: Missing dependency after lockfile fix

```
Module not found: Can't resolve 'zod'
./lib/validation.ts
```

**Cause**: `zod` was removed from `package.json` but `lib/validation.ts` still imported it for 16 Zod validation schemas used across 30+ API routes. The lockfile fix (Error 1) only revealed this deeper issue.

**Fix**: Restored `"zod": "^4.4.3"` to `package.json`, regenerated lockfile.

**Prevention**: Before removing a dependency, grep the codebase for imports of that package. Never remove a dependency that is still in use.

## Error 3: Missing client-reference-manifest in route group

```
Error: ENOENT: no such file or directory,
lstat '/vercel/path0/apps/web/.next/server/app/(dashboard)/page_client-reference-manifest.js'
```

**Cause**: `app/page.tsx` (public landing) and `app/(dashboard)/page.tsx` (dashboard home) both mapped to `/`. Next.js compiled both but only served the root page — the dashboard page was shadowed. Its `.nft.json` referenced `page_client-reference-manifest.js` which was never generated.

**Fix**: Moved dashboard to `app/(dashboard)/home/page.tsx` (route `/home`), added middleware rewrite `/` → `/home` for authenticated users. Landing page stays at `/` for unauthenticated visitors.

**Prevention**: Never have two `page.tsx` files mapping to the same route. Route groups like `(dashboard)` do NOT add path segments.

## Error 4: Middleware rewrite vs redirect

After Error 3, the first fix used `NextResponse.redirect("/workflows")` for authenticated users at `/`. This broke the dashboard entirely — users were sent to the workflows page instead of seeing the dashboard home.

**Correct fix**: Use `NextResponse.rewrite()` instead. Rewrite keeps the browser URL at `/` while internally serving `/home`. Redirect changes the URL and prevents the dashboard from being accessible at the root path.

```ts
// Correct: internal rewrite, URL stays /
const url = request.nextUrl.clone();
url.pathname = "/home";
return NextResponse.rewrite(url);

// Wrong: changes URL to /workflows
return NextResponse.redirect(new URL("/workflows", request.url));
```

## Error 5: Missing page.tsx causes 404 (silent)

`/settings/api-keys` returned 404. The directory existed with `api-keys-client.tsx` but **no `page.tsx`**. Next.js requires a `page.tsx` (or `page.js`) at every route.

**Fix**: Created `(dashboard)/settings/api-keys/page.tsx` as a server component that fetches session/role data and passes it to the client component.

## Error 6: Tailwind custom colors not registered — invisible UI

This was the most severe UI bug. Every component using design-token classes (`bg-accent`, `text-text`, `bg-bg-card`, `border-border`, etc.) had **no CSS generated** because these color names were not registered in `tailwind.config.js`.

**Symptoms**:
- Buttons with white text on no background (appeared white-on-white)
- Dropdown menus with transparent backgrounds
- Text with no visible color
- Form inputs with no borders or backgrounds
- The entire glass design system silently broken

**Root cause**: `tailwind.config.js` only defined `surface` color. Every `bg-accent`, `text-text`, `border-border` class was silently dropped by Tailwind's JIT compiler — no warning, no error, just no CSS.

**Fix** (two parts):

1. Register all custom colors in `tailwind.config.js`:
```js
colors: {
  accent: { DEFAULT: "rgb(var(--accent) / <alpha-value>)", hover: "...", soft: "..." },
  bg: { DEFAULT: "rgb(var(--bg) / <alpha-value>)", card: "...", subtle: "...", muted: "..." },
  text: { DEFAULT: "rgb(var(--text) / <alpha-value>)", secondary: "...", muted: "..." },
  // ... all other design tokens
}
```

2. Convert CSS variables from hex to RGB triplets so Tailwind's opacity modifiers work:
```css
/* Before: opacity modifiers don't work */
--accent: #2563eb;

/* After: rgb(var(--accent) / 0.5) is valid CSS */
--accent: 37 99 235;
```

And update all `var(--x)` references to `rgb(var(--x))` in CSS and inline styles.

**Prevention**: Every custom color used in Tailwind `className` must be registered in `tailwind.config.js → theme.extend.colors`. Use `grep -roh "bg-\w\+\|text-\w\+\|border-\w\+\|ring-\w+" apps/web --include="*.tsx" | sort -u` to audit.

## Error 7: Hardcoded colors bypass design system

Even after registering custom colors, some components used hardcoded Tailwind colors (`zinc-200`, `gray-100`) instead of design tokens (`border`, `bg-subtle`). This caused inconsistent appearance and broke dark mode.

**Affected components**: Export CSV link, Select, Textarea, Table, Badge, Card, Dialog, DropdownMenu — all used hardcoded zinc/gray colors.

**Fix**: Replaced all hardcoded colors with design tokens across 11 UI components.

## Pre-Deploy Checklist

```bash
# 1. Build test — catches JSX/type errors dev mode misses
pnpm --filter @salesagent/web build

# 2. Lockfile must match package.json
pnpm install --frozen-lockfile  # fails = lockfile needs update

# 3. No hardcoded @opsflow references
grep -r "@opsflow" apps/ packages/ --include="*.ts" --include="*.tsx" --include="*.json"

# 4. Queue prefix isolation
grep "Q_PREFIX\|prefix:" apps/worker/src/queue.ts

# 5. All $transaction calls replaced (pgBouncer compat)
grep -r "\$transaction" apps/web/app/api --include="*.ts"

# 6. Unit tests pass
pnpm --filter @salesagent/web test

# 7. Build and push
git push origin main
```

## Production Env Vars

| Variable | Used by | Notes |
|----------|---------|-------|
| `DATABASE_URL` | Web, Worker, DB | Supabase pooled (pgBouncer, transaction mode) |
| `DIRECT_URL` | DB push/migrate | Supabase direct connection |
| `REDIS_URL` | Worker, Web | Upstash Redis (BullMQ + rate limiting) |
| `UPSTASH_REDIS_REST_URL` | Web | Upstash REST API for serverless rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Web | Upstash REST API token |
| `JWT_SECRET` | Web | 64-char random string, NO fallback |
| `DEEPSEEK_API_KEY` | Web, Worker | DeepSeek AI |
| `RESEND_API_KEY` | Worker | Resend email delivery |
| `EMAIL_FROM` | Worker | Sender address |

## Vercel Config

```
Build Command: pnpm --filter @salesagent/db generate && pnpm --filter @salesagent/web build
Output Directory: Next.js default
Install Command: pnpm install --frozen-lockfile
Root Directory: apps/web
```

## Railway Config (Worker)

```toml
[build]
builder = "nixpacks"
buildCommand = "pnpm install --frozen-lockfile && pnpm --filter @salesagent/db generate"

[deploy]
startCommand = "npx tsx apps/worker/src/index.ts"
healthcheckPath = "/"
```

Env vars needed: `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `DEEPSEEK_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`
