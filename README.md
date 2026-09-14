# Majetio.cz

Česká realitní a investiční platforma, která pomáhá odpovědět na otázku: **Vyplatí se tuto konkrétní nemovitost koupit?**

Tento repozitář obsahuje Fázi 1 — produkční základ (Next.js, Prisma, design tokeny, dokumentace, CI).

## Stack

- Next.js (App Router) + TypeScript strict
- Tailwind CSS 4 + lightweight UI primitives
- PostgreSQL + Prisma
- Auth.js (next-auth v5) + server-side RBAC
- Zod, Vitest, Playwright, ESLint, Prettier
- GitHub Actions CI

Podrobnosti: [`docs/TECH_STACK.md`](docs/TECH_STACK.md)

## Rychlý start

### Požadavky

- Node.js 22+
- PostgreSQL 14+ (lokálně nebo managed)

### Instalace

```bash
cp .env.example .env
# upravte DATABASE_URL a AUTH_SECRET
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Pokud ještě nemáte databázi, můžete místo `migrate deploy` použít `npx prisma db push` (prototypování).
Otevřete [http://localhost:3000](http://localhost:3000).

### Kontroly kvality

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

E2E (volitelně, vyžaduje Playwright browsery):

```bash
npx playwright install
npm run test:e2e
```

## Dokumentace

| Dokument | Obsah |
| --- | --- |
| [`docs/PRODUCT_VISION.md`](docs/PRODUCT_VISION.md) | Vize produktu |
| [`docs/PRODUCT_REQUIREMENTS.md`](docs/PRODUCT_REQUIREMENTS.md) | Požadavky |
| [`docs/SYSTEM_ARCHITECTURE.md`](docs/SYSTEM_ARCHITECTURE.md) | Architektura |
| [`docs/DATABASE_DESIGN.md`](docs/DATABASE_DESIGN.md) | Databázový návrh |
| [`docs/ROUTE_MAP.md`](docs/ROUTE_MAP.md) | Mapa rout |
| [`docs/SECURITY_BASELINE.md`](docs/SECURITY_BASELINE.md) | Bezpečnost |
| [`docs/DESIGN_DIRECTION.md`](docs/DESIGN_DIRECTION.md) | Design |
| [`docs/IMPLEMENTATION_ROADMAP.md`](docs/IMPLEMENTATION_ROADMAP.md) | Roadmapa |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | ADR |

## Struktura

```
src/
  app/                 # App Router pages & API
  components/          # Shared UI + layout + homepage
  config/              # Commerce & navigation config
  domains/             # Domain modules (modular monolith)
  integrations/        # HypotekaJasne mock adapter
  lib/                 # db, auth, utils
prisma/                # Schema
docs/                  # Product & engineering docs
```

## Značka a design systém

- Značka: [`docs/BRAND_GUIDE.md`](docs/BRAND_GUIDE.md)
- Design systém: [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)
- Galerie (dev): `/dev/design-system`
- Assety: `public/brand/`, komponenty: `src/components/`
- Regenerace PNG ikon: `npm run brand:icons`

## HypotekaJasne

Integrační vrstva: `src/integrations/hypotekajasne`  
Phase 1 používá pouze mock (`HYPOTEKAJASNE_USE_MOCK=true`).

## Licence

Proprietární — Majetio.cz
