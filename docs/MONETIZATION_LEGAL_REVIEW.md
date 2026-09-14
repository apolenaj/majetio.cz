# MONETIZATION_LEGAL_REVIEW

Legal / Accounting Review registry (checklist **213–215**) + anti-pattern audit (**226**).

## Sporné features — default OFF

| Oblast | Flag / stav | Bod | Kód |
| --- | --- | --- | --- |
| Consumer withdrawal (digitální obsah) | `CONSUMER_WITHDRAWAL_ENABLED=false` | 213 | `consumer-withdrawal.ts` |
| Purchase Concierge / transaction success fee | `TRANSACTION_SUCCESS_FEE_ENABLED=false` | 214, 215 | `success-fee-model.ts` |
| Partner marketplace | `PARTNER_MARKETPLACE_ENABLED=false` | 214 | `feature-flags.ts` |
| Automated tax invoices | `AUTOMATED_INVOICE_ENABLED=false` | 215 | `invoices.ts` |

Runtime assert: `assertDisputedFeaturesDefaultOff()`.

## Označeno, ale technicky povolené

| Oblast | Poznámka |
| --- | --- |
| VAT 21 % split | Technický `DEFAULT_VAT_RATE_BP` — OSS / reverse-charge vyžaduje accounting review |
| B2B MODE B success fee | Oddělené od Concierge; vyžaduje smlouvu s org (`docs/LEAD_BILLING.md`) |

Marker v kódu/docs: `LEGAL_REVIEW`.

## Consenty (211 / 212)

| Pravidlo | Stav |
| --- | --- |
| Versioned Terms při nákupu | `recordPurchaseTermsAcceptance` → `Consent` TERMS + `orderId` |
| Marketing **není** součástí checkoutu | schema `z.never()` + `assertNoMarketingBundledWithPurchase` |
| Marketing správa | `/ucet/souhlasy` (odděleně) |

## Anti-patterns (226)

Kanonický seznam: `src/config/monetization-anti-patterns.ts`.

| ID | Zakázáno | Enforcement |
| --- | --- | --- |
| `client_controlled_price` | ano | checkout schema + canonical amount |
| `unlimited_free_abuse` | ano | fraud velocity + usage meters |
| `marketing_bundled_with_purchase` | ano | purchase-consent |
| `prechecked_marketing_or_renew` | ano | UX defaults |
| `silent_auto_renew` | ano | pricing-ux |
| `fake_scarcity_or_countdown` | ano | pricing-ux |
| `hidden_fees` | ano | VAT-inclusive + disclaimer |
| `boost_affects_score_or_organic` | ano | commercial firewall |
| `gmv_as_revenue_or_ltv` | ano | metrics + LTV guard |
| `double_revenue_attribution` | ano | ledger uniqueness |
| `entitlement_before_paid` | ano | webhook grant |
| `concierge_claims_while_off` | ano | flag + scrub |
| `empty_free_paywall` | ano | free tier features |
| `disputed_legal_features_default_on` | ano | legal-review assert |

## Související

- `docs/CONSENT_MANAGEMENT.md`  
- `docs/SUCCESS_FEE_MODEL.md`  
- `docs/PARTNER_MONETIZATION.md`  
- `docs/MONETIZATION_TEST_PLAN.md`
