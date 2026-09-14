# Accessibility Guidelines — Majetio

Cíl: **WCAG AA**

## Checklist

- [ ] Kontrast textu na canvas / surface
- [ ] Viditelný `focus-visible` (`--focus-ring`)
- [ ] Klávesnice: Tabs, Dialog (Radix trap), SkipLink
- [ ] Formuláře: label + error `role="alert"`
- [ ] Ikony dekorativní `aria-hidden`; IconButton má `aria-label`
- [ ] Grafy: textový `summary`
- [ ] Tabulky: `<caption>` / `scope` dle potřeby; TH
- [ ] Stav není jen barvou (badge text + ikona + znaménko)
- [ ] `prefers-reduced-motion`
- [ ] Touch ~44px u primárních akcí
- [ ] Tooltip není jediný zdroj kritické informace (mobile: details/dialog)

## Skip link

`SkipLink` → `#main-content` v root layoutu.
