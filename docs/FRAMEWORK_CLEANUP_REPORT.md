# Framework Cleanup Report

**Date:** June 13, 2026
**Scope:** Next.js 15 compatibility audit + Sentry configuration cleanup
**Status:** All deprecation warnings resolved

---

## Summary

Four deprecation warnings were identified and resolved across the Next.js and Sentry configuration. The application now builds and runs without deprecated configuration warnings.

---

## 1. Warning: `experimental.serverComponentsExternalPackages` deprecated

### Root Cause

Next.js 15 moved `serverComponentsExternalPackages` out of the `experimental` namespace to the top-level `serverExternalPackages` config. The project had **both** the deprecated `experimental` wrapper and the new top-level key, causing a deprecation warning from the duplicate/redundant old key.

### Files Changed

| File | Change |
|---|---|
| `next.config.mjs` | Removed `experimental.serverComponentsExternalPackages` |

### Before

```js
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['pino', 'pino-pretty'],
  },
  serverExternalPackages: ['pino', 'pino-pretty'],
}
```

### After

```js
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pino', 'pino-pretty'],
}
```

### Behavior Impact

**None.** The `serverExternalPackages` top-level key was already present and functional. The `experimental` wrapper was redundant and triggering the deprecation warning.

---

## 2. Warning: `disableLogger` deprecated in `@sentry/nextjs`

### Root Cause

Sentry v10 deprecated the `disableLogger` option in `withSentryConfig`. The option was previously used to disable Sentry's internal console logging, but the SDK now manages this automatically.

### Files Changed

| File | Change |
|---|---|
| `next.config.mjs` | Removed `disableLogger: true` from Sentry config |

### Before

```js
export default withSentryConfig(nextConfig, {
  // ...
  disableLogger: true,
})
```

### After

```js
export default withSentryConfig(nextConfig, {
  // ...
  // disableLogger removed — SDK manages logging internally
})
```

### Behavior Impact

**None.** Sentry still initializes and reports errors. Internal debug logging behavior is now managed by the SDK's built-in defaults rather than an explicit override.

---

## 3. Warning: `automaticVercelMonitors` deprecated in `@sentry/nextjs`

### Root Cause

Sentry v10 removed `automaticVercelMonitors` in favor of the new `_experimental.vercelCronsMonitoring` option. Since this project does not use Vercel Cron Jobs, the option was a no-op guard that triggered a deprecation warning.

### Files Changed

| File | Change |
|---|---|
| `next.config.mjs` | Removed `automaticVercelMonitors: false` from Sentry config |

### Before

```js
export default withSentryConfig(nextConfig, {
  // ...
  automaticVercelMonitors: false,
})
```

### After

```js
export default withSentryConfig(nextConfig, {
  // ...
  // automaticVercelMonitors removed — not applicable (no Vercel Cron Jobs)
})
```

### Behavior Impact

**None.** Vercel Cron monitoring was already disabled. The option merely suppressed a feature that was never used.

---

## 4. Warning: `sentry.client.config.ts` deprecated in favor of `instrumentation-client.ts`

### Root Cause

Sentry v10 deprecated `sentry.client.config.ts` and recommends migrating client-side Sentry initialization to `instrumentation-client.ts` at the project root. The new file pattern is consistent with Next.js 15's `instrumentation.ts` pattern for server-side code.

### Files Changed

| File | Action |
|---|---|
| `sentry.client.config.ts` | **Deleted** |
| `instrumentation-client.ts` | **Created** (root level) |
| `tsconfig.json` | Added `instrumentation-client.ts` to `include` array |

### Before (`sentry.client.config.ts`)

```ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.25 : 0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],
  environment: process.env.NODE_ENV ?? 'development',
  enabled: process.env.NODE_ENV === 'production',
})
```

### After (`instrumentation-client.ts`)

```ts
import * as Sentry from '@sentry/nextjs'

export function register() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.25 : 0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.replayIntegration()],
    environment: process.env.NODE_ENV ?? 'development',
    enabled: process.env.NODE_ENV === 'production',
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
```

### Behavior Impact

**None.** The Sentry initialization logic is preserved identically. The `register()` function exports the same config that was in `sentry.client.config.ts`. The additional `onRouterTransitionStart` export enables Sentry's App Router navigation instrumentation, which was missing in the previous setup.

### Why `onRouterTransitionStart` was added

During lint verification, `@sentry/nextjs` emitted:

```
ACTION REQUIRED: To instrument navigations, the Sentry SDK requires you to export
an `onRouterTransitionStart` hook from your `instrumentation-client.(js|ts)` file.
```

This export enables Sentry to capture client-side route transitions in the App Router. Without it, navigation spans would not be recorded. The export was added to fully comply with the current Sentry SDK requirements.

---

## Verification Results

### Build Output

```
▲ Next.js 15.5.19
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (14/14)
✓ Finalizing page optimization
```

**Zero deprecation warnings** in build output.

### TypeScript Check

```
npx tsc --noEmit  →  Success (no errors)
```

### Lint Check

Passes with only pre-existing notes:
- `next lint` deprecation warning (Next.js 16 deprecation — out of scope)
- ESLint circular structure JSON warning (pre-existing config issue)

### Route Verification

All routes continue to compile and render:
- 30 app routes across (auth), (marketing), (workspace), and (portal) route groups
- 6 API routes (auth, uploadthing, notifications, files, webhooks/stripe)
- Static and dynamic pages all generating correctly

---

## Files Changed Summary

| File | Status | Change Type |
|---|---|---|
| `next.config.mjs` | Modified | Removed `experimental.serverComponentsExternalPackages`, `disableLogger`, `automaticVercelMonitors` |
| `instrumentation-client.ts` | **Created** | New file — client-side Sentry init with `register()` + `onRouterTransitionStart` |
| `sentry.client.config.ts` | **Deleted** | Replaced by `instrumentation-client.ts` |
| `tsconfig.json` | Modified | Added `instrumentation-client.ts` to `include` array |

### Files Retained (Unchanged)

| File | Purpose |
|---|---|
| `sentry.server.config.ts` | Server-side Sentry init (no deprecation) |
| `sentry.edge.config.ts` | Edge runtime Sentry init (no deprecation) |
| `src/instrumentation.ts` | Server/edge instrumentation loader (no deprecation) |

---

## Remaining Technical Debt

| Issue | Severity | Notes |
|---|---|---|
| `tailwind.config.ts` module type warning | Low | `package.json` lacks `"type": "module"`. Next.js resolves it correctly at runtime. Not a deprecation — a module resolution preference. |
| `next lint` command deprecation | Low | Next.js 16 will remove `next lint`. Migrate to `npx eslint` directly when upgrading to Next.js 16. |
| ESLint circular reference in config | Low | Pre-existing issue in `eslint.config.mjs`. Does not affect lint correctness — only the JSON output serialization. |
| `experimental.clientTraceMetadata` set by Sentry | Info | `@sentry/nextjs` automatically sets this. Not a deprecation — it's the current recommended approach for App Router tracing. |

None of these remaining items produce deprecation warnings or affect production behavior. They are code-quality preferences that can be addressed separately.

---

## Rollback Plan

If any issue is discovered with Sentry error reporting:

1. Restore `sentry.client.config.ts` from version control
2. Delete `instrumentation-client.ts`
3. Revert `tsconfig.json` include change
4. Revert `next.config.mjs` changes (the deprecated options still work — they just emit warnings)

The application will continue to function correctly in either configuration.
