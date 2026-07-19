# PROPERTY_RECOMMENDATIONS — Doporučené řazení

## Princip

Rule-based `PropertyMatchScore` vs Finanční pas (`PassportState` → `MatchProfile`). **Žádné ML / black-box.**

## Flow

1. Uživatel zvolí `?razeni=doporucene` (nebo `/nemovitosti/doporucene` → redirect).
2. Server načte Finanční pas (pokud přihlášen).
3. Pokud profil není kompletní (chybí rozpočet **a** lokalita **a** typ) → CTA „Doplňte Finanční pas“, výsledky bez match badge.
4. Jinak každé nabídce spočítá skóre 0–100 + důy a seřadí sestupně.

## Co vstupuje do skóre

| Signál | Váha (orientačně) |
| --- | --- |
| Rozpočet (`maxPriceCzk`) | 30 |
| Lokalita (město / region) | 25 |
| Typ nemovitosti | 15 |
| Dispozice + plocha | 15 |
| Cíl / rekonstrukce / riziko / strategie / výnos | 15 |

Detail breakdown: [MATCH_SCORE.md](./MATCH_SCORE.md).

## Analytika

Event `recommendation_sort_viewed` — jen `profile_complete` + bucket počtu výsledků (bez PII).
