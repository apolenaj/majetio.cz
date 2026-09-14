# Design Direction — Majetio.cz

> Canonical brand system: [`BRAND_GUIDE.md`](./BRAND_GUIDE.md).  
> This file remains a short engineering pointer aligned with Prompt 1–2.

## Brand feeling

Premium European proptech: trustworthy, modern, data-oriented, financially professional, clear — premium but not kitsch luxury.

**Primary claim:** Než koupíte, mějte jasno.  
**Logo:** Layered Asset (Concept C) — `public/brand/`, React `src/components/brand`.

## Visual tokens

See `src/app/globals.css` and Brand Guide §5–6.

| Token | Role | Value |
| --- | --- | --- |
| `--color-ink` | Primary / navy ink | `#0B1F33` |
| `--color-growth` | Positive / growth | `#1F6F54` |
| `--color-sand` | Accent | `#C4A574` |
| `--color-canvas` | Warm light background | `#F7F4EF` |

## Typography

- **Display / brand:** Source Serif 4
- **UI / body / metrics:** DM Sans (+ tabular nums)

## Motion

Restrained hover/fade; honor `prefers-reduced-motion`.

## Accessibility

WCAG AA contrast, focus rings (`--color-focus`), semantic landmarks, demo data labelled.
