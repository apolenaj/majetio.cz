# Design Tokens — Majetio

Zdroj: `src/app/globals.css` · TS map: `src/design-system/tokens.ts`

## Barvy (sémantické)

| Token | Význam |
| --- | --- |
| `--background-primary` | Hlavní plocha stránky |
| `--background-secondary` | Alternativní sekce / sunken |
| `--surface-primary` | Karty, formuláře |
| `--surface-elevated` | Raised surfaces |
| `--text-primary` / `--text-secondary` / `--text-muted` | Text hierarchy |
| `--border-default` / `--border-strong` | Ohraničení |
| `--action-primary` / `--action-accent` / `--action-premium` | CTA |
| `--status-*` | success, warning, error, info |
| `--data-verified` / `--data-estimated` / `--data-stale` / `--data-missing` | Kvalita dat |
| `--investment-positive` / `--investment-negative` | Výsledky (+ text/znaménko) |
| `--risk-low` … `--risk-critical` | Riziko |
| `--chart-1` … `--chart-5` | Grafy (max 5) |
| `--focus-ring` | Focus |

Brand primitives (`--brand-ink-900` atd.) jsou interní.

## Spacing

4px grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 (`spaceScale` v TS).

## Radius

`sm` 4 · `md` 6 · `lg` 8 · `card` 12 · `dialog` 12 · `pill` full

## Elevation

`flat` · `raised` · `overlay` · `modal` · `sticky`

## Motion

`duration-fast` 150ms · `normal` 220ms · `slow` 320ms  
Easing: standard / enter / exit  
`prefers-reduced-motion` vypíná animace.

## Layout šířky

| Kontext | Max |
| --- | --- |
| Marketing | 72rem |
| Dashboard | 80rem |
| Form | 40rem |
| Article | 42rem |

## Ikony

Lucide only · 12 / 16 / 20 / 24 / 32 · stroke konzistentní s knihovnou
