# Consent Management — Majetio.cz

## Types

`TERMS` · `PRIVACY` · `MARKETING` · `HYPOTEKAJASNE_HANDOFF` · `PARTNER_SHARE` · `MORTGAGE_LEAD_DATA_TRANSFER` · `AGENT_BUYER_PROFILE_SHARE`

Purpose-scoped ledger: `ConsentRecord` (`COOKIE_*`, `PARTNER_DATA_SHARE`, …) — see `docs/PRIVACY_ARCHITECTURE.md`.

Versions catalogued in `ConsentVersion` + `CURRENT_CONSENT_VERSIONS` + `LegalDocument`.

## Rules

- Marketing is **never** pre-checked at registration or in notification prefs defaults
- Each grant stores type, version, timestamp, source (`metadata.source`)
- History of partner handoffs visible on `/ucet/soukromi` (Privacy Center)
- Revocation writes `consent.revoke` audit + analytics `consent_revoked`
- Cookie CMP: Accept all / Reject / Customize — analytics never before consent
- No generic „souhlasím s partnery“ — `DataSharingPreview` + `assertPartnerShareConsent`

## Purchase Terms (checklist 211 / 212)

Nákup **vyžaduje** výslovný, nepředzaškrtnutý souhlas s Obchodními podmínkami.

| | |
| --- | --- |
| Persist | `recordPurchaseTermsAcceptance` → `Consent` type `TERMS` |
| Metadata | `purpose: "purchase_terms"`, `orderId`, `productKey`, `marketingBundled: false` |
| Version | `PURCHASE_TERMS_VERSION` (= `CURRENT_CONSENT_VERSIONS.TERMS`) |
| UI | Checkout checkbox (default unchecked) |
| Schema | `acceptPurchaseTerms: z.literal(true)` |

**Marketing není součástí nákupu:**

- Checkout schema odmítá `acceptMarketing` / `marketingOptIn` / `marketingConsent` (`z.never()`)
- `assertNoMarketingBundledWithPurchase` v server action
- Copy: „Marketingový souhlas není součástí nákupu…“ → správa na `/ucet/soukromi`

## HypotekaJasne handoff

1. User clicks “Chci zjistit možnosti financování”
2. `DataSharingPreview` shows recipient, purpose, field-level checklist
3. Explicit checkbox + “Souhlasím a pokračovat”
4. Server creates `Consent` + `ConsentRecord` (PARTNER_DATA_SHARE), calls HJ client, stores `Lead`

No automatic send on CTA click.

## Související

- `docs/PRIVACY_ARCHITECTURE.md`
- `docs/MONETIZATION_LEGAL_REVIEW.md`
- `src/domains/commerce/purchase-consent.ts`
