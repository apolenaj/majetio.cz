# Organization Administration

B2B org KYC and billing boundaries. Permissions: `orgs.read` / `.verify` / `.billing.write`.

## Surfaces

| Route | Purpose |
| --- | --- |
| `/admin/organizace` | Org list |
| `/admin/organizace/[id]` | Detail / verification |

## KYC ≠ listing verification

Org / agent identity verification (`orgs.verify`) is **not** the same as property listing moderation. Keep workflows and badges separate.

## Billing

- `orgs.billing.write` is sensitive (step-up).
- Tenant IDOR: org members cannot access foreign org billing; platform ADMIN bypass documented in tenant tests.

## Related

`docs/ORGANIZATIONS_B2B.md`, `docs/B2B_PLANS.md`
