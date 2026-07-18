# Onboarding — Majetio.cz

## Entry

After successful registration → `/onboarding` (default callback).  
Pending onboarding also redirects from `/ucet` until completed or skipped.

## Steps

1. Goal — OWN_HOME / INVESTMENT / RENOVATION / FLIP / EXPLORING  
2. Property type(s)  
3. Location — city + region (no street address)  
4. Budget — max purchase price  
5. Equity — optional amount / percent  
6. Financing — mortgage / mixed / cash  
7–8. Investment strategy + yield prefs — **only if goal = INVESTMENT**  
9. Complete — summary + CTA to listings / analysis  

## UX

Short steps, progress bar, interrupt (“dokončit později”), debounced autosave to profile tables.

## Persistence

`UserProfile` (goal/step/flags) + `PropertyPreference` + `FinancialProfile` + `InvestmentPreference`.

## Analytics

`onboarding_step_saved`, `onboarding_completed`, `onboarding_skipped` — goal id only, **no amounts**.
