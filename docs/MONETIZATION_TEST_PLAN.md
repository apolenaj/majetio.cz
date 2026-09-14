# MONETIZATION_TEST_PLAN

Test plán monetizace (fáze 1–7). Finální běh DoD: checklist **227**.

## Automatizované vrstvy

| Vrstva | Příkaz | Pokrytí |
| --- | --- | --- |
| Unit / contract | `npm test` | pricing, payments, entitlements, revenue, fraud, consent, anti-patterns |
| Lint | `npm run lint` | ESLint |
| Typecheck | `npm run typecheck` | `tsc --noEmit` |
| Security (unit) | součást `npm test` | IDOR (`idor.test.ts`, tenant-idor, share-idor), webhook security, fraud |
| E2E | `npm run test:e2e` | cenik, entitlements, broker, sponsored, professional review, auth |
| Reconcile (ops) | `npm run revenue:reconcile` | 196–199 dry-run |

## Klíčové testovací soubory

| Soubor | Body |
| --- | --- |
| `src/config/pricing-architecture.test.ts` | 171/172, dark patterns |
| `src/domains/commerce/monetization-phase7.test.ts` | 211–215, 220, 226 |
| `src/domains/revenue/revenue-ledger-phase6.test.ts` | 146–159, 196–210 |
| `src/domains/listing-promotions/ranking-integrity.test.ts` | 182, 218, 219 |
| `src/domains/organizations/tenant-idor.test.ts` | 174–175 |
| `src/lib/security/idor.test.ts` | security baseline |
| `src/domains/payments/service/webhook-security.test.ts` | 170, 176 |
| `e2e/entitlements-b2c.spec.ts` | 190–191 |
| `e2e/broker-flow.spec.ts` | 192 |
| `e2e/sponsored-listing.spec.ts` | 193 |
| `e2e/professional-review.spec.ts` | 194 |

## Scénáře (manuální / QA)

1. Checkout Deep Analysis — Terms required, no marketing checkbox, server price.  
2. Refund admin — entitlement REVOKED + revenue reverse.  
3. Boost aktivní — SERP label „Sponzorováno“, Score fingerprint nezměněn.  
4. QBL accept MODE A — jeden PAY_PER_LEAD event.  
5. Concierge na ceníku — nedostupné, žádné agency sliby.  
6. Registrace z disposable email / high IP velocity — blok.

## CI

`.github/workflows/ci.yml` — lint, typecheck, unit, build.  
`.github/workflows/revenue-reconcile.yml` — nightly reconcile (vyžaduje `DATABASE_URL` secret).

E2E není v CI defaultně — spouštět lokálně / staging před releasem.

## Související

- `docs/MONETIZATION_FINAL_REPORT.md` — výsledky DoD běhu  
- `docs/MONETIZATION_ARCHITECTURE.md`
