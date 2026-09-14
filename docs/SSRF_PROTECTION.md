# SSRF Protection — Majetio

**Datum:** 2026-07-22  
**Účel:** Zabránit server-side request forgery z uživatelských / partnerských URL.  
**Kód:** `src/lib/security/ssrf.ts`, `src/lib/listing-url.ts`, market-alert `dispatchToWebhook`

---

## 1. Riziko

Útočník dodá URL (`https://127.0.0.1/…`, cloud metadata, interní hostname). Server ji `fetch`ne a:

- uniknou cloud credentials (IMDS),
- oskenují se interní služby,
- obcházejí se firewall pravidla.

**Pravidlo:** žádný `fetch(userInput)` bez `assertSafeOutboundUrl` / `safeFetch`.

---

## 2. Kontroly (`assertSafeOutboundUrl`)

| Kontrola | Výsledek při fail |
| --- | --- |
| Prázdná / > maxLength (default 2048) | `invalid` |
| Neparsovatelná URL | `invalid` |
| Ne-HTTPS (default `httpsOnly`) | `invalid` (výjimka: explicit `allowHttpInDev` mimo produkci) |
| Userinfo v URL (`user:pass@`) | `blocked` |
| Localhost / `.localhost` / `.local` / `.internal` / `.lan` | `blocked` |
| `127.0.0.0/8`, `10/8`, `172.16/12`, `192.168/16`, CGNAT `100.64/10` | `blocked` |
| Link-local / metadata (`169.254.169.254`, `metadata.google.internal`, …) | `blocked` |
| IPv6 literály | `blocked` |
| Allowlist suffixes (pokud nastaveno) | `unsupported` mimo seznam |

Hash fragment se odstraňuje.

---

## 3. `safeFetch`

```text
assertSafeOutboundUrl → fetch(url, { redirect: "error", signal: timeout })
```

| Option | Default |
| --- | --- |
| `timeoutMs` | 8000 |
| `allowlistSuffixes` | volitelné; **preferovat** u user-supplied hostitelů |
| `httpsOnly` | true |

Redirect follow je **zakázán** (`redirect: "error"`), aby open redirect neobešel kontrolu na první hop.

---

## 4. Povinné call sites

| Místo | Pravidlo |
| --- | --- |
| Listing URL normalizace | `src/lib/listing-url.ts` + allowlist portálů kde platí |
| Market alert webhooks | `dispatchToWebhook` — nejdřív `assertSafeOutboundUrl`, default `safeFetch` |
| Budoucí user „fetch preview“ | Jen s allowlist + size cap |
| Admin „test webhook URL“ | Stejné SSRF guardy — admin ≠ výjimka pro localhost v produkci |

---

## 5. Allowlist vs. blocklist

| Režim | Kdy |
| --- | --- |
| Block private + HTTPS | Minimum pro partner webhook URL s neznámým hostitelem |
| Allowlist suffixes | Listing portály, známí partneři (`sreality.cz`, …) |
| Zakázáno | „Allow all public IPs“ bez dalšího risk review |

DNS rebinding: i po URL check může IP směřovat jinam — proto redirect error + krátký timeout + ideálně allowlist. Pro high-risk path zvážit resolvaci a re-check IP (budoucí hardening).

---

## 6. Co SSRF modul neřeší

- Inbound webhook authenticity → podpisy (`AUTH`/`API` security).
- XSS v URL query → sanitize / encode při renderu.
- Open redirect v `callbackUrl` → držet relative / same-origin allowlist v auth helpers.

---

## 7. Chybové chování

- Aplikace: neexponovat interní reason útočníkovi nad rámec nutného (`SSRF_BLOCKED:reason` interně / log).
- Market alert: `delivered: false`, `error: SSRF_BLOCKED:…`.
- Log: bez plného interního payloadu; host lze logovat redacted.

---

## 8. Testy

```bash
npx vitest run src/lib/security/security-hardening.test.ts src/testing/security/security-stubs.spec.ts
```

Očekávání:

- `localhost`, `127.0.0.1`, `169.254.169.254`, `10.0.0.5` → blocked
- allowlist mismatch → unsupported/blocked
- `dispatchToWebhook` na `https://127.0.0.1/hook` → nedoručí

---

## 9. Checklist před novým outbound fetchem

- [ ] Vstup je uživatelský / partnerský? → povinný SSRF guard
- [ ] HTTPS only v produkci
- [ ] Allowlist pokud je hostitel známý
- [ ] `redirect: "error"` + timeout
- [ ] Žádný fetch z Edge na metadata IP
- [ ] Test case v Vitest

---

## 10. Související

- `docs/SECURITY_HARDENING.md`
- `docs/API_SECURITY.md`
- `docs/PRIVACY_BY_DEFAULT.md`
