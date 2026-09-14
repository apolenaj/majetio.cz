# QUALIFIED_BUYER_LEADS

Marketplace kvalifikovaní zájemci — produktová kvalifikace + privacy handoff.

Detailní pipeline: `docs/MARKETPLACE_LEADS.md`. Billing: `docs/LEAD_BILLING.md`.

## Co to je

`QualifiedBuyerLead` ≠ raw `Inquiry`.

Kvalifikace (non-discriminatory):

- ověřený kontakt  
- známý rozpočet (pásmo)  
- stav financování  

Badge: **Kvalifikovaný zájemce** — ne garance nákupu.

## Privacy

| Stav | Agent vidí |
| --- | --- |
| Před accept | Anonymizovaný profil (pásma) |
| Po accept | Kontakt; FinancialProfile jen se souhlasem `AGENT_BUYER_PROFILE_SHARE` |

## SLA (Broker inbox)

- `slaDueAt` = qualify + 24 h  
- `firstResponseAt` / `slaBreachedAt`  
- **Žádný** veřejný ranking makléřů  

## Billing trigger

Po `acceptQualifiedBuyerLead` → pokud org `PAY_PER_LEAD` → `chargePayPerLead` (183/216).  
Inquiry create se **neúčtuje**.

MODE B (`SUCCESS_FEE`): POTENTIAL při `PropertyTransaction` → `CLOSED` + `brokerCommissionGrossMinor` — ledger až po `verifySuccessFee`.

## Související

- `docs/CRM_ARCHITECTURE.md`  
- `docs/REVENUE_ATTRIBUTION.md`  
- `docs/SPONSORED_LISTINGS.md` (oddělené — boost ≠ QBL)  
- `docs/SUCCESS_FEE_MODEL.md`  
