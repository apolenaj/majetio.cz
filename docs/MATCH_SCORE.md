# MATCH_SCORE — Rule-based PropertyMatchScore

Implementace: `src/domains/properties/service/match-score.ts`.

## Výstup

```ts
{
  score: 0–100,
  profileComplete: boolean,
  reasons: Array<{ code, tone: "positive"|"warning"|"neutral", label }>
}
```

UI zobrazí až 5 důvodů (mix ✓ a !), např.:

- `✓ Ve vašem rozpočtu`
- `! Nutná rekonstrukce je vyšší než preference rizika`
- `✓ Lokalita odpovídá preferenci (Praha)`

## Pravidla (shrnutí)

| Kód | Kdy |
| --- | --- |
| `PROFILE_INCOMPLETE` | chybí budget/lokalita/typ |
| `BUDGET_OK` / `_OVER` / `_SLIGHTLY_OVER` | vs `maxPriceCzk` (+10 % soft) |
| `LOCATION_CITY` / `_REGION` / `_MISS` | preferredCity / regions |
| `TYPE_OK` / `_MISS` | propertyTypes |
| `LAYOUT_OK` / `AREA_OK` / misses | dispositions, min/max m² |
| `RENO_FIT` / `RENO_VS_CONSERVATIVE` / `RENO_NOTE` | condition + goal/risk |
| `STRATEGY_OK` | strategy slugs / tags |
| `YIELD_OK` / `_LOW` | vs targetGrossYieldPct |

## Testy

`match-score.test.ts` — incomplete profile, pozitivní shoda, konzervativní vs rekonstrukce, sortByMatchScore.
