# Financial Passport — Majetio.cz

Route: `/ucet/financni-profil`  
Product UI name: **Finanční pas** (nav label).

## Sections A–I

A Cíl · B Rozpočet · C Vlastní kapitál · D Financování · E Příjem (optional) · F Závazky (optional) · G Investiční preference (risk: Konzervativní/Vyvážený/Dynamický) · H Lokality · I Preference nemovitosti

**Not collected:** rodné číslo, home address, employer.

## Progress levels

Základní → Rozšířený → Připravený k personalizaci (`computePassportProgress`).

## Concurrency

Client sends `expectedTimestamps` for profile/financial/property/investment rows. Conflict → reload + warning (multi-window safe).

## Recommendations

Rule-based, always labelled **orientační** (e.g. illustrative 80% LTV equity gap). Never a hard reject.

## HypotekaJasne

CTA opens `DataSharingPreview` only — **no auto handoff**. Confirm creates consent + lead.
