# Hypoteční lead — konverzní funnel (Prompt 13/10)

## Progresivní profilování

| Fáze | Kdo | Co může | Co potřebuje |
|------|-----|---------|--------------|
| **1. Explore** | Guest | Orientační kalkulačky, scénáře LTV, nabídky sazeb | Nic |
| **2. Contact** | Guest | Odeslat lead specialistovi | E-mail (+ doporučen telefon), explicitní souhlas |
| **3. Account** | Uživatel | Finanční pas, historie leadů, dashboard | Přihlášení / registrace |
| **4. Handoff** | Uživatel | Předání HypotekaJasne s plným kontextem | Souhlas + výběr polí |

## Guest vs. účet

- **Guest** — kalkulačky bez limitu; pro odeslání leadu `loadGuestMortgageHandoffPreview` + 4krokový consent wizard.
- **Účet** — handoff přes `loadHypotekaHandoffPreview` (Finanční pas, deduplikace).
- **Žádné PII v URL** — e-mail nikdy v query parametrech pro propojení leadu.

## Propojení leadu po registraci

Po úspěšném **login/register** (ověření hesla) voláme `linkUnclaimedMortgageLeadsOnAuth()`:

- Lead `userId IS NULL`
- Shoda normalizovaného e-mailu
- Platný souhlas (`consentId` nebo `payload.consentReceipt`)
- **Nikdy** na základě `?email=` v URL

## Immutable snapshot

Při `createLead()` se zapisuje `MortgageLeadContextSnapshot` — kupní cena, odhad, LTV, sazba, splátka, URL nemovitosti. Změna ceny v katalogu nemovitostí historický lead nepřepisuje.

## Soukromí

- Detail leadu pouze `/ucet/financovani/[correlationId]` (auth).
- Audit/analytics bez příjmu, závazků a částek — viz `privacy-guards.ts`.

## Retence

Viz [MORTGAGE_LEAD_RETENTION.md](./MORTGAGE_LEAD_RETENTION.md).
