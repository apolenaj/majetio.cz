# PROPERTY_COMPARISON

Dokumentace Comparison Engine + bezpečného sdílení.

## Modely

| Model | Účel |
| --- | --- |
| `Comparison` | Owner-scoped porovnání (max 4 properties) |
| `ComparisonProperty` | Pořadí (`sortOrder` / manualOrder) |
| `ComparisonSnapshot` | Public metriky at T + fingerprints (stale detection) |
| `ComparisonShare` | INVITED_USERS \| SECRET_LINK |
| `ComparisonShareInvite` | Pozvaní uživatelé |

## Share modes (BOD 78–81)

1. **INVITED_USERS** — žádná veřejná URL; přístup jen owner + invitees (server action)
2. **SECRET_LINK** — high-entropy token (32 B), SHA-256 hash v DB, TTL (7–90 dní, default 14), revokace

### Share-safe view

Explicitní `includeFlags`: basics, valuation, investment, renovation, risks, scores.

**Nikdy:** Financial Passport, příjmy, personal financing, private notes, rejection reasons, decision priority, match score vázaný na pas.

Validace: `assertShareSafePayload` / `SHARE_FORBIDDEN_KEYS` (+ e-mail pattern).

Route: `/sdilene/porovnani/[token]` (`robots: noindex`).

Token access: `classifySecretShareAccess` — valid / invalid / expired / revoked.

## Stale data (BOD 75, 104–106)

Banner: **„Některá data se od posledního porovnání změnila“**.  
Diff příklady: „Cena klesla o 300 000 Kč“, změna stavu / valuace / rekonstrukce / skóre.  
Canonical snapshot se nepřepisuje bez CTA **„Aktualizovat porovnání“**.

## UI

- Desktop: sticky headers + sticky label column, expandable rows, textové labely nejlepší/nejhorší
- Mobile: 2 property side-by-side + selectory
- Empty: „Přidejte alespoň 2 nemovitosti.“
- Limit: „Pro přidání další nejprve jednu odeberte.“

## Limity

| Limit | Hodnota |
| --- | --- |
| Max properties v porovnání | `comparisonConfig.maxProperties` (4) |
| Share TTL | 7–90 dní (default 14) |
| Share create rate | 15 / min / user |
| Comparison mutate rate | 30 / min / user |

## Alert logika (cena ve favourites)

Meaningful `DECREASED`/`INCREASED` → alert.  
`INITIAL` / `CORRECTED` / `REMOVED` → **žádný** alert.  
Detail matching: `docs/SAVED_SEARCH_MATCHING.md`.

Související: `docs/COMPARISON_ENGINE.md`, `docs/DECISION_WORKSPACE.md`.
