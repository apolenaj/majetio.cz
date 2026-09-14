# MARKETPLACE_LEADS

Zpracování a kvalifikace marketplace leadů — striktní oddělení **Inquiry** vs **QualifiedBuyerLead**.

Mortgage / HypotekaJasne leady zůstávají v `docs/MORTGAGE_LEAD_FUNNEL.md` (`Lead` + `MortgageLeadProfile`).

## Inquiry ≠ QualifiedBuyerLead

| | Inquiry | QualifiedBuyerLead |
| --- | --- | --- |
| Účel | Běžná poptávka / zpráva | Produktově kvalifikovaný zájemce |
| Rozpočet / financování | **Zakázáno** | Povinné pásmo + stance |
| FinancialProfile | **Nikdy** | Jen po ACCEPTED + souhlas |
| Agent vidí | Jméno + zprávu | Před accept: anonymizovaný profil |

## Kvalifikační pravidla (centrální)

`src/domains/crm/qualification-rules.ts` · verze `marketplace-qualify.v1`

Všechna tři musí platit:

1. **Ověřený kontakt** — e-mail a/nebo telefon ověřený
2. **Známý rozpočet** — pásmo min/max CZK (ne výpis účtu)
3. **Stav financování** — `CASH` / `MORTGAGE_*` / `MIXED` (ne `UNKNOWN`)

### Diskriminační firewall

`FORBIDDEN_QUALIFICATION_ATTRIBUTES` — age, gender, race, ethnicity, nationality, religion, marital/family status, disability, health, sexual orientation, genetics, biometrics, …  
Tyto atributy se **nesmí** použít ve skóre ani v gatech.

## Privacy vůči agentovi

```
PENDING_AGENT_REVIEW
    → AnonymizedQualifiedProfile
      (rozpočtové pásmo, časová osa, financing stance, badge)
      contactDetailsVisible: false
      fullFinancialProfileVisible: false

ACCEPTED + AGENT_BUYER_PROFILE_SHARE
    → smí kontakt + volitelně FP
```

Consent typ: `AGENT_BUYER_PROFILE_SHARE`  
API: `getAgentLeadView`, `acceptQualifiedBuyerLead`, `markFullProfileRevealed`

## Badge „Kvalifikovaný zájemce“

Komponenta: `src/components/crm/qualified-buyer-badge.tsx`

- Vysvětluje, co systém ověřil (kontakt, rozpočet, financování)
- Explicitní disclaimer: **není garance nákupu** ani bankovního schválení

## Kódová mapa

| Oblast | Path |
| --- | --- |
| Rules | `src/domains/crm/qualification-rules.ts` |
| Privacy DTOs | `src/domains/crm/privacy.ts` |
| Inquiry | `src/domains/crm/inquiry-service.ts` |
| Qualified lead | `src/domains/crm/qualified-buyer-lead-service.ts` |
| Badge | `src/components/crm/qualified-buyer-badge.tsx` |
| Migrace | `prisma/migrations/20260721050000_marketplace_leads/` |

## Testy

`src/domains/crm/marketplace-leads.test.ts`
