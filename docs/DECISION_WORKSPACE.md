# DECISION_WORKSPACE

Property Decision Workspace — shortlist, porovnání, úkoly, uložená hledání, sdílení.

## Cíl

Pomoci uživateli **rozhodnout se s podklady**, ne rozhodnout za něj. Žádné „Kupte tuto nemovitost“ bez metodiky.

## Moduly

| Modul | Odpovědnost |
| --- | --- |
| Favourites / Shortlist | Stavy CONSIDERING → VIEWING → FAVORITE → REJECTED |
| Comparison Engine | ViewModel + Decision Pack + snapshoty |
| Sharing | INVITED_USERS / SECRET_LINK (share-safe) |
| Notifications | Transakční alerty (cena, stav, saved search) |
| Analytics | Funnel + agregované rates (bez UI dashboardu) |

## Privacy (BOD 177–181)

- Soukromé poznámky (`PropertyUserNote`) — owner-only, nikdy v analytics ani share payloadu
- Finanční pas / příjmy / osobní financing — nikdy ve sdíleném pohledu ani public cache
- Secret link: hash tokenu v DB, raw token jednou při vytvoření, expirace povinná
- IDOR: všechny mutace scoped `userId` ze session

## Chybějící data

- Buňky / metriky: `null` / „Není k dispozici“, **nikdy falešná nula**
- Section fallbacks: výpadek jedné sekce (např. renovation) nesmí shodit stránku

## Zakázané přístupy (BOD 182)

1. Žádný „jeden vítěz“ bez transparentní metodiky (Decision Matrix = vážené ranky, ne verdikt)
2. Marketing nikdy jako transakční alert
3. Žádný open redirect v notifikačních CTA
4. Žádný leak passport dat do share / e-mailů
5. Automatizace nepřepisuje `manualOrder` porovnání
6. Žádná monetizace / platební brána v tomto modulu

## Funnel analytiky (BOD 126)

`viewed → saved → shortlisted → compared → analysis → purchase_intent`

Eventy: `property_favorited`, `property_shortlisted`, `comparison_created`, `price_alert_opened`, `decision_funnel_step`, `decision_note_saved` (jen length_bucket), `decision_task_created` (jen type).

**Nikdy:** obsah privátních poznámek, CZK částky, e-mail, passport.

Agregace: `src/lib/analytics/decision-metrics.ts` (`observeFunnelStep` → counter + track).

## Matching uložených hledání

Viz `docs/SAVED_SEARCH_MATCHING.md`.

## Code map

- `src/domains/favourites/`
- `src/domains/comparisons/` (+ `share/`, `decision/`)
- `src/domains/decision-workspace/`
- `src/domains/notifications/`
- `src/domains/saved-searches/`
- UI: `src/components/favourites/`, `comparisons/`, `decision-workspace/`

## Závěrečný report

`docs/DECISION_WORKSPACE_FINAL_REPORT.md`
