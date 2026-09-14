# Product Requirements — Majetio.cz

## Scope of Phase 1 (current)

- Project foundation, documentation, design tokens
- Modular domain structure
- Prisma data model v1
- Auth foundation (Auth.js) with server-side role checks
- Public routes (skeleton pages without fake functionality)
- Homepage with demo-labelled analysis placeholder
- Health check, CI, unit test scaffolding

## Functional requirements (product)

### FR-1 Property discovery
User can browse and filter properties; detail page shows structured listing data.

### FR-2 Property analysis
User can run free basic analysis and purchase full analysis. Analysis includes valuation context, investment scenarios, renovation estimate, location, risks, and recommended offer price.

### FR-3 Investment calculations
Cash flow, yield, financing-sensitive scenarios. Calculations live in domain services with unit tests — never inline in React components.

### FR-4 Comparisons & favourites
Registered users can favourite properties, compare multiple listings, and save searches.

### FR-5 Financing bridge
Majetio collects property + financial profile context and can hand off leads to HypotekaJasne via an integration adapter (mock in Phase 1).

### FR-6 Commerce
Orders and payments for paid analysis; configuration-driven pricing.

### FR-7 Administration
Staff roles manage content, leads, orders, and configuration.

## Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR-1 | TypeScript strict mode |
| NFR-2 | Server-side authorization for all privileged actions |
| NFR-3 | Zod validation on client and server for forms |
| NFR-4 | WCAG AA baseline accessibility |
| NFR-5 | Fully responsive UI |
| NFR-6 | Deployable on Vercel + external PostgreSQL |
| NFR-7 | No secrets in repository |
| NFR-8 | Demo/sample data clearly labelled |
| NFR-9 | Financial logic covered by automated tests |
| NFR-10 | Modular monolith — domains isolated, no premature microservices |

## User roles

| Role | Access summary |
| --- | --- |
| `VISITOR` | Public pages |
| `USER` | Account, favourites, saved searches, free analysis |
| `PAID_CLIENT` | Full analysis results |
| `ANALYST` | Analysis tooling, review |
| `SALES` | Leads, CRM activities |
| `EDITOR` | Content |
| `PARTNER` | Partner portal (later) |
| `ADMIN` | Administration |
| `SUPER_ADMIN` | Full system + config |

## Explicit non-goals (Phase 1)

- Live HypotekaJasne production API
- Real payment provider checkout
- Scraping / live property ingestion
- Fake reviews, fake stats, fake financial outcomes
- Microservices split
