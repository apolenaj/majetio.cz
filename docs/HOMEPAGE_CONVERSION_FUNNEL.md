# Homepage Conversion Funnel — Majetio.cz

## Primární cíl

**Spustit analýzu** (`/analyza` nebo `/analyza/nova`).

## Sekundární cíle

1. Procházet nemovitosti  
2. Spočítat financování (HypotekaJasne / kalkulačka)  
3. Otevřít ceník / metodiku (důvěra)

## Funnel kroky

```
homepage_viewed
    → hero_primary_cta_clicked | quick_analysis_submitted
        → /analyza nebo /analyza/nova
    → hero_secondary_cta_clicked
        → /jak-to-funguje (edukace → návrat)
    → sample_analysis_viewed
        → primary_cta (sample) → /analyza
    → hypotekajasne_cta_clicked
        → kalkulačka / externí HJ
    → pricing_cta_clicked
        → basic → /analyza | full → /cenik
    → final_cta_clicked
        → analyze | browse
```

## Vstupní body do analýzy

| Vstup | Chování |
| --- | --- |
| Hero primary CTA | Link `/analyza` |
| Quick analysis URL | Validace → `/analyza/nova?source=url&listingUrl=…` |
| Quick analysis manual | `/analyza/nova?source=manual` |
| Sample / pricing / final | Linky na `/analyza` |

## Anti-patterny (zakázáno)

- Falešné odpočty a „poslední šance“
- Skrytí rizik kvůli konverzi
- Posílání PII v analytických eventech
