/**
 * Current consent document versions accepted at registration / handoff.
 * Kept in sync with ConsentVersion seed / DB catalog.
 */
export const CURRENT_CONSENT_VERSIONS = {
  TERMS: "2026-07-01",
  PRIVACY: "2026-07-01",
  MARKETING: "2026-07-01",
  HYPOTEKAJASNE_HANDOFF: "2026-07-01",
  MORTGAGE_LEAD_DATA_TRANSFER: "mortgage-lead-transfer.v2026.07",
  PARTNER_SHARE: "2026-07-01",
  AGENT_BUYER_PROFILE_SHARE: "agent-buyer-profile-share.v2026.07",
} as const;

export const AUTH_MESSAGES = {
  invalidCredentials: "E-mail nebo heslo není správně.",
  rateLimited: "Příliš mnoho pokusů. Zkuste to prosím za chvíli.",
  weakPassword: "Heslo musí mít alespoň 8 znaků, písmeno a číslici.",
  emailTaken: "Účet s tímto e-mailem už existuje.",
  consentRequired: "Pro registraci je nutný souhlas s podmínkami a ochranou údajů.",
  genericError: "Akci se nepodařilo dokončit. Zkuste to prosím znovu.",
  resetSent:
    "Pokud účet existuje, poslali jsme odkaz pro obnovení hesla. (V developmentu je odkaz v logu serveru.)",
  resetInvalid: "Odkaz pro obnovení hesla je neplatný nebo vypršel.",
  resetSuccess: "Heslo bylo změněno. Můžete se přihlásit.",
} as const;

/** UX: include wait time so lockout does not feel indefinite (Security Performance P0). */
export function rateLimitedMessage(retryAfterSec: number): string {
  const sec = Math.max(1, Math.ceil(retryAfterSec));
  if (sec < 60) {
    return `Příliš mnoho pokusů. Zkuste to prosím za ${sec} s.`;
  }
  const min = Math.max(1, Math.ceil(sec / 60));
  return `Příliš mnoho pokusů. Zkuste to prosím za ${min} min.`;
}
