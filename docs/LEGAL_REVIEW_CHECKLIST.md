# Legal Review Checklist — Pre-release

Use before production deploy when legal copy, consents, partner sharing, or privacy flows changed.

## Documents & versioning

- [ ] Published `LegalDocument` rows for TERMS / PRIVACY / COOKIES match counsel-approved text (or fallback content reviewed)
- [ ] Version strings and `COOKIE_POLICY_VERSION` bump when material terms change
- [ ] Canonical routes live: `/podminky`, `/ochrana-soukromi`, `/cookies` (legacy redirects permanent)
- [ ] No marketing claims of “100% secure”, “bank-level security”, or guaranteed investment returns on legal pages

## Consent & CMP

- [ ] Cookie banner: Accept all / Reject / Customize with equal visual weight; no pre-checked analytics/marketing
- [ ] Analytics and marketing scripts/events blocked until consent (`consent-gate`)
- [ ] Partner data share requires purpose-scoped consent (`recipient` + `sharedScope`); no blanket “partneři”
- [ ] Registration requires TERMS/PRIVACY; marketing not pre-checked
- [ ] Privacy Center (`/ucet/soukromi`) lists consents, supports withdraw, export, deletion request

## Communications

- [ ] Transactional emails do **not** require marketing consent
- [ ] Transactional bodies contain **no** Financial Passport amounts — deep links into `/ucet…` only
- [ ] Marketing email / campaigns gated on marketing consent + suppression list

## Data subject rights

- [ ] Export: one-time token, authenticated POST, `Cache-Control: no-store`, no public payload URL
- [ ] Soft deletion request sets `deletionRequestedAt` / status and clears FP money fields
- [ ] Hard delete (if offered) requires password / email confirmation and audit log
- [ ] Lead retention / redaction schedule documented and jobs scheduled

## Cross-border & partners

- [ ] HypotekaJasne (or other) handoff discloses recipient, purpose, field scope
- [ ] DPA / processing agreements for sub-processors listed in privacy notice
- [ ] International market pages do not invent local legal advice

## Sign-off

| Role | Name | Date | Notes |
| --- | --- | --- | --- |
| Product | | | |
| Legal / counsel | | | |
| Engineering | | | |

Related: `docs/PRIVACY_ARCHITECTURE.md`, `docs/PRIVACY_BY_DEFAULT.md`, `docs/TESTING_ARCHITECTURE.md`
