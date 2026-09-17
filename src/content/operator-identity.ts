/**
 * Operator identity — only fields that are intentionally published.
 * Missing legal identity must stay explicit; do not invent IČO / sídlo.
 */

export const OPERATOR_IDENTITY = {
  contactEmailPublished: "podpora@majetio.cz",
  securityEmailPublished: "security@majetio.cz",
  /** Mailbox deliverability is not verified by code presence alone. */
  mailboxDeliveryVerified: false,
  legalName: null as string | null,
  ico: null as string | null,
  dic: null as string | null,
  registeredSeat: null as string | null,
} as const;

/** Exact list of data still required before claiming a complete operator identity. */
export const OPERATOR_IDENTITY_BLOCKERS = [
  "Obchodní firma (právní název provozovatele)",
  "IČO",
  "DIČ (pokud je plátce DPH)",
  "Sídlo / adresa zápisu",
  "Potvrzení, že podpora@majetio.cz a security@majetio.cz skutečně doručují (DNS/MX + test)",
  "Osoba / tým odpovědný za vyřizování poptávek PROPERTY_AUDIT",
] as const;
