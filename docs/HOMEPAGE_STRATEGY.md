# Homepage Strategy — Majetio.cz

Související: `HOMEPAGE_CONTENT.md`, `HOMEPAGE_CONVERSION_FUNNEL.md`, `PRODUCT_VISION.md`, `BRAND_GUIDE.md`.

## Cíl stránky

Homepage není inzertní výloha. Primární úloha: vysvětlit, že Majetio pomáhá rozhodnout, **zda se nemovitost vyplatí koupit**, a převést návštěvníka do analýzy (`/analyza`) nebo katalogu (`/nemovitosti`).

## Pozice

- Analytická realitní platforma (proptech)
- Transparentní předpoklady, žádný falešný social proof
- Oddělení ekonomiky nemovitosti (Majetio) a financování klienta (HypotekaJasne)

## Principiální rozhodnutí

| Téma | Rozhodnutí |
| --- | --- |
| Hero | Produktový claim + CTA nad foldem + quick entry |
| Demo data | Povolena jen s jasným označením `isDemo` / „Demo“ |
| Urgency | Zakázána („poslední šance“, odpočty) |
| Ceny produktů | Jen z `commerceConfig` |
| A/B | Konfigurace v `src/config/homepage.ts` (H1, CTA, pořadí sekcí) |

## Struktura (control)

1. Announcement (trust) → Hero → finanční disclaimer  
2. Sample analysis → Skóre & metriky → Jak to funguje  
3. Strategie → Segmenty → Financování  
4. Rekonstrukce / lokalita / rizika → Porovnání → Ceník  
5. Metodika → FAQ → Final CTA  

## Experimenty (připraveno)

- `homepage_h1` — control vs. challenger headline  
- `homepage_primary_cta` — control vs. „Spustit analýzu“  
- `homepage_section_order` — control vs. dřívější pricing  

Výchozí bucket: **control**. Challenger se aktivuje změnou `homepageExperimentDefaults` (nebo budoucím flag providerem).

## Co homepage nedělá

- Neprovádí live import URL (pouze validace + redirect)
- Negarantuje výnosy ani schválení hypotéky
- Nespouští onboarding / auth (Prompt 6)
