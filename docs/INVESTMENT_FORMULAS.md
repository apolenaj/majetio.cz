# Investment Formulas

Přesné vzorce, vstupy a interpretace. Zdroj pravdy: `FORMULA_REGISTRY` v1.3.0  
(`src/domains/investment/engine/formulas/registry.ts`).

Konvence:

- Peníze: integer **minor units** (haléře) na wire; vnitřní math = `decimal.js`
- Procenta: **ratio** (`5.4 %` → `0.054`)
- Denominátor výnosů: vždy **Total Acquisition Cost (TAC)**, ne samotná kupní cena (pokud není explicitně jiný yield base ve vstupu)

---

## Total Acquisition Cost

| | |
|--|--|
| **Klíč** | `total_acquisition_cost` |
| **Vzorec** | `TAC = Kupní cena + Náklady na pořízení + Rekonstrukce + Vybavení + Poplatky` |
| **Vstupy** | `purchasePrice` (povinné > 0); ostatní řádky `null` = neuvedeno (≠ 0) |
| **Interpretace** | Plná kapitálová báze investice. Chybějící řádek se do součtu nepočítá a neinventuje se. |

---

## Příjem a NOI

### Potential Gross Income (PGI)

| | |
|--|--|
| **Klíč** | `potential_gross_income` |
| **Vzorec** | `PGI = roční nájem při 100% obsazenosti` (měsíční × 12, pokud je zadán měsíčně) |
| **Vstupy** | `monthlyRent` **nebo** `annualRent` |
| **Interpretace** | Horní hranice hrubého příjmu. `null` = chybí data; `0` = explicitní nula. |

### Vacancy loss / EGI

| | |
|--|--|
| **Klíče** | `vacancy_loss`, `effective_gross_income` |
| **Vzorce** | `Vacancy Loss = PGI × vacancyRate`; `EGI = PGI − Vacancy Loss` |
| **Vstupy** | PGI; `vacancyRate` ∈ [0, 1] (100 % = validní stress) |
| **Interpretace** | Efektivní hrubý příjem po neobsazenosti. |

### Operating expenses (Opex)

| | |
|--|--|
| **Klíč** | `operating_expenses` |
| **Vzorec** | Součet nákladů majitele (správa, údržba, pojištění, daň z nemovitosti, SVJ majitel, platform fees…) |
| **Poznámka** | **SVJ zálohy** se sledují zvlášť a do NOI opex **nepatří**. |
| **Interpretace** | `null` opex → NOI/net yield `insufficient_input`, ne falešná 0. |

### NOI

| | |
|--|--|
| **Klíč** | `noi` |
| **Vzorec** | `NOI = EGI − Opex` |
| **Interpretace** | Čistý provozní výnos **před** debt service a CapEx. Může být záporný. |

---

## Výnosové metriky

### Gross yield (hrubý výnos)

| | |
|--|--|
| **Klíč** | `gross_yield` |
| **Vzorec** | `Hrubý výnos = EGI / TAC` |
| **Interpretace** | Před opex. U `own_use` (vlastní bydlení) → `not_applicable` (ne 0 %). |

### Net yield (čistý výnos)

| | |
|--|--|
| **Klíč** | `net_yield` |
| **Vzorec** | `Čistý výnos = NOI / TAC` |
| **Interpretace** | Hlavní „yield“ metrika Majetio. Denominátor = TAC. |

### Cap rate

| | |
|--|--|
| **Klíč** | `cap_rate` |
| **Vzorec** | `Cap Rate = NOI / Hodnota nemovitosti` |
| **Interpretace** | V year-1 běhu typicky hodnota = TAC. Tržní cap rate z komparativů je mimo tento engine. |

---

## Cash flow a páka

### Unlevered / leveraged CF

| Klíč | Vzorec |
|------|--------|
| `monthly_cash_flow_unlevered` | `NOI / 12` |
| `annual_cash_flow_unlevered` | `NOI` |
| `monthly_cash_flow` | `NOI/12 − měsíční debt service` |
| `annual_cash_flow_leveraged` | `NOI − roční debt service` |

**Interpretace:** Záporný CF je **běžný** výsledek, ne chyba výpočtu (warning `negative_cash_flow`).

### Equity required / LTV

| Klíč | Vzorec |
|------|--------|
| `equity_required` | `TAC − jistina úvěru` (`loan = null` → cash = TAC) |
| `ltv` | `jistina / hodnota` (LTV > 100 % povoleno s warningem) |

### Cash-on-cash (CoC) — ROI family (rok 1)

| | |
|--|--|
| **Klíč** | `cash_on_cash` |
| **Vzorec** | `CoC = roční leveraged CF / equity` |
| **Interpretace** | Jednoroční návratnost vlastního kapitálu. Equity = 0 → nedefinováno. |

> **ROI:** Samostatný `calculateRoi` není. V produktech používáme CoC (rok 1), equity multiple a IRR (horizont). Equity multiple − 1 ≈ kumulativní ROI na horizontu.

### DSCR

| | |
|--|--|
| **Klíč** | `dscr` |
| **Vzorec** | `DSCR = NOI / roční debt service` |
| **Interpretace** | ADS = 0 / cash purchase → `not_applicable` (nikdy Infinity). |

---

## Hypotéka (anuita)

| | |
|--|--|
| **Klíč** | `annuity_payment` |
| **Vzorec** | `M = P × r × (1+r)^n / ((1+r)^n − 1)`; `r = nominální sazba / 12`; `n = roky × 12`. Při `r = 0`: `M = P / n` |
| **Vstupy** | jistina, **nominální** sazba, splatnost ≥ 1 rok |
| **Interpretace** | **APR/RPSN** je jen disclosure, **ne** vstup do splátky. Záporná nominální sazba je matematicky podporována (warning). |

Detail: [MORTGAGE_CALCULATION.md](./MORTGAGE_CALCULATION.md).

---

## Horizont: IRR, equity multiple, payback

| Klíč | Vzorec | Interpretace |
|------|--------|--------------|
| `irr` | `NPV(IRR) = Σ CF_t / (1+IRR)^t = 0` | Roční equity CF řada; může být záporná / nedefinovaná / multi-root |
| `equity_multiple` | `Σ kladných CF / \|počáteční equity\|` | Kolikrát se vrátí equity |
| `payback_period` | Doba do kumulativního CF ≥ 0 | Orientace návratnosti |

Detail: [IRR_MODEL.md](./IRR_MODEL.md).

---

## Break-even

| Klíč | Vzorec |
|------|--------|
| `break_even_occupancy` | `BE occ = (Opex + roční DS) / PGI` |
| `break_even_interest_rate` | Binární hledání sazby, kde CF ≈ 0 |
| `break_even_purchase_price` | `BE cena = NOI / cílový čistý výnos` |

> `break_even_purchase_price` **není** produkt „maximální nabídková cena“ (Prompt 12).

---

## Statusy metrik

| Status | Význam |
|--------|--------|
| `calculated` | Hodnota spočítána |
| `insufficient_input` | Chybí data (např. nájem u rental intent) |
| `not_applicable` | Metrika nedává smysl (DSCR bez úvěru, yield u own-use) |
| `error` | Numerická / validační chyba |

Nikdy nepublikovat `0 %` / `0 Kč` jako náhradu za chybějící vstup.
