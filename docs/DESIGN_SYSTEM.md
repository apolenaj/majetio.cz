# Design System — Majetio

Design systém rozšiřuje značku z Promptu 2 a architekturu z Promptu 1.

## Principy

1. **Data musí být srozumitelná** — ověřeno / odhad / zastaralé + text + ikona  
2. **Komplexita postupná** — přehled → detail → tooltip / disclosure  
3. **Finanční výsledek vysvětlitelný** — význam, vstupy, zdroj, datum, omezení  
4. **Důvěryhodnost před efektem** — žádný trading/crypto vibe  
5. **Mobil ≠ zmenšený desktop** — vlastní CTA, filtry, tabulky  
6. **Riziko nesmí být skryto**

## Architektura komponent

```text
src/components/
  brand/           # Logo, Wordmark
  ui/              # Primitiva (Button, Card, Badge, layout)
  forms/           # Field, inputs, controls
  data-display/    # MetricCard, Table, MajetioScore
  charts/          # ChartShell, Line/Bar wrappers (Recharts)
  property/        # PropertyCard
  feedback/        # Empty/Error/Alert/Skeleton
  overlays/        # Dialog, Tooltip
  navigation/      # Tabs, Breadcrumbs, SkipLink, mobile nav
  layout/          # Page layouts, header/footer
  home/            # Homepage sections
  dev/             # Design-system demos only
src/design-system/tokens.ts
src/lib/format.ts
```

## Tokeny

Centrálně v `src/app/globals.css` (CSS variables) + `src/design-system/tokens.ts`.  
Komponenty používají **sémantické** názvy (`--action-primary`, `--investment-positive`), ne `green-500`.

Viz `docs/DESIGN_TOKENS.md`.

## Vývojová galerie

`/dev/design-system` — dostupná v `development`. V produkci `404`, pokud není `ALLOW_DESIGN_SYSTEM=true`.

## Grafy

Jedna knihovna: **Recharts**. Wrapper `ChartShell` vynucuje název, summary (a11y), zdroj, empty/loading/error.

## Dark mode

Nepřepínač. Tokeny jsou připravené na pozdější rozšíření; primární režim = světlý canvas.
