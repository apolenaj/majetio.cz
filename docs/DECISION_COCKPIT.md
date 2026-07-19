# DECISION_COCKPIT — Rozhodovací kokpit detailu

Prompt 9 Parts 2–5. UI pro rychlé rozhodnutí bez Valuation Engine.

## Sekce (sticky nav)

| ID | Obsah |
| --- | --- |
| `prehled` | Galerie, cena, quick summary, skóre |
| `ekonomika` | Cena vs odhad, investiční přehled, CF waterfall |
| `scenare` | ScenarioSwitcher (+ lokální user assumptions) |
| `financovani` | HypotekaJasne mock + DataSharingPreview, rekonstrukce |
| `rizika` | Severity rizika, checklist, due diligence |
| `lokalita` | Kč/m² vs průměr, mapa dle precision |
| `historie` | Price history + DOM + relist |
| `zdroje` | Provenance, stale, konflikty |
| `alternativa` | 3–6 podobných s důvodem |

## Pravidla dat

- Chybějící metriky → **„Neuvedeno“** / **„Analýza není dostupná“** — nikdy `0` jako fake výsledek
- Historie ceny jen z `PropertyPriceHistory` (nevymýšlet)
- User assumptions ve scénáři jen v prohlížeči (nepřepisují DB)
- Majetio skóre ≠ Match Score (vizuálně oddělené)

## CTA

- Desktop: sticky aside (Analyzovat / Financování / Uložit / Porovnat / Sdílet)
- Mobil: sticky primary + Uložit; anonymní Uložit → login + pending favourite

## Analytics (bez PII)

- `property_detail_viewed` — slug, is_demo, has_asking_price, visibility
- `scenario_changed` — scenario_id
- `financing_cta_clicked` — location=`property_detail`
- `property_detail_section_nav` — section id

## Related

- [PROPERTY_DETAIL.md](./PROPERTY_DETAIL.md)
- [PROPERTY_RISK_PRESENTATION.md](./PROPERTY_RISK_PRESENTATION.md)
