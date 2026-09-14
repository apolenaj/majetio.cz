# Data Visualization — Majetio

## Knihovna

**Recharts** — jediná chart library. Lazy-load stránky s grafy přes route/client boundary.

## Pravidla

- Max **5** barev z `--chart-1…5`
- Žádné 3D, duhové palety, zbytečné animace
- Každý graf: název, jednotka, období, zdroj, datum, **textový summary** (sr-only / a11y)
- Loading / empty / error přes `ChartShell`
- Tipování tooltipů s `formatCzk` / `formatPercentPoints`

## Typy (wrappery připravené / vzor)

LineChart, BarChart (implementováno)  
Další (Area, Stacked, Donut, Waterfall, Scenario…) — stejný `ChartShell` + Recharts primitives ve Fázi 3.
