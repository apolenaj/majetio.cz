# Component Library — Majetio

Přehled hlavních komponent. Detailní API je ve zdrojových souborech.

## UI

| Komponenta | Účel | Nepoužívat když |
| --- | --- | --- |
| `Button` | Všechny akce (varianty primary…premium) | Vlastní barevná tlačítka mimo varianty |
| `IconButton` | Jen ikona + povinný `label` | Akce, kde text není jasný bez labelu |
| `Card` | Surface s variantami static/interactive/warning… | Klikací vzhled u neklikatelných metrik |
| `Badge` / `DataQualityBadge` / `RiskBadge` | Stavy | Samotná barva bez textu |
| `Container` / `Section` / `Stack` / `Grid` | Layout konzistence | Obalení každého divu „pro jistotu“ |

## Forms

| Komponenta | Účel |
| --- | --- |
| `Field` | Label + helper + error + a11y ids |
| `TextInput` / `TextArea` / `Select` | Základ |
| `CurrencyInput` / `PercentageInput` / `AreaInput` | Lokalizované finanční vstupy (cs-CZ) |
| `Checkbox` / `RadioGroup` / `Switch` | Volby |

Chyby vždy říkají, **jak opravit** (česky).

## Data display

| Komponenta | Účel |
| --- | --- |
| `MetricCard` | Metrika + vysvětlení + kvalita dat |
| `MajetioScore` | Prezentace skóre (bez výpočtu) |
| `FinancialTable` | Čísla vpravo, tabular nums, best/worst + text |
| `PropertyCard` | Listing preview |

## Charts

`ChartShell` + `LineChart` / `BarChart` (Recharts). Povinný textový `summary`.

## Overlays / Feedback / Navigation

Dialog, AlertDialog, Tooltip, InfoTooltip, MetricExplanation  
EmptyState, ErrorState, InlineAlert, LoadingSkeleton, Spinner  
Tabs, Breadcrumbs, SkipLink, MobileBottomNavigation, CompareTray

## Layouts

`MarketingPageLayout`, `StandardPageLayout`, `DashboardLayout`, `FormWizardLayout`, `AuthenticationLayout`, `ArticleLayout`, `CalculatorShell`, `ComparisonLayout`, `PageHeader`
