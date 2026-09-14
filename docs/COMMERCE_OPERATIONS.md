# Commerce Operations

Orders, refunds, pricing governance, manual entitlements. Permissions: `payments.*`, `pricing.*`, `commerce.entitlements.grant`.

## Surfaces

| Route | Purpose |
| --- | --- |
| `/admin/objednavky` | Orders / refunds |
| `/admin/cenik` | Pricing versions |
| `/admin/monetizace` | Revenue ledger (GMV ≠ revenue) |
| `/admin/uzivatele` | Manual entitlement repair panel |

## Hard rules

1. **Never force `Payment.status = SUCCEEDED`** from admin UI/API — provider reconcile only (`refuseManualPaymentSucceeded`).
2. Refunds require `payments.refund` + sensitive step-up + audit.
3. Manual entitlements: `source = MANUAL_ADMIN`, `orderId = null`, reason required; function gate ADMIN/SUPER_ADMIN.
4. Pricing approve is sensitive; published catalog versions are immutable historically.

## Payment mismatch

Attention type `payment_mismatch`: PAID order without ACTIVE entitlement → repair via manual grant + reconcile jobs — not by forging SUCCEEDED.

## Related

`docs/PAYMENTS.md`, `docs/ENTITLEMENTS.md`, `docs/REVENUE_LEDGER.md`, `docs/MONETIZATION_ARCHITECTURE.md`
