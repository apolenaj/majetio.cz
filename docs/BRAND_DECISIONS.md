# Brand Decisions — Majetio

## BD-001: Archetyp Sage + Guide

- **Status:** Accepted
- **Decision:** Hlavní archetyp **Sage (Mudrc)**, vedlejší **Guide (Průvodce)**.
- **Why:** Majetio prodává jasnost a porozumění, ne hype ani autoritativní „bankovní“ tón Rulera. Guide udržuje lidskost a praktickou pomoc při rozhodnutí.
- **Impact:** Klidný, analytický tón; claimy bez garantovaných výnosů.

## BD-002: Primární claim

- **Status:** Accepted
- **Decision:** „**Než koupíte, mějte jasno.**“
- **Why:** Krátké, zapamatovatelné, bez slibu zisku, funguje pro bydlení i investici. Hero otázka „Vyplatí se tuto nemovitost koupit?“ zůstává produktovým nadpisem.
- **EN:** „Clarity before you buy.“

## BD-003: Wordmark casing

- **Status:** Accepted
- **Decision:** Title case **Majetio** (ne MAJETIO).
- **Why:** Moderní, čitelné v CZ i EN, méně agresivní než all-caps. All-caps jen v úzkých UI labelformátech.

## BD-004: Finální logo — Concept C „Layered Asset“

- **Status:** Accepted
- **Decision:** Geometrický symbol tří datových / majetkových vrstev ve zaobleném čtverci (Concept C).
- **Why:** Nejlepší skóre v matici (čitelnost 16–24 px, originalita vs. „domeček“, mezinárodní použitelnost). Neslibuje trading ani realitní kancelář.
- **Rejected alternatives:** A (příliš RK), B (riziko trading vibe), D (kompas = travel), E (silný, ale méně vlastní než C).

## BD-005: Symbol + textová wordmark komponenta

- **Status:** Accepted
- **Decision:** SVG symbol + text „Majetio“ ve fontu Source Serif 4 v React komponentě `Logo`. Samostatný vektorový wordmark SVG pro exporty.
- **Why:** Škálovatelnost, `currentColor`, žádné embedované fonty v SVG.

## BD-006: Paleta — ink / growth / sand / canvas

- **Status:** Accepted (rozšíření Prompt 1)
- **Decision:** Zachovat inkoustovou navy, hlubší zelenou, pískový akcent, teplé off-white. Doplnit sémantické tokeny (warning, info, estimate, verified, stale, ± investment).
- **Why:** Konzistence s Prompt 1; WCAG AA pro běžný text na canvas.

## BD-007: Typografie Source Serif 4 + DM Sans

- **Status:** Accepted
- **Decision:** Display/brand = Source Serif 4; UI/body/metrics = DM Sans s `font-variant-numeric: tabular-nums` pro metriky.
- **Why:** Česká diakritika (latin-ext), prémiový ale ne kýčový kontrast, open Google Fonts licence.

## BD-008: Ikony Lucide

- **Status:** Accepted
- **Decision:** Jediná ikonová knihovna: Lucide (už ve stacku).
- **Why:** Konzistentní stroke, App Router friendly.

## BD-009: Motion — střídmý + reduced-motion

- **Status:** Accepted
- **Decision:** Hover 150–200 ms, section fade-in ≤ 300 ms, skeleton pulse; `prefers-reduced-motion: reduce` vypíná pohyb.
- **Why:** Prémiový klid, přístupnost, výkon na mobilu.

## BD-010: Vizuální kontrola podobnosti

- **Status:** Noted
- **Decision:** Interní kontrola proti typickým realitním / bankovním / fintech monogramům M. **Nenahrazuje** profesionální rešerši ochranných známek ani právní posouzení.
- **Action:** Před registrací OZ zajistit právní review.
