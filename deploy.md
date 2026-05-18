# Vercel Deployment Debugging Guide

Lessons from troubleshooting Vercel deploy failures and UI bugs in this project.

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

## Summary checklist

- [ ] After changing dependencies: run `pnpm install`, commit lockfile
- [ ] Before removing a dependency: grep for imports
- [ ] No two `page.tsx` files at the same route (route groups don't change paths)
- [ ] Every directory route needs a `page.tsx`
- [ ] Middleware auth rewrites use `NextResponse.rewrite()`, not `redirect()`
- [ ] Every custom color in className must be in `tailwind.config.js` colors
- [ ] CSS color variables must be RGB triplets for Tailwind opacity support
- [ ] All UI components must use design tokens, never hardcoded colors
- [ ] Verify build locally: `pnpm --filter @opsflow/web build`
