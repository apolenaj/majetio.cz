# Auth Security — Majetio

**Datum:** 2026-07-22  
**Účel:** Mantinely autentizace, session, brute-force a account status.  
**Kód:** `src/lib/auth/*`, `src/middleware.ts`, Auth.js / NextAuth

---

## 1. Poskytovatel a session

- Auth.js (NextAuth) + Prisma adapter.
- Session obsahuje `user.id` a `role` — **server je autorita**.
- Middleware `getToken` chrání `/ucet`, `/onboarding`, `/admin`, `/api/admin`, `/profi`.
- Anonymní přístup na chráněné stránky → redirect `/prihlaseni?callbackUrl=…`.

### Cookie / transport (produkce)

| Požadavek | Pravidlo |
| --- | --- |
| `HttpOnly` | Ano u session |
| `Secure` | Ano na HTTPS |
| `SameSite` | `Lax` (default app) — nepoužívat `None` bez nutnosti |
| `AUTH_SECRET` | Silný secret jen v env |

---

## 2. Rate limiting (login / registrace / reset)

Modul: `src/lib/auth/rate-limit.ts` (Prisma `AuthRateLimit`).

| Parametr | Hodnota |
| --- | --- |
| Window | 15 minut |
| Max failures | **8** |
| Lock | 15 minut |
| Key | typicky `ip` + akce + email (normalizovaný) |

Použití:

- Credentials login (`src/lib/auth/index.ts`): `assertNotRateLimited` + `recordAuthFailure` / `clearAuthFailures`
- Registrace, reset request, reset confirm (`actions.ts`): stejný pattern s oddělenými klíči (`register`, `reset`, `reset-confirm`)

Při dosažení lockoutu: audit `security.auth.failure_burst` s **key hint** (ne raw heslo, ne plný email dump v meta pokud lze hash/hint).

Export alias: `assertLoginRateLimit` v `src/lib/security/rate-limit.ts`.

---

## 3. Hesla

| Pravidlo | Detail |
| --- | --- |
| Hash | Server-side (`hashPassword` / `verifyPassword`) — nikdy plaintext v DB/log |
| Strength | `isPasswordStrongEnough` při změně / registraci |
| Reset | Jednorázový token; rate-limited; email jen deep link (bez FP dat) |
| Change email | Confirm flow + rate limit |

---

## 4. Account status

| Status | Login |
| --- | --- |
| `ACTIVE` | Povoleno |
| `SUSPENDED` | Zamítnuto + audit reason |
| `DELETION_REQUESTED` | Zamítnuto / omezeno dle policy v `auth/index.ts` |

Soft erasure nastavuje `DELETION_REQUESTED` + čistí FP (`docs/PRIVACY_HARDENING.md`).

---

## 5. Role a zóny

| Zóna | Požadavek |
| --- | --- |
| `/ucet` | Přihlášený uživatel |
| `/profi` | Přihlášený broker surface |
| `/admin`, `/api/admin` | `isAdminZoneRole` + permission keys |
| Impersonace | Reason ≥ 12 znaků; nelze admin target; audit start/end |

Detail RBAC: `docs/ADMIN_RBAC.md`, `docs/AUTHORIZATION.md`.

---

## 6. CSRF a Server Actions

- Mutace přes Server Actions / POST s session — ne důvěřovat `userId` z formuláře.
- State-changing GET zakázány.
- Checkout / consent akce vázané na session.

---

## 7. Audit události (auth)

| Action | Kdy |
| --- | --- |
| `auth.login.success` / `auth.login.failure` | Přihlášení |
| `auth.register` | Registrace |
| `auth.password_reset.request` / `.success` | Reset |
| `auth.password_change` | Změna hesla |
| `security.auth.failure_burst` | Lockout threshold |
| `admin.user.impersonate.start` / `.end` | Impersonace |

---

## 8. Zakázané praktiky

- Vracet „user exists“ vs „bad password“ rozdíly, které usnadní enumeraci nad rámec nutného UX (sjednotit messaging kde možné).
- Logovat hesla, reset tokeny v plaintextu, Authorization headery.
- Vypínat rate limit v produkci.
- Přeskočit middleware matcher pro `/api/admin`.

---

## 9. Testy

- Stub: `src/testing/security/security-stubs.spec.ts` (rate-limit source contracts)
- E2E: `e2e/account-auth.spec.ts`, `e2e/security/access-denied.spec.ts`

---

## 10. Související

- `docs/SECURITY_HARDENING.md`
- `docs/API_SECURITY.md`
- `docs/ROUTE_ACCESS_MATRIX.md`
