# Homepage Test Plan — Majetio.cz

## Unit (Vitest)

| Soubor | Co pokrývá |
| --- | --- |
| `src/lib/listing-url.test.ts` | Validace URL, SSRF blokace |
| `src/config/homepage.test.ts` | Experimenty, pořadí sekcí, demo flag, FAQ rozsah |
| `src/lib/analytics/events.test.ts` | Type-safe eventy bez PII |
| `src/app/seo.test.ts` | Sitemap / robots |

Spuštění: `npm test` (pool `threads`).

## E2E (Playwright)

| Soubor | Scénáře |
| --- | --- |
| `e2e/home.spec.ts` | IA, navigace, auth redirect, footer, 404, health, mobile menu |
| `e2e/homepage.spec.ts` | H1, skip link, CTA, URL validace, 320px overflow, no-JS obsah |

Spuštění: `npm run build && npx playwright test` (webServer: `next start` na portu **3010**, `reuseExistingServer: false` — aby se netrefily jiné lokální appky na :3000).

## Manuální checklist

- [ ] 320 / 768 / 1280 / 1920 — žádný horizontální scroll
- [ ] CTA „Analyzovat“ viditelné nad foldem na mobilu
- [ ] Klávesnice: Tab přes hero CTA, quick entry, FAQ
- [ ] Screen reader: regiony demo metrik mají aria-label
- [ ] `prefers-reduced-motion`: fade-in vypnutý
- [ ] Demo badge viditelný u ukázkové analýzy

## CI očekávání

1. `npm run lint`  
2. `npm run typecheck`  
3. `npm test`  
4. `npm run build`  
5. `npx playwright test` (po buildu; Chromium přes `npx playwright install`)

## Známá omezení testů

- Live analytics provider není napojen — assertuje se typová vrstva
- App Router se bez JS v prohlížeči může zaseknout na `loading.tsx`; SSR obsah se ověřuje přes `request.get("/")` HTML
- Playwright musí běžet proti Majetio buildu (port 3010), ne proti jiné appce na :3000
