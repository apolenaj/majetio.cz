# Form Guidelines — Majetio

## Struktura pole

Každé pole: **label** (viditelný) · optional/required · helper · error · správné `id` / `aria-describedby`.

## Finanční vstupy

- `CurrencyInput` — cs-CZ, suffix Kč, parse mezer a čárky
- `PercentageInput` — suffix %
- `AreaInput` — suffix m²
- Validace: min/max, „vyšší než nula“, konkrétní české hlášky

## Layouty

Jednoduchý stack · dvousloupec (Grid) · wizard (`FormWizardLayout`) · kalkulačka (`CalculatorShell`) · filtry v Dialogu

## Zakázané hlášky

„Invalid input“, „Error 400“, „Something went wrong“

## Vhodné

„Hodnotu upravte na číslo vyšší než nula.“  
„Pro tento výpočet chybí některé údaje.“
