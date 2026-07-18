# Homepage Analytics — Majetio.cz

Implementace: `src/lib/analytics/events.ts`, trackery v `src/components/homepage/tracked.tsx`.

## Pravidla

- Pouze type-safe eventy (`AnalyticsEvent`)
- **Žádná PII** (e-mail, telefon, jméno), žádné citlivé finance (příjem, přesná adresa)
- URL inzerátu se do eventů **neposílá** — jen `entry` + `valid`
- V development režimu: `console.debug`

## Homepage eventy

| Event | Props | Kdy |
| --- | --- | --- |
| `homepage_viewed` | `experiment_h1`, `experiment_cta`, `experiment_order` | Mount homepage |
| `hero_primary_cta_clicked` | `href`, `variant` | Hero primary |
| `hero_secondary_cta_clicked` | `href`, `variant` | Hero secondary |
| `quick_analysis_submitted` | `entry`, `valid` | Odeslání quick entry |
| `sample_analysis_viewed` | `isDemo: true` | Intersection ≥ 35 % |
| `hypotekajasne_cta_clicked` | `target`, `location` | Kalkulačka / externí |
| `pricing_cta_clicked` | `product`, `href` | Basic / full |
| `final_cta_clicked` | `href`, `intent` | Final block |
| `faq_opened` | `questionId` | Otevření FAQ |
| `primary_cta_clicked` | `label`, `href`, `location` | Další CTA (terciární, sample) |

## A/B metadata

Experiment bucket se posílá v `homepage_viewed` a u hero CTA jako `variant`.  
Zdroj: `homepageExperimentDefaults` v `src/config/homepage.ts`.

## Budoucí provider

`track()` je tenký adapter — napojení na Plausible / GA4 / interní pipeline bez změny call sites.
