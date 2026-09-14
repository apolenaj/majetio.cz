# Trust Architecture — Majetio

**Datum:** 2026-07-22  
**Účel:** Definovat tok důvěryhodnosti od surových dat po uživatelské rozhodnutí.  
**Kód:** `src/content/trust.ts`, `src/components/trust/*`, `src/content/methodology/hub.ts`, `/metodika`, `/zdroje-dat`, `/duvera-a-bezpecnost`

---

## 1. Princip

Majetio **neprodává jistotu**. Produkt spojuje nabídky, modelované odhady a uživatelské předpoklady tak, aby uživatel viděl:

1. odkud data pocházejí,
2. jak jsou stará,
3. jak spolehlivý je výstup,
4. jaká metodika a omezení platí,
5. že finální rozhodnutí zůstává na něm.

Zakázané fráze (false certainty): „Skutečná hodnota je“, „Přesná hodnota“, „Garantovaná hodnota“, „Skutečná cena nemovitosti“.  
Preferované: „Modelovaný odhad“, „Orientační rozpětí“, „Nabídková cena“.

---

## 2. Trust flow (povinný řetězec)

```text
Data → Zdroje → Aktuálnost → Spolehlivost (Confidence)
  → Metodika → Omezení → Uživatelské rozhodnutí
```

Každá veřejná prezentace metriky (odhad, výnos, skóre, hypoteční indikace) musí být sledovatelná po tomto řetězci. Pokud některý článek chybí, UI musí degradovat (nižší confidence / `insufficient` / skrytí střední hodnoty).

### 2.1 Data

| Vrstva | Příklady | Pravidlo |
| --- | --- | --- |
| Nabídková | listing price, dispozice, m², lokalita | Označit jako nabídku, ne realizaci |
| Registr / statistika | agregáty dle trhu | Jen v rozsahu licence a trhu |
| Partner | hypoteční nabídky (cache + TTL) | Zobrazit platnost / stale stav |
| Uživatel | Financial Passport, scénářové vstupy | Oddělit od „zdrojového záznamu“ |
| Odvozené | NOI, IRR, Majetio Score, modelovaný odhad | Nikdy nepřebít zdrojový záznam bez badge |

### 2.2 Zdroje (`DataSourceKind`)

| Kind | Význam | UI |
| --- | --- | --- |
| `source_record` | Záznam ze zdroje (listing / feed) | Provenance badge |
| `majetio_estimate` | Modelovaný odhad Majetio | Explicitně „odhad“ |
| `model_scenario` | Výpočet ze scénáře / předpokladů | Vázáno na uživatelské vstupy |
| `user_provided` | Zadal uživatel | Nikdy prezentovat jako tržní fakt |
| `analyst_verified` | Interně ověřeno (vzácné) | Vyžaduje auditní stopu |

Veřejný katalog: `/zdroje-dat` → `src/content/data-sources/public-catalog.ts`.  
Interní licenční klíče, ID smluv a ceníky partnerů se **nezveřejňují**.

### 2.3 Aktuálnost (Freshness)

- Listings: continuous–daily + `lastSeenAt` / last observed.
- Location aggregates: denní / batch job (`location:aggregate`, anomaly check).
- Mortgage partner: cache + TTL; při překročení TTL označit jako stale.
- User passport: platné od posledního uložení vlastníkem.
- Engine output: platné od posledního přepočtu se stejnými vstupy.

Admin monitoring: `/admin/freshness`, `evaluatePropertyFreshness`.  
Pravidlo: **stará data se nesmí vizuálně tvářit jako aktuální** (datum / „naposledy viděno“ povinné u kritických metrik).

### 2.4 Spolehlivost (Confidence)

UI úrovně: `high` | `medium` | `low` | `insufficient`  
(`toConfidenceLevel` mapuje doménové `HIGH`/`MEDIUM`/`LOW`/`INSUFFICIENT`).

| Stav | Chování |
| --- | --- |
| `high` / `medium` | Zobrazit rozpětí + metodický odkaz |
| `low` | Zobrazit s výrazným upozorněním na omezení |
| `insufficient` | **Neinventovat střední hodnotu**; zobrazit důvod (málo comps / chybí data) |

Confidence musí být odvozena z kvality vstupů (počet comps, coverage trhu, stáří, konzistence), nikoli z marketingového cíle.

### 2.5 Metodika

Canonical hub: `/metodika` (ISR 24h). Sekce mimo jiné:

- `jak-funguje-majetio`
- `odhad-hodnoty`
- `investicni-vypocty`
- `hypotecni-vypocty`
- `arv`, `maximum-offer`, `scoring`
- `ai-a-vysvetlitelnost`

Každá sekce: definice → vstupy → zdroje → limity.  
UI odkazy: `METHODOLOGY_HREFS` v `src/components/trust/types.ts`.

### 2.6 Omezení (Do / Don’t)

**Majetio dělá**

- propojuje nabídky s modelovanými odhady, výnosem a rizikem,
- ukazuje provenance a nízkou spolehlivost,
- počítá indikativní metriky z uživatelských předpokladů,
- předává data partnerovi jen po účelovém souhlasu.

**Majetio nedělá**

- realitní zprostředkování,
- znalecké / závazné ocenění,
- právní, daňové ani investiční poradenství,
- schvalování hypotéky ani bankovní garance,
- tvrzení o „skutečné hodnotě“ — pouze modelovaný odhad + nabídková cena.

### 2.7 Uživatelské rozhodnutí

Produkt končí u **rozhodovací podpory**, ne u příkazu k akci.

Povinné UI signály před kritickou akcí (handoff, nákup, hluboká analýza):

1. co je fakt / odhad / scénář,
2. confidence + freshness,
3. odkaz na metodiku / zdroje,
4. disclaimer kontextu (`valuation` | `financing` | `yield` | `location` | `general`).

Finální „koupit / nechat / financovat“ je vždy na uživateli (případně na jeho poradci / bance).

---

## 3. Vrstvy ceny (povinné oddělení)

| Vrstva | Název | Smí se mísit? |
| --- | --- | --- |
| 1 | Nabídková cena (asking) | Ne — základ Offer / SEO |
| 2 | Modelovaný odhad (rozpětí) | Ne jako „cena nemovitosti“ |
| 3 | Scénář / předpoklad uživatele | Ne jako tržní fakt |

Sponsored listing **nesmí** ovlivnit Majetio Score, valuaci, riziko ani organické řazení (`docs/SPONSORED_LISTINGS.md`).

---

## 4. AI v trust řetězci

- AI **sumarizuje** a vysvětluje; **není source of truth**.
- AI **negeneruje** právní fakta, závazné ocenění ani falešné AggregateRating.
- Výstup AI musí být označen a odkazovat na metodiku (`/metodika/ai-a-vysvetlitelnost`).

Viz `docs/CONTENT_TRUST_STANDARD.md`.

---

## 5. Veřejné povrchy

| Route | Role |
| --- | --- |
| `/duvera-a-bezpecnost` | Trust & security narrative |
| `/metodika`, `/metodika/[section]` | Metodika |
| `/zdroje-dat` | Transparentnost zdrojů |
| `/o-nas` | Do/Don’t + identita provozovatele |
| `/slovnik` | Termíny (LTV, RPSN, NOI, IRR, …) |
| `/partneri` | Partneři odděleně od organiky |

---

## 6. Související dokumenty

- `docs/DATA_SOURCE_TRANSPARENCY.md`
- `docs/CONTENT_TRUST_STANDARD.md`
- `docs/VALUATION_CONFIDENCE.md` / `docs/VALUATION_METHOD.md`
- `docs/INVESTMENT_ENGINE_LIMITATIONS.md`
- `docs/SPONSORED_LISTINGS.md`
