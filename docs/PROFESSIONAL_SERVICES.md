# PROFESSIONAL_SERVICES

Profesionální a partnerské služby Majetio (human-in-the-loop + marketplace).

## Expert Review / Investment Audit

**Nejsou** automatické analýzy (valuation/investment engine). Vyžadují specialistu.

| Status | Význam |
| --- | --- |
| `WAITING_FOR_INPUTS` | Čeká na podklady klienta |
| `SUBMITTED` | Podklady hotové |
| `ASSIGNED` | Přiřazen analytik |
| `IN_REVIEW` | Probíhá review |
| `NEEDS_CLARIFICATION` | Nutné upřesnění |
| `DELIVERED` / `CLOSED` | Hotovo |

Model: `ProfessionalServiceRequest` + `ProfessionalServiceActivity`  
API: `src/domains/professional-services/workflow.ts`

## Partner Marketplace

| Model | Účel |
| --- | --- |
| `Partner` | Partner (inspekce, právník, certifikáty, …) |
| `PartnerCommercialAgreement` | FIXED / REVENUE_SHARE / HYBRID |
| `PartnerServiceOffering` | Veřejná služba v katalogu |

Veřejný katalog **neexponuje** přesné fee částky — jen `compensationModel`.

## Purchase Concierge (feature flag)

```env
TRANSACTION_SUCCESS_FEE_ENABLED=false
```

Dokud je flag `false`:

- `getPurchaseConciergePublicSurface()` → `null` (žádné CTA)
- `enablePurchaseConciergeOnTransaction` → `feature_disabled`
- `scrubConciergePromises` maže sliby o realitním zastoupení

Právní rámec musí existovat **před** zapnutím flagu.

## PropertyTransaction (PROTECTED)

| Pole | Klasifikace |
| --- | --- |
| `status` | Sensitive (authenticated parties) |
| `agreedPriceMinor` | **PROTECTED** — audited read/write |

Pravidla:

1. Public DTO má jen `hasAgreedPrice`, nikdy částku
2. `getProtectedAgreedPrice` / `setProtectedAgreedPrice` zapisují `PropertyTransactionAccessLog` **bez hodnoty ceny**
3. `stripProtectedTransactionFields` před logy / analytics
4. `sensitivityClass = PROTECTED` default

## Kódová mapa

| Oblast | Path |
| --- | --- |
| Feature flags | `src/config/feature-flags.ts` |
| Workflow | `src/domains/professional-services/workflow.ts` |
| Partners | `src/domains/professional-services/partners.ts` |
| Transactions | `src/domains/professional-services/transactions.ts` |
| Migrace | `prisma/migrations/20260721080000_professional_services/` |

## Testy

`src/domains/professional-services/professional-services.test.ts`
