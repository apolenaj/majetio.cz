# Content Integrity Audit — Fake content & dark patterns

**Datum:** 2026-07-22  
**Rozsah:** Public UI copy, pricing, checkout, CMP, partner share, expert claims

## Rules applied

1. No fake compliance (GDPR compliant, 100% secure, certified…)
2. No fake social proof (testimonials, counts, ratings, logos)
3. No unbacked marketing / financial / legal / security overclaims
4. No dark patterns (cookies, renew, consent, lead share, hidden recurring)
5. No invented experts on public surfaces

## Findings & fixes

| Area | Nález | Akce |
| --- | --- | --- |
| Homepage H1 | „skutečně vyplatí“ | Softened — data/předpoklady framing |
| How-it-works step | „větší jistotou“ | Softened — „s přehledem“ |
| Kontakt | Nadpis „Soukromí a GDPR“ působilo jako compliance badge | → „Soukromí a osobní údaje“ + explicitně bez claimu „GDPR compliant“ |
| Investment Audit tagline | Imply named „specialista“ | Human-in-the-loop + no public expert names |
| Objednávky | Chyběl jasný cancel-renew path | Info box + mailto zrušení obnovy |
| Ceník | Obnova/zrušení méně viditelné | Sekce „Obnova a zrušení“ + odkaz na účet |
| Checkout | Riziko skrytého recurring | Explicitní věta: žádný skrytý recurring charge |
| Testimonials / fake stats / partner logo walls | Nenalezeno na public surfaces | Partneri page = real HJ link + sponsored badge only |
| Cookie CMP | Reject first, equal weight | Already compliant — no change |
| Lead sharing | Named recipient + scope | Already `DataSharingPreview` — no change |
| Auto-renew defaults | `autoRenewDefault: false` | Already enforced in catalog tests |
| Fake team on /o-nas | Placeholders only | Already compliant |

## Regression

`src/content/content-integrity.test.ts` — forbidden phrase scan over `src/content` + homepage/trust/pricing blobs.

```bash
npx vitest run src/content/content-integrity.test.ts
```

## Remaining (non-blocking)

- Full self-serve „turn off renew“ button requires Subscription entity + billing provider API (today: explicit consent each renew + email cancel path).
- Company IČO placeholders remain until counsel fills `COMPANY_PLACEHOLDER`.
