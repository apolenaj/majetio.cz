# LEAD_BILLING

B2B účtování kvalifikovaných leadů (checklist **183**, **216**).

## Módy

Konfig: `Organization.leadBillingMode` + `src/domains/revenue/lead-billing-conditions.ts`.

### MODE A — Pay Per Lead

| | |
| --- | --- |
| Trigger | `AGENT_ACCEPTED` na `QualifiedBuyerLead` |
| Cena | `payPerLeadPriceMinor` (default 499 Kč) |
| Ledger | `RevenueEvent` source `PAY_PER_LEAD` (idempotent per lead) |
| Neúčtuje se | raw Inquiry, ne-kvalifikovaný kontakt |
| Blokace | dispute status `UPHELD` |

Wire: `acceptQualifiedBuyerLead` → `shouldChargePayPerLeadOnAccept` → `chargePayPerLead`.

### MODE B — Success Fee (broker commission)

| | |
| --- | --- |
| Trigger | uzavřený deal (`PropertyTransaction` → `CLOSED`) |
| Výpočet | `%` z `brokerCommissionGrossMinor` (`successFeeBps`) |
| Ledger | až po `verifySuccessFee` — ne při POTENTIAL |
| ≠ | Purchase Concierge (viz `docs/SUCCESS_FEE_MODEL.md`) |

API: `createSuccessFeePotential`, `submitSuccessFeeForVerification`, `verifySuccessFee`.  
Wire: `updatePropertyTransactionStatus({ status: "CLOSED", brokerCommissionGrossMinor })`.

## Attribution & disputes

- Attribution window: `attributionWindowDays`  
- Dispute bez evidence → `EVIDENCE_REQUIRED` (lead zůstává billable)  
- UPHELD → reverse revenue  

Detail: `docs/REVENUE_ATTRIBUTION.md`.

## Oddělení od Boost

Listing Boost je samostatný produkt (`docs/SPONSORED_LISTINGS.md`) — **ne** lead billing.  
Boost **neovlivňuje** skóre ani organiku (218).

## Související

- `docs/QUALIFIED_BUYER_LEADS.md`  
- `docs/SUCCESS_FEE_MODEL.md`  
- `docs/B2B_PLANS.md`  
