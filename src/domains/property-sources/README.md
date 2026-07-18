# Domain: property-sources

Modular domain boundary for multi-source ingest (Prompt 7).

Structure:

- `schemas/` — intermediate `NormalizedListing` (not public DTOs)
- `service/`
  - `adapter.ts` — `PropertySourceAdapter` (parse, validate, normalize, map, extractMedia)
  - `generic-json-adapter.ts` — reference partner JSON adapter
  - `sanitize.ts` / `normalize.ts` — text cleanup, m² + ISO currency
  - `pipeline.ts` — Ingest → Validate → Sanitize → Normalize → Detect Duplicates → Canonical Update
  - `idempotency.ts` / `import-job.ts` — idempotent keys + job counters
- `server/` — workers / cron (later)
- `tests/` — co-located `*.test.ts`

Do not put financial calculations in React components.
