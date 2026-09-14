# Hypoteční lead — retence a výmaz (Prompt 13/10)

## Právní rámec

Hypoteční leady obsahují citlivé údaje (příjem, závazky, kontakt). Neuchováváme je neomezeně bez důvodu.

## Doby retence (Majetio)

| Stav | Retence PII v Majetio | Poznámka |
|------|------------------------|----------|
| Aktivní lead (workflow běží) | Po dobu zpracování + 5 let od vytvoření | `retentionExpiresAt` při create |
| Partner odeslán | 3 roky od terminálního stavu | Po redakci lze smazat záznam |
| Audit metadata | 7 let | Bez finančních hodnot, jen correlationId |
| Redigovaný lead | Do `retentionExpiresAt`, pak purge | `purgeExpiredMortgageLeadPii()` |

Konstanty: `src/domains/leads/service/retention.ts`

## Odvolání souhlasu (uživatel)

1. Uživatel požádá o redakci / odvolání (`withdrawMortgageLeadConsent`).
2. Majetio rediguje PII v `Lead` + `MortgageLeadProfile`.
3. **Immutable snapshot** zůstává pro interní audit (bez dalšího zobrazení v UI po redakci).
4. **HypotekaJasne / banka** — data u partnera Majetio nesmaže. Uživatel musí kontaktovat partnera.

## UI messaging

Stránka `/ucet/souhlasy` vysvětluje rozdíl mezi výmazem v Majetio a výmazem u banky.

## Technický deletion flow

```
requestMortgageLeadPiiDeletion()
  → Lead.email/phone = null
  → MortgageLeadProfile financial ints = null
  → piiRedactedAt, deletionRequestedAt
  → LeadActivity + AuditLog (bez citlivých hodnot)

purgeExpiredMortgageLeadPii()  [batch job]
  → delete Lead where retentionExpiresAt <= now AND piiRedactedAt set
```

## Indexace a logování

- Citlivá pole **neindexovat** pro full-text / analytics.
- `sanitizeMortgageLeadAuditMeta()` před zápisem do AuditLog.
- `track()` eventy hypotečního funnelu bez CZK a bez e-mailu.
