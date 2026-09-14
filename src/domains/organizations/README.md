# Domain: organizations

B2B SaaS for real-estate professionals (agents, agencies, developers, partners).

- `quota.ts` — pure listing quota reconcile (downgrade → OVER_LIMIT, never delete)
- `service.ts` — Organization CRUD, members, verification, plan changes
- Config: `src/config/organizations-b2b.ts`
- Docs: `docs/ORGANIZATIONS_B2B.md`
