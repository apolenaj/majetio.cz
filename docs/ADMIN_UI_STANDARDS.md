# Admin UI Standards

Dense, utilitarian Tailwind admin UI. Spec **156–165**, **193–217**.

## Data tables

Base: `src/components/admin/data-table/`

- Server-side pagination via URL (`page`, `pageSize`)
- Filters & sort in query string (`src/lib/admin/url-table-state.ts`)
- Loading / empty states (no fake rows)
- Keyboard-friendly links + focus rings; `aria-sort` on sortable headers
- Density tokens: `--admin-table-font`, `--admin-cell-px/py`, `.admin-dense`

Reference: `/admin/uzivatele`

## Bulk actions

`AdminBulkActionBar` — selected IDs + reason (≥12) + confirm token; optional dry-run/preview before mutate.

## CSV export

`src/lib/admin/csv-export.ts` — sanitize formula injection (`= + - @`), UTF-8 BOM, dry-run preview.

## Metrics

`AdminMetricTile` / `AdminMetricsGrid` — **null → empty label**, never invent values.

## Home personalization

`buildAdminHomeProfile(role)` — attention type filters + quick links by permission (`src/lib/admin/admin-home-by-role.ts`).

## Accessibility

WCAG-oriented: captions, sr-only labels on filters, focus-visible rings, no color-only status.
