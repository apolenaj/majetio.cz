# Privacy Hardening — Majetio

**Datum:** 2026-07-22  
**Účel:** Inventář PII, citlivá DB pole, retence, export a mazání.  
**Doplňuje:** `docs/PRIVACY_ARCHITECTURE.md`, `docs/PRIVACY_BY_DEFAULT.md`, `docs/ACCOUNT_RETENTION.md`

---

## 1. Klasifikace dat

| Třída | Popis | Příklady |
| --- | --- | --- |
| **Public** | Indexovatelné, bez PII | Veřejný listing slug, asking price |
| **Account PII** | Identifikuje osobu | Email, jméno, IP v auditu |
| **Financial (FP)** | Financial Passport / money fields | Příjem, závazky, equity (CZK / minor) |
| **Lead PII** | Mortgage / marketplace lead | Telefon, email leadu, mortgage ints |
| **Auth secrets** | Credentials | `passwordHash`, reset tokens |
| **Consent ledger** | Účelové souhlasy | `ConsentRecord`, cookie state |
| **Ops / audit** | Bezpečnostní stopy | `AuditLog` (redacted meta) |

---

## 2. Inventář PII (osobní údaje)

### Účet (`User` / profil)

| Pole / oblast | Účel | Poznámka |
| --- | --- | --- |
| `email` | Login, transakční mail | Primární identifikátor |
| `name` | Display | Volitelné |
| `email` change tokens | Ověření změny | Jednorázové, hashované kde platí |
| `deletionRequestedAt`, `accountStatus` | Soft erasure | `DELETION_REQUESTED` |
| Session / Auth.js | Autentizace | HttpOnly cookies |

### Financial Passport (`FinancialProfile`, `UserMarketProfile`, passport state)

| Pole | Citlivost |
| --- | --- |
| `monthlyIncomeCzk` / `monthlyIncomeMinor` | Vysoká |
| `monthlyLiabilitiesCzk` / `…Minor` | Vysoká |
| `availableEquityCzk` / `…Minor` | Vysoká |
| `equityPercent`, `maxBudgetMinor` | Vysoká |
| `financingMode`, `employmentType`, `creditScoreBand` | Střední–vysoká |
| Goal, regions, property prefs | Střední (preferenční) |

**Nesbíráme (policy):** rodné číslo, adresa bydliště, zaměstnavatel jako payroll identifikátor.  
**Forbidden without justification** (`policy-registry`): `taxResidenceCountry`, `nationalIdNumber`, `passportNumber`, `fullBankAccountIban`, `exactEmployerPayroll`.

Client Components (non-edit): používat `toClientSafePassportSummary` — **bez přesných CZK**.

### Leady

| Pole | Retence viz §4 |
| --- | --- |
| Email, telefon | PII — redakce po expiraci |
| Mortgage financial ints | Citlivé — redakce |
| Partner snapshot | Immutable context; kopie u partnera Majetio nemaže |

### Technické / CMP

| Položka | Účel |
| --- | --- |
| `majetio_cookie_consent` | Stav CMP |
| `majetio_consent_vid` | Visitor ID pro anonymní ledger |
| `AuthRateLimit.key` | ip:email hint — neukládat heslo |
| `AuditLog.ip`, `userAgent` | Bezpečnost |

### Platby

Order / entitlement vazby na `userId`; platební secrets jen server env (`PAYMENTS_*`). Částky objednávky ≠ FP passport.

---

## 3. Citlivá pole — ochranná pravidla

| Kontrola | Pravidlo |
| --- | --- |
| Admin FP | Default **maskovaný**; reveal = permission + step-up + audit `admin.financial_passport.read` |
| Logger | Redakce password/token/FP keys (`logger.ts`) |
| Email | Transakční tělo **bez** FP částek — jen deep link |
| CSV export | Formula-injection escape |
| Cache | Private zones `no-store` (žádné CDN sdílení profilů/leadů) |
| RSC → client | Zakázané serializovat secret FP keys do veřejného HTML |

---

## 4. Retence (uchovávání)

### Účet

| Stav | Chování |
| --- | --- |
| Soft request | `softRequestAccountErasure`: `deletionRequestedAt`, `accountStatus: DELETION_REQUESTED`, null FP + market money fields; audit `privacy.soft_erasure.requested` |
| Hard delete | Password + email confirm → cascade favourites/comparisons/notes/searches/alerts; audit zůstává anonymizovaný (`emailHash`) — `docs/ACCOUNT_RETENTION.md` |

### Mortgage lead (`docs/MORTGAGE_LEAD_RETENTION.md`)

| Konstanta | Hodnota | Význam |
| --- | --- | --- |
| `MORTGAGE_LEAD_DEFAULT_RETENTION_YEARS` | **5** | Bez partner submit |
| `MORTGAGE_LEAD_ACTIVE_RETENTION_YEARS` | **3** | Po partner submit |
| `MORTGAGE_LEAD_AUDIT_RETENTION_YEARS` | **7** | Metadata / audit |

Pole: `retentionExpiresAt`, `piiRedactedAt`, `deletionRequestedAt`.  
Po redakci: clear email/phone + financial ints; partner copy zůstává u partnera.

### Consent / export tokeny

| Entita | Retence |
| --- | --- |
| `Consent` / `ConsentRecord` | Po dobu účtu + zákonné prokázání souhlasu; revoke nastaví `revokedAt` |
| `PrivacyExportToken` | TTL **15 min**; one-time `CONSUMED` / `EXPIRED` |
| Cookie consent | Až 400 dní Max-Age; re-prompt při změně policy version |

### Audit

Append-oriented `AuditLog` — ne mazat kvůli „úklidu PII“ bez legal hold politiky; meta sanitizovat (`sanitizeAuditMeta`).

---

## 5. Export

1. Uživatel v Privacy Center požádá o export (JSON/CSV).
2. Server vytvoří `PrivacyExportToken` (hash, TTL 15 min).
3. Klient `POST /api/account/privacy-export` s tokenem (session required).
4. Odpověď: soubor + `Cache-Control: no-store`; token spotřebován.
5. **Žádná** veřejná URL s payloadem.

CSV: `escapeCsvCell` (formula injection).  
Obsah: účet, profil, FP, preference, consents, favourites, analyses, comparisons, leads — scope vlastního `userId`.

---

## 6. Mazání — rozhodovací strom

```text
Uživatel žádá výmaz
  → Soft erasure (okamžitě omezí FP + status)
  → (Volitelně) Hard delete po re-auth
Lead retence job
  → Redakce PII polí po retentionExpiresAt
Ops legal hold
  → Nesmazat audit / dispute records
```

---

## 7. Testovací a release gate

- `docs/LEGAL_REVIEW_CHECKLIST.md`
- E2E: `e2e/privacy/*`
- Unit: soft erasure, consent-gate, client-safe passport

---

## 8. Související

- `docs/CONSENT_HARDENING.md`
- `docs/PRIVACY_BY_DEFAULT.md`
- `docs/FINANCIAL_PASSPORT.md`
- `docs/MORTGAGE_LEAD_RETENTION.md`
