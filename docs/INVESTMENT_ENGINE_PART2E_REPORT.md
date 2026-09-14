# Investment Engine — Part 2/E Závěrečný Report (DoD)

**Datum:** 2026-07-20  
**Scope:** Prompt 11 Parts 2/A–2/E (UI kalkulačka, scénáře, edge cases, NFR/testy, dokumentace)  
**Mimo scope (Prompt 12):** rekonstrukční CapEx engine, ARV, maximální nabídková cena

---

## 1. Architektura a verze

### 1.1 Architektura

```
UI (calculators, hooks)
    ↓ AssumptionSet + Snapshot
service/run-calculation (orchestrace, validation, partial metrics)
    ↓
engine/ (pure)
  calculations · scenarios · risk · validation · formulas
    ↓
DTO envelope → optional Prisma persist (AnalysisScenario + InvestmentCalculation)
```

| Vrstva | Odpovědnost |
|--------|-------------|
| `engine/` | Pure math, formula registry, scénáře, risk, domain validation |
| `service/` | Merge, hash/cache, partial results, persistence adapter |
| `hooks/` | Ephemeral přepočet, view-modely (bez vzorců) |
| `server/` | Auth-bound save/clone, IDOR |
| `observability/` | Latency, missing-input rate (bez PII/CZK) |
| `plugins/tax` | Stub — pre-tax only |

### 1.2 Verze

| Komponenta | Verze |
|------------|-------|
| Investment Engine | **`0.4.0-risk`** |
| Formula registry | **`1.3.0`** |
| Assumption config | **`assumptions.v2026.07`** |
| Result schema | `1.0.0` |
| Input schema | `1.0.0` |

Historické řádky mrazí engine + formula (+ assumption) verze; cache klíč = SHA-256(`snapshot` − timestamps + `assumptionSet` + `scenarioType` + verze).

---

## 2. Podporované scénáře, vstupy, výstupy

### 2.1 Engine kinds

`long_term_rental` · `cash_purchase` · `short_term_rental` · `flip` · `renovation_rent`

### 2.2 Persistované typy

`LONG_TERM_RENTAL` · `CASH_PURCHASE` · `SHORT_TERM_RENTAL` · `FLIP` · `RENOVATION_RENT` · `BASE_METRICS`

### 2.3 Variant / profile

- Variant: Conservative / Realistic / Optimistic / Custom  
- Profile: USER (private) · ANALYST (staff) · SYSTEM_NEUTRAL (public read)

### 2.4 Vstupy (shrnutí)

Nemovitost · TAC řádky · nájem/vacancy/opex · úvěr (null/0/>0) · nominální sazba · splatnost · růsty · hold years · intent (`rental` / `own_use` / `flip`)

### 2.5 Výstupy

`status`, `availableMetrics`, `unavailableMetrics`, `resultWarnings`, `issues`, `acquisition`, zmrazené verze, `inputHash`

---

## 3. Definice metrik

| Metrika | Definice v Majetio |
|---------|-------------------|
| **Gross yield** | EGI / TAC |
| **Net yield** | NOI / TAC |
| **NOI** | EGI − Opex (bez debt service; SVJ zálohy mimo) |
| **Cap rate** | NOI / hodnota (year-1 ≈ TAC) |
| **CF (leveraged)** | NOI − roční DS; měsíčně NOI/12 − měsíční DS |
| **CoC** | Roční leveraged CF / equity (ROI rok 1) |
| **ROI** | Není samostatný klíč; CoC (rok 1), EM−1 / IRR (horizont) |
| **IRR** | Kořen NPV equity CF řady = 0 |
| **Equity multiple** | Σ kladných CF / \|equity\| |
| **DSCR** | NOI / roční DS; cash → N/A |
| **Break-even occupancy** | (Opex + roční DS) / PGI |

Detail: [INVESTMENT_FORMULAS.md](./INVESTMENT_FORMULAS.md).

---

## 4. Hypotéky a akviziční náklady

### Hypotéka

- Anuita z **nominální** sazby; APR jen disclosure  
- 0 % → P/n; záporná sazba podporována + warning  
- Amortizace → ending balance ≈ 0; property-based invarianty  

### Akvizice (TAC)

`Kupní cena + pořízení + rekonstrukce + vybavení + poplatky`  
`null` řádek ≠ 0; chybějící kupní cena → FAILED / insufficient_data

---

## 5. Data, oprávnění, persistence

| Téma | Chování |
|------|---------|
| **IDOR** | `canRead`/`canWrite`; save vyžaduje session; USER share flag ignorován |
| **Cache** | `InvestmentCalculation` dle `inputHash` + `engineVersion`; ephemeral propertyId ≠ listing id |
| **Public DTO** | SYSTEM_NEUTRAL čitelný anonymně; USER nikdy veřejný share v Part 2/B |
| **SEO** | `/ucet`, `/analyza/` noindex (robots + layout metadata) |
| **Analytics** | Typed events bez CZK/PII |
| **Telemetry** | status, latency, missing-input rate |

---

## 6. Definition of Done — validace

| Požadavek | Stav | Důkaz |
|-----------|------|-------|
| Oddělený pure engine | ✅ | `src/domains/investment/engine/` |
| Versioning engine + formulas | ✅ | `0.4.0-risk` / `1.3.0`, freeze v DB |
| Akviziční náklady (TAC) | ✅ | `acquisition-cost.ts` + metriky |
| Výpočet hypotéky (nominální anuita) | ✅ | `financing.ts`, `amortization.ts` |
| CF modely unlevered/leveraged | ✅ | `cash-flow.ts`, docs |
| Typy scénářů | ✅ | 5 kinds + persist typy + variants |
| Chybějící data ≠ fake 0 | ✅ | partial metrics, Part 2/C |
| Edge cases (LTV, vacancy, IRR, DSCR N/A) | ✅ | validation + edge-cases tests |
| Unit + golden + integration testy | ✅ | 14 test files / 113 tests |
| Sensitivity in-memory (no N+1) | ✅ | pure risk + NFR test |
| Observability | ✅ | `observability/telemetry.ts` |
| Interní dokumentace | ✅ | tato sada `docs/INVESTMENT_*.md` |
| Veřejná metodika | ✅ | `/jak-pocitame-vynos` |
| **Ne** ARV / reno CapEx / max bid | ✅ | explicit limitations + Preparing pages |
| Lint / typecheck / test | ✅ test 113; typecheck OK; lint investment auto-fixed | §8 |

---

## 7. Změněné a vytvořené soubory (Prompt 11 / investment)

### Dokumentace (Part 2/E) — nové

- `docs/INVESTMENT_ENGINE.md`
- `docs/INVESTMENT_FORMULAS.md`
- `docs/INVESTMENT_ASSUMPTIONS.md`
- `docs/INVESTMENT_SCENARIOS.md`
- `docs/CASH_FLOW_MODEL.md`
- `docs/MORTGAGE_CALCULATION.md`
- `docs/IRR_MODEL.md`
- `docs/SENSITIVITY_ANALYSIS.md`
- `docs/STRESS_TESTING.md`
- `docs/INVESTMENT_ENGINE_LIMITATIONS.md`
- `docs/INVESTMENT_ENGINE_TEST_PLAN.md`
- `docs/INVESTMENT_ENGINE_PART2E_REPORT.md` (tento report)

### Veřejný obsah

- `src/content/yield-methodology.ts`
- `src/app/(public)/jak-pocitame-vynos/page.tsx` (nahrazen stub)
- `src/app/(public)/metodika/page.tsx` (odkaz na metodiku výnosu)

### Doména (Parts 2/A–2/D, souhrn)

- `src/domains/investment/**` (engine, service, hooks, server, scenarios, observability, validation, fixtures, tests)
- `src/config/investment-assumptions.ts`
- `src/components/calculators/**`
- `src/app/(tools)/analyza/layout.tsx` (noindex)
- `src/app/(account)/layout.tsx` (noindex metadata)
- `src/lib/analytics/events.ts` (investment events)

---

## 8. Výsledky testů

Poslední plný běh domény (Part 2/D validace):

```
Test Files  15 passed (15)
Tests       113 passed (113)
```

Zahrnuje mimo jiné:

- Golden G1 + mortgage + IRR±  
- Edge cases (DSCR N/A, own-use yields, LTV>100, vacancy 100 %)  
- Sensitivity monotónnost + property-based amortizace  
- Precision 1 mld. / haléře + JSON DTO round-trip  
- Auth role matrix  
- Telemetry + analytics privacy  
- IDOR source contracts (`idor.test.ts`)  
- SEO robots `/analyza/`

**DoD CI checklist (stav 2026-07-20):**

| Check | Výsledek |
|-------|----------|
| `vitest run src/domains/investment` | **113/113 passed** (15 files) |
| `npm run typecheck` | **OK** (opraven export `CalculationMetric` + BigInt literal) |
| `npm run lint` (investment) | type-only import / prefer-const / unused import — opraveno; repo-wide lint může mít starší warningy mimo investment (valuation) |

```bash
npm test -- src/domains/investment
npm run typecheck
npm run lint
```

---

## 9. Známá omezení

1. **Pre-tax only** — tax plugin stub  
2. **Žádný ARV / CapEx estimator / max bid produkt** (Prompt 12)  
3. IRR multi-root → warning, jeden kořen  
4. Předpoklady růstu ≠ forecast  
5. USER public share vypnuto  
6. Flip/reno berou uživatelské sale/reno vstupy  

Detail: [INVESTMENT_ENGINE_LIMITATIONS.md](./INVESTMENT_ENGINE_LIMITATIONS.md).

---

## 10. Připraveno pro Prompt 12 + doporučený další krok

### Hook points již v enginu

| Hook | Stav |
|------|------|
| TAC řádek `renovation` | ✅ vstup |
| Scénář `flip` / `renovation_rent` | ✅ s user sale/reno |
| `break_even_purchase_price` | ✅ risk helper (≠ product max bid) |
| Tax plugin interface | ✅ stub ready |
| Assumption config versioning | ✅ |

### Prompt 12 by měl dodat

1. Renovation CapEx estimator (oddělený domain engine)  
2. ARV model + confidence  
3. Maximální nabídková cena (veřejná kalkulačka + metodika)  
4. Napojení na Decision Cockpit bez falešných čísel do té doby  

### Doporučený další krok (hned)

1. CI: `typecheck` + `lint` + investment tests na PR  
2. Zaindexovat nové docs do interní navigace / README odkazy (hotovo v `INVESTMENT_ENGINE.md`)  
3. QA copy review veřejné stránky `/jak-pocitame-vynos` (tone of voice)  
4. Teprve poté Prompt 12 — ARV / reno / max bid  

---

## 11. Odkazy na dokumentaci

| Dokument | Účel |
|----------|------|
| [INVESTMENT_ENGINE.md](./INVESTMENT_ENGINE.md) | Přehled architektury |
| [INVESTMENT_FORMULAS.md](./INVESTMENT_FORMULAS.md) | Vzorce |
| [INVESTMENT_ASSUMPTIONS.md](./INVESTMENT_ASSUMPTIONS.md) | Předpoklady |
| [INVESTMENT_SCENARIOS.md](./INVESTMENT_SCENARIOS.md) | Scénáře |
| [CASH_FLOW_MODEL.md](./CASH_FLOW_MODEL.md) | CF |
| [MORTGAGE_CALCULATION.md](./MORTGAGE_CALCULATION.md) | Hypotéka |
| [IRR_MODEL.md](./IRR_MODEL.md) | IRR |
| [SENSITIVITY_ANALYSIS.md](./SENSITIVITY_ANALYSIS.md) | Citlivost |
| [STRESS_TESTING.md](./STRESS_TESTING.md) | Stress |
| [INVESTMENT_ENGINE_LIMITATIONS.md](./INVESTMENT_ENGINE_LIMITATIONS.md) | Omezení |
| [INVESTMENT_ENGINE_TEST_PLAN.md](./INVESTMENT_ENGINE_TEST_PLAN.md) | Test plán |

**Veřejně:** [https://majetio.cz/jak-pocitame-vynos](/jak-pocitame-vynos) (route)
