# PROPERTY_RISK_PRESENTATION — Rizika a due diligence

Prompt 9 Part 4. Transparentní rizika bez falešné jistoty.

## Severity hierarchie

| Severity | UI label | Typické příklady |
| --- | --- | --- |
| `critical` | Kritické | Neúplná/stale data, extrémní rekonstrukční nejistota |
| `high` | Důležité | Záporné CF, neověřené SVJ, nízká spolehlivost odhadu |
| `medium` | Střední | Cena nad odhadem, konflikt plochy, APPROXIMATE adresa |
| `low` | Nízké | Menší dispozice, měkká omezení |

Řazení v UI: critical → high → medium → low (`severityOrder`).

## Due diligence status

| Status | Label |
| --- | --- |
| `unverified` | Neověřeno |
| `partial` | Částečně ověřeno |
| `verified` | Ověřeno |

Status je **demo/UI stav**, ne právní certifikace. Text checklistu: „Majetio neprovádí právní due diligence za vás.“

## Checklist „Co ověřit“

Typicky: SVJ / fond oprav, věcná břemena, PENB, stavební stav, realističnost nájmu. Položky jsou per-slug v `demo-property-context.ts`.

## Konflikty dat

`fieldConflicts` z DTO (např. plocha 72–74 m²) — zobrazit jako rozsah, ne jednu „správnou“ hodnotu. Viz `formatAreaConflict`.

## Related

- [DECISION_COCKPIT.md](./DECISION_COCKPIT.md)
- [PROPERTY_DETAIL.md](./PROPERTY_DETAIL.md)
