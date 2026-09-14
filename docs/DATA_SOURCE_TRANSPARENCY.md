# Data Source Transparency — Majetio

**Datum:** 2026-07-22  
**Účel:** Pravidla zobrazování typů zdrojů, řešení konfliktů, licencování a expirace dat.  
**Kód:** `src/content/data-sources/public-catalog.ts`, `src/domains/markets/data-sources/registry.ts`, `src/components/trust/*`

---

## 1. Cíl

Uživatel musí vždy pochopit:

- **jaký typ** zdroje vidí,
- **k čemu** se zdroj používá,
- **jak často** se aktualizuje,
- **jaká omezení** platí,
- že veřejný katalog **neobsahuje** interní licence, ID smluv ani fee schedules.

Veřejná stránka: `/zdroje-dat`.

---

## 2. Kategorie zdrojů (veřejné)

| Kategorie | ID | Popis |
| --- | --- | --- |
| Property listings | `property_listings` | Nabídky z portálů/feedů — nabídkové ceny, ne nutně realizace |
| Public registries | `public_registries` | Katastrální / statistické podklady dle trhu |
| Partner data | `partner_data` | Smluvní partneři (např. hypotéky) + TTL/souhlas |
| User & derived | `user_and_derived` | Vstupy uživatele + metriky spočtené Majetiem |

### Katalogové položky (minimální sada)

| ID | Typické použití |
| --- | --- |
| `listing-feeds` | Ingest nabídek |
| `manual-listings` | Ruční / broker vstup |
| `public-cadastral-stats` | Agregáty dle trhu (bez přelití neveřejných práv) |
| `location-aggregates` | Location metrics / scoring |
| `mortgage-partner` | Indikativní hypoteční nabídky |
| `user-passport` | Financial Passport |
| `engine-outputs` | Modelované výstupy engine |

Každý záznam v katalogu musí mít: `name`, `category`, `type`, `updateFrequency`, `usedFor[]`, `limitations[]`.

---

## 3. Zobrazovací pravidla (UI)

1. **Badge provenance** u ceny / odhadu / metriky (`DataSourceKind`).
2. **Oddělit** nabídkovou cenu, modelovaný odhad a scénář.
3. U partner dat zobrazit **platnost / stale** (TTL).
4. U sponsored obsahu badge + disclaimer: placené umístění neovlivňuje skóre ani valuaci.
5. Externí odkazy: `rel="noopener noreferrer"`; partner CTA odlišit od organiky.
6. Admin default: citlivé / partnerské detaily maskovat; veřejný web jen katalogovou úroveň.

### Zakázané ve veřejném UI

- Interní license keys, contract IDs, wholesale fee schedules
- Tvrzení „oficiální cena z katastru“ bez ověřeného oprávnění a správného druhu dat
- Smíchání sponsored rankingu do organického skóre

---

## 4. Konflikty v datech

Když dva zdroje nesouhlasí (např. dvě nabídkové ceny, listing vs. agregát lokality):

| Priorita | Pravidlo |
| --- | --- |
| 1 | Preferovat **explicitně označený** `source_record` s novějším `lastSeenAt` |
| 2 | Modelovaný odhad **nikdy nepřebíjí** zobrazenou nabídkovou cenu v Offer/SEO |
| 3 | Uživatelský vstup (`user_provided`) platí jen ve scénáři uživatele |
| 4 | Při nerozhodném konfliktu → snížit confidence / ukázat obě hodnoty s provenance |
| 5 | Nikdy „vybrat střed“ bez metodického důvodu a bez UI vysvětlení |

**Konflikt listing vs. valuace:** vždy zobrazit obě vrstvy; valuace jako rozpětí + confidence, ne jako náhrada asking price.

**Konflikt partner vs. interní cache:** novější ověřený partner payload vyhrává; po TTL označit stale a nespouštět jako „aktuální sazba“.

---

## 5. Licencování

| Třída | Pravidlo |
| --- | --- |
| Veřejné registry | Použití jen v rozsahu povoleném pro `marketCode`; bez redistribuce zakázaných datasetů |
| Listing feedy | Respektovat smluvní ToS feedu; neindexovat privátní / demo-only záznamy |
| Partner data | Smlouva + účel; předání PII jen se `ConsentRecord` (`PARTNER_DATA_SHARE`) |
| User data | Vlastník účtu; export / výmaz dle privacy hardening |
| Derived | Majetio smí zobrazit uživateli; nesmí se tvářit jako primární veřejný registr |

Interní registry trhů: `src/domains/markets/data-sources/registry.ts` (SEO coverage gate — thin pages bez coverage → noindex).

---

## 6. Expirace a retence zdrojových dat

| Zdroj | Aktuálnost | Po expiraci |
| --- | --- | --- |
| Listing | `lastSeenAt` / ingest window | Soft-unpublish / vyřadit z veřejného SEO |
| Location aggregate | Batch freshness | Přepočet jobem; starý snapshot neprezentovat jako live |
| Mortgage partner | TTL cache | Stale badge; nepředávat jako závaznou nabídku banky |
| User passport | Do změny / soft erasure | Po `DELETION_REQUESTED` nullovat money fields |
| Engine output | Do změny vstupů | Přepočítat; nekešovat jako „fakt trhu“ |

Admin: monitorovat freshness; incident při systematickém stale ingestu (`docs/INCIDENT_MANAGEMENT.md`).

---

## 7. SEO a veřejná indexace

- Do sitemapy jen veřejně bezpečné, ne-demo, dostatečně bohaté entity.
- Thin / insufficient coverage → `noindex` (`decideProgrammaticIndexability`).
- JSON-LD Offer = asking price only — ne modelovaný midpoint.

Viz `docs/TECHNICAL_SEO.md`, `docs/TRUST_ARCHITECTURE.md`.

---

## 8. Checklist před zveřejněním nového zdroje

- [ ] Zařazen do kategorie + `PUBLIC_DATA_SOURCES` (nebo vědomě interní-only)
- [ ] `updateFrequency` a `limitations` vyplněny pravdivě
- [ ] Definováno řešení konfliktů vůči listing / valuaci
- [ ] Licence / smlouva zdokumentována interně (ne ve veřejném katalogu)
- [ ] TTL / freshness telemetrie
- [ ] Žádné PII v public payloadu zdroje
