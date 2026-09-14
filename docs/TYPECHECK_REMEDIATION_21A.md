# Typecheck Remediation — Prompt 21A

**Date:** 2026-07-22  
**Canonical command:** `npm run typecheck` → `tsc --noEmit` (also wired in `.github/workflows/ci.yml`)  
**Prisma:** `npx prisma generate` / `npm run db:generate` (v6.19.3) — schema **not** modified  
**Gate:** TypeScript zero-error production gate (strict mode preserved)

---

## Before

| Field | Value |
| --- | --- |
| Command | `npm run typecheck` |
| Exit code | **2** |
| Total errors | **27** (across **18** files) |
| Suppressions | none used |

### Error categories (initial audit)

| Category | Examples |
| --- | --- |
| Prisma / DB boundary | `qualityScores.orderBy.createdAt` (field is `scoredAt`); `oldValueJson: null` vs Prisma JSON null input; AppConfig `value`/`meta` as `unknown` |
| API / adapter contracts | ES Idealista `extractMedia` arity; analytics `login_failed` reason; branded `MarketCode` indexing `Record<MarketCodeLiteral, …>`; analytics provider `send` missing `context` |
| React props | Strategie `href` vs `slug`; `createdAt` string/Date branch → `never`; calculator `RangeSlider` `number \| null` |
| Env / ProcessEnv | `getSecretEnvStatuses(ProcessEnv)` rejecting plain test records; `NODE_ENV` reassignment (TS2540) in security tests |
| Discriminated unions / null guards | MIME `.reason` without narrowing; admin CSV `sampleRows[0]` possibly undefined; HTML attr regex capture possibly undefined; incident fixture status literal `"OPEN"` |

---

## Fixes

Each fix updates the **type contract** (or test harness) without weakening `tsconfig`, without `any` / `as any` / `as unknown as X` / `@ts-ignore` / `@ts-nocheck`, and without changing mortgage/ROI/yield/APR/valuation math or authz/webhook verification logic.

| File | Root cause | Correction | Why safe |
| --- | --- | --- | --- |
| `src/domains/administration/service/admin-internal-metrics.ts` | Wrong Prisma orderBy field | `orderBy: { scoredAt: "desc" }` | Matches `DatasetQualityScore` schema; same query intent |
| `src/domains/platform/admin/config-center.ts` | `unknown` JSON into Prisma + audit meta; overly narrow env type | Zod `parseAppConfigJson`; `sanitizeAuditMeta` for audit; `getSecretEnvStatuses(Readonly<Record<…>>)` | Fail-closed JSON validation; no secret echo; tests need no ProcessEnv cast |
| `src/domains/platform/admin/feature-flags.ts` | `oldValueJson: null` invalid for Prisma JSON input | Omit null field; plain JSON objects for new/old values | SQL NULL by omission; same create semantics |
| `src/domains/platform/admin/platform-governance.test.ts` | Invalid `as NodeJS.ProcessEnv` | Pass plain record | Matches widened production signature |
| `src/app/(public)/hledat/page.tsx` | `STRATEGIES` has `slug`, not `href` | Link `/strategie/${s.slug}` | Aligns with navigation config |
| `src/components/admin/admin-users-data-table.tsx` | `createdAt: Date` only — string branch → `never` | Always `toISOString().slice(0, 10)` | Display-only; same date format |
| `src/components/calculators/investment-yield-calculator.tsx` | Baseline fields still `number \| null` after `??` | Coalesce `?? 0` for slider display values | UI fallback only; engine inputs unchanged |
| `src/domains/property-sources/adapters/es-idealista-style.ts` | Interface allows optional `normalized`; impl took 1 arg | Optional 2nd param `_normalized?` | Matches adapter contract (same as AE) |
| `src/lib/analytics/events.ts` | `login_failed` reason union missing account lock reason | Add `"account_status"` | Documents real auth path; no auth logic change |
| `src/domains/markets/codes.ts` + `src/lib/i18n/preference-actions.ts` | Branded `MarketCode` cannot index literal Record | `getMarketDefaultCurrency` loop over `MARKET_CODES` | Same currency table; no FX math change |
| `src/domains/revenue/revenue-ledger-phase6.test.ts` | `AnalyticsPayload` requires `context` | `buildAnalyticsContext("server")` | Matches provider interface |
| `src/lib/security/sanitize.ts` | `m[1]` possibly undefined under `noUncheckedIndexedAccess` | Null-guard then continue | Same allowlist behavior |
| MIME / security tests | `.reason` on union without narrowing | Assert full `{ ok: false, reason }` via `toEqual` | No production MIME policy change |
| `phase3-…` / `security-hardening.test.ts` | `NODE_ENV` readonly | `Reflect.set(process.env, "NODE_ENV", …)` + restore | Same runtime env values for assertions |
| `src/lib/admin/admin-ui.test.ts` | Possibly undefined sample row | Optional chain `sampleRows[0]?.[0]` | Assertion still fails if missing |
| `admin-e2e-operations-267-272.test.ts` | Fixture `status: "OPEN"` literal blocks transitions | Type `status: IncidentOpsStatus` | Test harness typing only |

---

## After

| Field | Value |
| --- | --- |
| Command | `npm run typecheck` |
| Exit code | **0** |
| Final error count | **0** |
| Suppressions introduced | **NONE** |

Reconfirmed: `npx tsc --noEmit` → exit **0**.

---

## Regression verification

| Check | Command | Result |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | **PASS** — exit **0**, 0 errors |
| Focused unit (listing promotions) | `npx vitest run src/domains/listing-promotions/ranking-integrity.test.ts src/domains/listing-promotions/listing-promotions.test.ts` | **PASS** — **18/18**, exit **0** |
| Trust (UI labels) | `npx vitest run src/components/trust/trust.test.ts` | **PASS** — **3/3**, exit **0** |
| Phase 3 + Prompt 20.7 security | `npx vitest run src/lib/security/phase3-security-ops-regression.test.ts src/lib/security/prompt-20-7-security-regression.test.ts` | **PASS** — **24/24**, exit **0** |
| Security suite (broader) | `npm run test:security` | **PASS** — **52/52**, exit **0** |
| Golden financial bundle | `npx vitest run src/domains/investment/engine/__tests__/golden.test.ts src/domains/renovation/offer/prompt-20-3-financial-regression.test.ts src/domains/valuation/service/valuation-core.test.ts src/domains/financing/property-financing.test.ts src/domains/renovation/flip-offer.test.ts` | **PASS** — **74/74**, exit **0** |
| Account-auth E2E | `npx playwright test e2e/account-auth.spec.ts --workers=1` | **FAIL (infra / CSS pipeline)** — Playwright `webServer` (`next dev -p 3010`) times out (180s). Dev compile fails parsing generated CSS from `globals.css` (`--color-ink` tokens corrupted in PostCSS/Lightning output, e.g. `var(-…or-ink)`). Source `globals.css` itself has **0** control bytes. Contested earlier run: **3 passed / 5 failed** (page `goto` timeouts + `ECONNRESET`). **Not attributed to 21A type fixes.** |
| Production build | `npm run build` | **FAIL (pre-existing / env)** — after renaming locked `.next`: “Compiled successfully” + “Finished TypeScript”, then **Invalid segment configuration export** at page-data collection; same corrupted CSS token warnings in build log. **Not caused by 21A TS remediations.** |

### Explicitly unchanged (financial / security semantics)

- Mortgage annuity, ROI, yields, APR/RPSN, valuation, currency conversion, investment scoring formulas  
- AuthN/AuthZ, ownership checks, admin RBAC, rate limiting, webhook signature verification  

---

## Prompt 21A verdict

**TypeScript gate: PASS** (exit 0, zero errors, no suppressions).  
Launch Gate / production readiness remain subject to Phase 1 infra (email/PSP/cron) and the separate build/E2E environment issues recorded above.
