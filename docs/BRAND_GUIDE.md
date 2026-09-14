# Brand Guide — Majetio

Kompletní vizuální a komunikační identita.  
Související: `TONE_OF_VOICE.md`, `LOGO_EVALUATION.md`, `BRAND_DECISIONS.md`.

> Vizuální kontrola podobnosti nenahrazuje profesionální rešerši ochranných známek a právní posouzení.

---

## 1. Podstata značky

Majetio je **analytická realitní platforma**. Nepomáhá jen najít inzerát — pomáhá rozhodnout, zda se konkrétní nemovitost vyplatí koupit: hodnota, výnos, náklady, rizika, financování, nabídková cena, vhodnost strategie.

Spojuje čtyři světy: **nemovitosti · finance · data · dlouhodobé budování majetku**.

### Pozice

Moderní evropský proptech: důvěryhodný, analytický, profesionální, srozumitelný, prémiový, klidný, transparentní.

**Není:** levný inzertní web, klasická RK, agresivní prodej, crypto/trading, kopie banky ani Sreality/Zillow.

**Hlavní emoce:** *„Mám před sebou velké finanční rozhodnutí, ale Majetio mi dává jasnost, kontrolu a jistotu.“*

Značka **neslibuje** garantovaný zisk ani bezrizikovou investici.

### Cílové skupiny

Běžný kupující, začínající i zkušení investoři, hypoteční poradci, makléři, developeři, právní/techničtí partneři, finanční instituce.

---

## 2. Brand strategy

| Prvek | Formulace |
| --- | --- |
| **Purpose** | Aby velká rozhodnutí o nemovitostech stála na porozumění, ne na dojmu. |
| **Vision** | Český (a později evropský) trh, kde je analýza před koupí standardem — ne výjimkou. |
| **Mission** | Spojit nabídku nemovitostí s transparentní analýzou hodnoty, výnosů, rizik a financování. |
| **Promise** | Jasný, srozumitelný přehled toho, co skutečně kupujete — s otevřenými předpoklady. |

### Principles

1. **Data před dojmy**
2. **Transparentnost před prodejem**
3. **Správné rozhodnutí před rychlou transakcí**
4. **Srozumitelnost před žargonem**
5. **Dlouhodobá hodnota před krátkodobým efektem**
6. **Nejistota pojmenovaná, ne skrytá**

### Personality

Zkušený investor + nezávislý analytik + moderní produktový designér + klidný finanční průvodce.  
Sebevědomý, ale ne arogantní. Přesný, ale lidský.

### Archetyp

- **Hlavní:** Sage / Mudrc — jasnost, porozumění, metodika  
- **Vedlejší:** Guide / Průvodce — doprovod rozhodnutím bez nátlaku  

---

## 3. Název a claimy

**Majetio** (title case). Domény: Majetio.cz, Majetio.com — v logu bez TLD.

| Role | Text |
| --- | --- |
| Primární claim | Než koupíte, mějte jasno. |
| Sekundární | Nemovitosti. Analýza. Rozhodnutí. |
| Krátký | Jasno před koupí. |
| EN | Clarity before you buy. |
| Hero otázka | Vyplatí se tuto nemovitost koupit? |

Claim **není** součástí základního loga — jen volitelný lockup (`LogoWithClaim`).

Tone of voice: viz `docs/TONE_OF_VOICE.md`.

---

## 4. Logo — Layered Asset (Concept C)

### Symbolika

Levý sloup = stabilita majetku / struktura.  
Tři horizontální vrstvy = datové a analytické vrstvy (základ → analýza → rozhodnutí).  
Zaoblený app mark = digitální produkt, ne realitní kancelář.

### Konstrukce

- ViewBox symbolu: `0 0 32 32`
- Ochranná zóna: min. **0,25× výšky symbolu** kolem marku
- Minimální velikost: **16 px** (favicon), doporučeno **24 px+** v UI
- Wordmark: title case „Majetio“ ve Source Serif 4 vedle symbolu (UI) nebo vektorový SVG export

### Povolené varianty

Horizontální lockup, kompaktní, symbol alone, wordmark, light / dark / mono black / mono white, favicon, app icons, social, OG.

### Zakázané použití

- Měnit proporce vrstev  
- Přidat stíny, glow, gradienty do marku  
- Rotovat / zkreslit  
- Umístit na rušivé foto bez kontrastního podkladu  
- Přidat slogan do základního loga  
- Použít nevybrané koncepty A/B/D/E v produkci  

Assety: `public/brand/`, koncepty: `design/brand-concepts/` (ne v UI).

---

## 5. Barvy

| Token | HEX | Použití | Text na barvě |
| --- | --- | --- | --- |
| Ink | `#0B1F33` | Primární, header text, dark surfaces | Canvas / white |
| Ink soft | `#243B53` | Body secondary | Canvas |
| Growth | `#1F6F54` | Pozitivní růst, success, verified | White |
| Sand | `#C4A574` | Prémiový akcent, focus | Ink |
| Canvas | `#F7F4EF` | Page background | Ink |
| Surface | `#FFFFFF` | Karty / elevated | Ink |
| Line | `#E4DFD6` | Borders | — |
| Warning | `#B45309` | Varování, estimated | White / canvas |
| Danger / negative | `#9B2C2C` | Error, negativní výsledek | White |
| Info | `#0369A1` | Informace | White |
| Stale | `#627D98` | Zastaralá data | Canvas |

**Pravidlo:** pozitivní/negativní výsledek vždy s textem, znaménkem nebo ikonou — ne jen barvou.

Dark-mode tokeny jsou připravené sémanticky; plný dark theme UI není v tomto promptu povinný.

---

## 6. Typografie

| Role | Font | Licence |
| --- | --- | --- |
| Display / brand | **Source Serif 4** | SIL OFL (Google Fonts) |
| UI / body / metrics | **DM Sans** | SIL OFL (Google Fonts) |

Metriky: `font-variant-numeric: tabular-nums` (`.font-metric`).

### Stupnice

| Styl | Desktop | Mobile | Weight | LH |
| --- | --- | --- | --- | --- |
| Display XL | 60 px | 40 px | 600 | 1.1 |
| Display L | 48 px | 32 px | 600 | 1.15 |
| H1 | 36 px | 28 px | 600 | 1.2 |
| H2 | 30 px | 24 px | 600 | 1.25 |
| H3 | 22 px | 20 px | 600 | 1.3 |
| H4 | 18 px | 18 px | 600 | 1.35 |
| Body L | 18 px | 18 px | 400 | 1.6 |
| Body M | 16 px | 16 px | 400 | 1.6 |
| Body S | 14 px | 14 px | 400 | 1.5 |
| Label | 13 px | 13 px | 500 | 1.4 |
| Caption | 12 px | 12 px | 400 | 1.4 |
| Metric XL–M | 36 / 24 / 20 | clamp | 600 | 1.2 |

Implementace: CSS variables + utility classes v `globals.css`.

---

## 7. Ikony

**Lucide only** — stroke 1.5–2, sizes 16 / 20 / 24.  
Mapování klíčů: `src/config/brand.ts` → `brandIconKeys`.

---

## 8. Fotografie nemovitostí

- Poměr **4:3** (primární), 16:9 pro hero kontext  
- Radius **8 px**  
- Žádné plovoucí promo badge na fotce  
- Demo/štítek **mimo** nebo pod medií, jasně označený  
- Placeholder: canvas-deep + symbol nebo ikona Building2  
- Text na fotce jen s dostatečným ink overlay (budoucí detail)

---

## 9. Grafické prvky

Povolené: jemné radial atmosphere, analytické mřížky s nízkou opacitoou, vrstvené bloky jako v logu.  
Zakázané: stock makléři, klíče, heavy 3D, animované gradienty, rušivé pozadí za čísly.

---

## 10. Motion

| Typ | Spec |
| --- | --- |
| Hover | 150 ms, 1 px lift max |
| Section enter | ≤ 220 ms fade + 6 px |
| Skeleton | pulse 1.4 s |
| Reduced motion | vypnout animace |

---

## 11. Příklady použití

- Header: `Logo` dark na canvas  
- Footer: `Logo` light na ink  
- Favicon: `public/brand/icons/favicon.svg`  
- Hero: claim + otázka + CTA Analyzovat / Procházet + demo karta  

Komponenty: `src/components/brand/*`
