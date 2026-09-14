# PARTNER_MONETIZATION

Partnerská monetizace (marketplace, revenue share, affiliate).  
**Stav:** za feature flagem **OFF** do Legal/Accounting Review (checklist **214**).

## Gate

| | |
| --- | --- |
| Flag | `PARTNER_MARKETPLACE_ENABLED` |
| Default | `false` (`FEATURE_FLAG_DEFAULTS`) |
| Registry | `LEGAL_REVIEW_REGISTRY` id `partner_marketplace` |
| Marker | `LEGAL_REVIEW` |

Dokud je flag OFF:

- žádné veřejné CTA „partner marketplace“ / revenue-share sliby  
- žádný checkout produkt partner share  
- HypotekaJasne handoff zůstává **consent-based data share**, ne partner fee product

## Zamýšlený model (po review)

```
Partner listing / lead → attribution window → RevenueEvent(MORTGAGE_PARTNER|OTHER)
                                       → partner payout ledger (budoucí)
```

Požadavky před zapnutím:

1. Smlouva s partnerem (fee %, settlement)  
2. Daňový režim / fakturace  
3. Disclosure v UI („partner doporučení“)  
4. Oddělení od organického Score (stejný firewall jako Boost)

## Související

- `docs/MONETIZATION_LEGAL_REVIEW.md`  
- `docs/REVENUE_ATTRIBUTION.md` (MORTGAGE_PARTNER source type)  
- `docs/CONSENT_MANAGEMENT.md` (handoff ≠ marketplace fee)
