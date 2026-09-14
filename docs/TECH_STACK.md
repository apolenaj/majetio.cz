# Tech Stack — Majetio.cz

## Chosen stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 16 (App Router)** | SSR/SSG, Server Actions, Vercel-native deploy, one codebase for UI + API |
| Language | **TypeScript (strict)** | Safety for financial/domain logic and shared contracts |
| UI | **React 19 + Tailwind CSS 4** | Fast, consistent styling; design tokens via CSS variables |
| Components | **Lightweight shadcn-style primitives** (`cva`, `clsx`, `tailwind-merge`) | Production-quality UI without early lock-in to a heavy kit |
| Database | **PostgreSQL** | Relational integrity for users, orders, analyses, audit |
| ORM | **Prisma 6** | Typed models, migrations, good DX with Next.js (v6 kept stable vs Prisma 7 config changes) |
| Validation | **Zod** | Shared client/server schemas |
| Auth | **Auth.js (next-auth v5)** | Production-ready sessions, Prisma adapter, role claims |
| Unit tests | **Vitest** | Fast, ESM-friendly, works with domain pure functions |
| E2E | **Playwright** | Cross-browser coverage for critical journeys |
| Lint / format | **ESLint + Prettier** | Consistent code quality |
| CI | **GitHub Actions** | lint, typecheck, unit tests, build |

## Explicitly avoided (for now)

- Microservices / event buses — premature for current team and scope
- GraphQL — REST/Server Actions suffice
- Separate BFF — Next.js is the BFF
- Hardcoded pricing in components — central config + `AppConfiguration`

## Deployment target

- **Frontend/API:** Vercel
- **Database:** managed PostgreSQL (e.g. Neon, Supabase, Railway, AWS RDS)
- **Secrets:** environment variables only (see `.env.example`)

## Integration approach

HypotekaJasne is abstracted behind `integrations/hypotekajasne` with:

- shared TypeScript contracts
- interface (`HypotekaJasneClient`)
- `MockHypotekaJasneClient` for local/dev
- future `HttpHypotekaJasneClient` swap without domain rewrites
