# API Security — Majetio

**Datum:** 2026-07-22  
**Účel:** Mantinely pro Route Handlers, Server Actions a DTO.  
**Kód:** `src/lib/security/validate.ts`, `secure-action-pattern.ts`, `src/app/api/**`, domain `*/server/actions.ts`

---

## 1. Povrchy

| Povrch | Auth | Poznámka |
| --- | --- | --- |
| `/api/account/*` | Session | Owner-only; `no-store` |
| `/api/admin/*` | Session + admin role + permission | Middleware + `requireAdminApiPermission` |
| `/api/payments/webhook` | Podpis | Žádné CORS; IP rate limit |
| `/api/integrations/*/webhook` | Podpis | Query string PII zakázán |
| Server Actions | Session uvnitř action | Preferovaný mutační kanál UI |

---

## 2. Povinný pipeline mutace

```text
1. Authenticate (auth / requireUser / requireUserId)
2. Rate limit (kde abuse dává smysl)
3. Validate input (Zod strictObject / limited JSON)
4. Authorize / ownership (assertOwnedRecord / where userId)
5. pickDto / allowlist fields
6. Mutate
7. Audit (citlivé změny)
8. Return safe DTO (žádné passwordHash / raw secrets)
```

Reference: `src/lib/security/secure-action-pattern.ts`.

---

## 3. IDOR

| Pravidlo | Detail |
| --- | --- |
| Owner key | Vždy `session.user.id` |
| Load | `where: { id, userId }` nebo `assertOwnedRecord` |
| Miss | **404** (ne 403 s „existuje cizí resource“) |
| Zakázáno | `z.object({ userId: z.string() })` z client body jako autorita |
| Export / passport | Nesmí přijmout cizí `userId` argument |

Kontrolní testy: `src/lib/security/idor.test.ts`, `src/testing/security/security-stubs.spec.ts`, share IDOR testy v comparisons.

### Cross-user scénář (spec)

Given session A a resource B → mutate id B → žádný write; 404/403.

---

## 4. Vstupní limity

| Kontrola | Limit |
| --- | --- |
| JSON body | 64–256 KiB (`parseLimitedJsonBody`) |
| Pagination `pageSize` | max 50 |
| Text fields | `sanitizePlainText` / max length |
| Upload MIME | `ALLOWED_UPLOAD_MIME_TYPES` only |
| Admin notes | sanitize on create |

`strictObject` odmítá unknown keys (mass-assignment).

---

## 5. Výstupní DTO

- `pickDto` / explicit select — ne `include: everything`.
- Admin FP default masked.
- Chyby v produkci: generická zpráva (`redactErrorForClient`, `adminErrorResponse`).
- Žádné stack / SQL / env v JSON error body.

---

## 6. CORS

| Endpoint | CORS |
| --- | --- |
| First-party same-origin UI | Implicitní same-origin |
| Webhooky | **Žádný** `Access-Control-Allow-Origin`; OPTIONS 405 |
| Public read API (pokud vznikne) | Explicit allowlist originů — nikdy `*` s credentials |

Helpery: `rejectCorsPreflight`, `stripCorsHeaders` (`http-privacy.ts`).

---

## 7. Cache

Privátní API (`/api/account`, `/api/admin`, `/api/payments`, `/api/integrations`):

`Cache-Control: private, no-store, no-cache, max-age=0, must-revalidate`

---

## 8. Webhook API specifika

| Kontrola | Pravidlo |
| --- | --- |
| Signature | HMAC / signed headers; reject → 401 + audit forgery |
| Body size | Cap (payments 256 KiB) |
| Idempotency | Upsert by `eventId` |
| Query PII | Zakázáno (HJ) |
| Secrets | Jen server env |

---

## 9. Admin API

- Middleware: login + admin-zone role.
- Fine-grained: `requireAdminApiPermission("…")`.
- Ops audit na list/create/delete.
- Detail: `docs/ADMIN_API_SECURITY.md`.

---

## 10. Zakázané praktiky

- Důvěřovat `Content-Type` bez MIME allowlist u uploadů.
- Vracet celé Prisma entity do klienta.
- Broad CORS na signed callbacks.
- Logovat Authorization / raw webhook body se signatures v plaintext ops channelech.

---

## 11. Testy

```bash
npm run test:security
npx playwright test e2e/security
```

---

## 12. Související

- `docs/AUTH_SECURITY.md`
- `docs/SSRF_PROTECTION.md`
- `docs/SECURITY_HARDENING.md`
- `docs/AUTHORIZATION.md`
