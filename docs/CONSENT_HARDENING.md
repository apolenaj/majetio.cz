# Consent Hardening — Majetio

**Datum:** 2026-07-22  
**Účel:** Zpevněná pravidla souhlasů (CMP, účet, nákup, partner share) nad rámec základní správy.  
**Doplňuje:** `docs/CONSENT_MANAGEMENT.md`, `docs/PRIVACY_ARCHITECTURE.md`

---

## 1. Systémy souhlasu (dual-write fáze)

| Systém | Použití | Stav |
| --- | --- | --- |
| `Consent` + `ConsentVersion` | Account TERMS/PRIVACY/MARKETING, purchase TERMS, legacy handoff | Aktivní |
| `ConsentRecord` | Purpose ledger: cookies, `PARTNER_DATA_SHARE`, legal | Preferovaný pro nové purpose flows |
| Cookie JSON (`majetio_cookie_consent`) | CMP client state | Sync do `ConsentRecord` `COOKIE_*` |

**Deprecation:** `HYPOTEKAJASNE_HANDOFF` — nahrazuje `MORTGAGE_LEAD_DATA_TRANSFER` / `PARTNER_DATA_SHARE`. Nový kód nesmí přidávat granty jen na deprecated typ.

---

## 2. Cookie CMP (Privacy-by-Default)

| Kategorie | Default | Blokace před souhlasem |
| --- | --- | --- |
| Necessary | vždy on | N/A |
| Preferences | off | Preferenční cookies |
| Analytics | off | Product telemetry (`consent-gate.ts`) |
| Marketing | off | Marketing events / pixels |

UI (`ConsentBanner`):

- **Odmítnout nepovinné** / **Nastavit** / **Přijmout vše** — stejná váha
- Žádné předzaškrtnuté analytics/marketing
- Policy version: `COOKIE_POLICY_VERSION` (`2026-07-22`)
- Visitor: `majetio_consent_vid`

Server actions: `acceptAllCookiesAction`, `rejectOptionalCookiesAction`, `saveCookieConsentAction`.

---

## 3. Účely (`ConsentPurpose`)

| Purpose | Význam |
| --- | --- |
| `COOKIE_NECESSARY` | Technicky nutné |
| `COOKIE_PREFERENCES` | Locale/market UI |
| `COOKIE_ANALYTICS` | Agregovaná analytika |
| `COOKIE_MARKETING` | Kampaně / remarketing |
| `MARKETING_COMMUNICATION` | Email/marketing komunikace |
| `PARTNER_DATA_SHARE` | Předání dat pojmenovanému příjemci |
| `LEGAL_TERMS` / `LEGAL_PRIVACY` | Účetní právní granty |

Každý `ConsentRecord`: `user` nebo `visitorId`, `purpose`, `recipient?`, `sharedScope?`, `version`, timestamps, `granted` / revoke.

---

## 4. Partner share — tvrdé kontroly

`assertPartnerShareConsent`:

1. Příjemce **nesmí** být prázdný ani generic (`partneři` / `partners`).
2. `sharedScope` **nesmí** být prázdný — field-level allowlist.
3. UI: `DataSharingPreview` + explicitní checkbox před odesláním.
4. Zápis `Consent` + `ConsentRecord`; audit + analytics `consent` events.
5. CTA click **nikdy** neodesílá data automaticky.

HypotekaJasne flow: preview → souhlas → create lead → signed submit.

---

## 5. Nákup vs. marketing (oddělení)

| Pravidlo | Implementace |
| --- | --- |
| Nákup vyžaduje TERMS | `acceptPurchaseTerms: z.literal(true)` |
| Marketing není v checkoutu | `acceptMarketing` / `marketingOptIn` = `z.never()` |
| Metadata | `marketingBundled: false`, `orderId`, `productKey` |
| Správa marketingu | Jen `/ucet/soukromi` / notification prefs (default marketing **false**) |

Transakční emaily **nevyžadují** marketing consent (`docs` transactional policy).

---

## 6. Registrace a account defaults

- TERMS + PRIVACY povinné, nepředzaškrtnuté
- Marketing nepředzaškrtnutý
- `UserProfile.notifyMarketing*` default `false`
- Transakční notifikace default `true` (bez FP částek v těle)

---

## 7. Revokace a audit

| Akce | Efekt |
| --- | --- |
| Withdraw v Privacy Center | `revokedAt`, `granted: false`, audit `consent.revoke` |
| Reject cookies | Optional categories false; analytics gate off |
| Soft erasure účtu | Status + FP wipe; consent ledger dle legal hold |

Audit meta: bez raw PII dumpů; recipient + purpose + version stačí.

---

## 8. Inventář citlivých consent-related polí

| Úložiště | Pole | Riziko |
| --- | --- | --- |
| `ConsentRecord.sharedScope` | Seznam sdílených FP/kontakt fields | Vysoké — minimal scope |
| `Consent.metadata` | orderId, source | Střední |
| Cookie body | analytics/marketing flags | Střední |
| Export payload `consents` | Historie | Vysoké — jen owner download |

---

## 9. Retence souhlasů

- Uchovávat po dobu trvání vztahu + dobu nutnou k důkazu zákonnosti zpracování.
- Po hard delete účtu: anonymizovat vazbu na uživatele dle `ACCOUNT_RETENTION` (audit hash); purpose logy dle counsel.
- Cookie: Max-Age ~400 dní; změna `COOKIE_POLICY_VERSION` vynutí nový banner.

---

## 10. Testovací scénáře (povinné)

1. Reject non-essential → cookie persisted → analytics events blocked  
2. Partner handoff bez recipient/scope → server reject  
3. Checkout s marketing field → schema fail  
4. Reconsent po bump policy version  

E2E: `e2e/privacy/cookie-consent.spec.ts`, account privacy specs.

---

## 11. Související

- `docs/PRIVACY_HARDENING.md`
- `docs/LEGAL_DOCUMENT_ARCHITECTURE.md`
- `docs/CONSENT_MANAGEMENT.md`
- `src/lib/analytics/consent-gate.ts`
