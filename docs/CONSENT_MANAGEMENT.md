# Consent Management — Majetio.cz

## Types

`TERMS` · `PRIVACY` · `MARKETING` · `HYPOTEKAJASNE_HANDOFF` · `PARTNER_SHARE`

Versions catalogued in `ConsentVersion` + `CURRENT_CONSENT_VERSIONS`.

## Rules

- Marketing is **never** pre-checked at registration or in notification prefs defaults
- Each grant stores type, version, timestamp, source (`metadata.source`)
- History of partner handoffs visible on `/ucet/souhlasy`
- Revocation writes `consent.revoke` audit + analytics `consent_revoked`

## HypotekaJasne handoff

1. User clicks “Chci zjistit možnosti financování”  
2. `DataSharingPreview` shows recipient, purpose, field-level checklist  
3. Explicit checkbox + “Souhlasím a pokračovat”  
4. Server creates `Consent`, calls HJ client, stores `Lead` (`FINANCING` / `HANDED_OFF`)

No automatic send on CTA click.
