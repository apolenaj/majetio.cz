/**
 * Current consent document versions accepted at registration / handoff.
 * Kept in sync with ConsentVersion seed / DB catalog.
 */
export const CURRENT_CONSENT_VERSIONS = {
  TERMS: "2026-07-01",
  PRIVACY: "2026-07-01",
  MARKETING: "2026-07-01",
  HYPOTEKAJASNE_HANDOFF: "2026-07-01",
  PARTNER_SHARE: "2026-07-01",
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
