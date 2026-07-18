# Domain: financial-profile

Finanční pas (account financial passport) lives in:

- `src/lib/financial-passport/` — types, progress, recommendations, server actions
- `src/components/financial-passport/` — editable form + summary
- Route: `/ucet/financni-profil`

Do not put financial calculations in React components; keep rule-based tips in `recommendations.ts`.
