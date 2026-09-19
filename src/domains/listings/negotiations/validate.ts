/**
 * Čistá pravidla krátkého popisu, cenového návrhu a spolukoupě.
 * Nečte databázi a nesmí znát neveřejný cenový práh.
 */

export const BANNED_SHORT_PHRASES = ["výhodná investice", "garantovaný výnos"] as const;

export const ALLOWED_CURRENCIES = ["CZK", "EUR"] as const;
export type OfferCurrency = (typeof ALLOWED_CURRENCIES)[number];

export const FINANCING_VALUES = ["OWN_FUNDS", "LOAN", "MIXED", "UNKNOWN"] as const;
export type FinancingValue = (typeof FINANCING_VALUES)[number];

export const SITUATIONS = ["SEEK_PARTNER", "SELLER_RETAINS"] as const;
export type SituationValue = (typeof SITUATIONS)[number];

export const SHARE_REFERENCES = ["WHOLE_PROPERTY", "OFFERED_SHARE"] as const;
export type ShareReferenceValue = (typeof SHARE_REFERENCES)[number];

export const PURPOSES = ["OWN_LIVING", "LONG_TERM_RENT", "OTHER"] as const;
export type PurposeValue = (typeof PURPOSES)[number];

export const NEGOTIATION_STATUSES = [
  "NEW",
  "IN_DISCUSSION",
  "INFO_REQUESTED",
  "COUNTERED",
  "REJECTED",
  "WITHDRAWN",
  "CLOSED",
] as const;
export type NegotiationStatusValue = (typeof NEGOTIATION_STATUSES)[number];

const TERMINAL = new Set<NegotiationStatusValue>(["REJECTED", "WITHDRAWN", "CLOSED"]);
const SECTION_HEADINGS = new Set([
  "o nemovitosti",
  "technický stav",
  "potenciál a investice",
]);

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

export function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function clampText(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > 80 ? cut.slice(0, lastSpace) : cut;
  return `${base.trim()}…`;
}

function containsBanned(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_SHORT_PHRASES.some((phrase) => lower.includes(phrase));
}

/** Inzerentův text, nebo výňatek z existujícího popisu. Nevymýšlí vlastnosti. */
export function resolveShortDescription(input: {
  shortDescription?: string | null;
  description?: string | null;
  title?: string | null;
}): string | null {
  const explicit = stripHtml(input.shortDescription ?? "");
  if (explicit) {
    if (explicit.length < 40 || containsBanned(explicit)) return null;
    return clampText(explicit, 220);
  }

  const body = stripHtml(input.description ?? "");
  if (!body) return null;
  const title = (input.title ?? "").trim().toLowerCase();
  const chunks = body
    .split(/\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 40 && !SECTION_HEADINGS.has(part.toLowerCase()));

  const candidate = chunks.find((chunk) => {
    const lower = chunk.toLowerCase();
    if (containsBanned(lower)) return false;
    if (title && (lower === title || lower.startsWith(title) && lower.length < title.length + 12)) {
      return false;
    }
    return true;
  });
  if (!candidate) return null;
  return clampText(candidate, 220);
}

export function validateAdvertiserShortDescription(
  raw: string | null | undefined,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const text = stripHtml(raw ?? "");
  if (!text) return { ok: true, value: null };
  if (text.length < 40 || text.length > 220) {
    return {
      ok: false,
      error: "Krátký popis má mít 40–220 znaků, doporučeně 120–220.",
    };
  }
  if (containsBanned(text)) {
    return {
      ok: false,
      error: "Krátký popis nesmí slibovat výhodnou investici ani garantovaný výnos.",
    };
  }
  return { ok: true, value: text };
}

export function canAcceptNegotiation(status: string): boolean {
  return status === "ACTIVE";
}

/** Příjemce je vždy z nabídky. ID z formuláře se zahazuje. */
export function listingRecipient(
  property: { listedByUserId?: string | null; ownerUserId?: string | null },
  clientRecipientId?: string | null,
): string | null {
  void clientRecipientId;
  return property.listedByUserId ?? property.ownerUserId ?? null;
}

export function isOwnListing(
  buyerUserId: string | null | undefined,
  property: { listedByUserId?: string | null; ownerUserId?: string | null },
): boolean {
  if (!buyerUserId) return false;
  return buyerUserId === property.ownerUserId || buyerUserId === property.listedByUserId;
}

export function isRecentDuplicate(input: {
  now: number;
  previousCreatedAt: number | null;
  samePayload: boolean;
}): boolean {
  if (!input.samePayload || input.previousCreatedAt == null) return false;
  return input.now - input.previousCreatedAt < DUPLICATE_WINDOW_MS;
}

export function outcomeMessage(notice: "STORED_ONLY" | "SENT" | "FAILED"): {
  stored: boolean;
  emailed: boolean;
  text: string;
} {
  if (notice === "SENT") {
    return {
      stored: true,
      emailed: true,
      text: "Návrh je uložený a inzerentovi odešlo e-mailové upozornění.",
    };
  }
  if (notice === "FAILED") {
    return {
      stored: true,
      emailed: false,
      text: "Návrh je uložený, ale e-mailové upozornění se nepodařilo odeslat.",
    };
  }
  return {
    stored: true,
    emailed: false,
    text: "Návrh je uložený. E-mailové upozornění se neodeslalo, doručení není nastavené.",
  };
}

function parseMoney(raw: unknown, label: string): { ok: true; value: number } | { ok: false; error: string } {
  const text = String(raw ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (!text) return { ok: false, error: `Uveďte ${label}.` };
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return { ok: false, error: `${label} musí být kladná částka.` };
  }
  const value = Math.round(Number(text));
  if (!Number.isFinite(value) || value < 1 || value > 1_000_000_000_000) {
    return { ok: false, error: `${label} musí být kladná částka.` };
  }
  return { ok: true, value };
}

function parseContact(input: {
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  honeypot?: string | null;
}): { ok: true; name: string; email: string; phone: string | null } | { ok: false; error: string } {
  if ((input.honeypot ?? "").trim()) {
    return { ok: false, error: "Odeslání se nezdařilo." };
  }
  const name = (input.buyerName ?? "").trim();
  const email = (input.buyerEmail ?? "").trim().toLowerCase();
  const phone = (input.buyerPhone ?? "").trim();
  if (name.length < 2 || name.length > 120) {
    return { ok: false, error: "Uveďte jméno." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return { ok: false, error: "Uveďte kontaktní e-mail." };
  }
  if (phone.length > 40) return { ok: false, error: "Telefon je příliš dlouhý." };
  return { ok: true, name, email, phone: phone || null };
}

export function validatePriceOffer(input: {
  amount: unknown;
  currency?: string | null;
  financing?: string | null;
  timeline?: string | null;
  message?: string | null;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  honeypot?: string | null;
}):
  | {
      ok: true;
      value: {
        amountCzk: number;
        currency: OfferCurrency;
        financing: FinancingValue;
        timeline: string | null;
        message: string | null;
        buyerName: string;
        buyerEmail: string;
        buyerPhone: string | null;
      };
    }
  | { ok: false; error: string } {
  const contact = parseContact(input);
  if (!contact.ok) return contact;
  const amount = parseMoney(input.amount, "požadovanou kupní cenu");
  if (!amount.ok) return amount;
  const currency = (input.currency ?? "CZK").trim().toUpperCase();
  if (!ALLOWED_CURRENCIES.includes(currency as OfferCurrency)) {
    return { ok: false, error: "Měna může být jen CZK nebo EUR." };
  }
  const financing = (input.financing ?? "UNKNOWN").trim();
  if (!FINANCING_VALUES.includes(financing as FinancingValue)) {
    return { ok: false, error: "Zvolte způsob financování." };
  }
  const timeline = (input.timeline ?? "").trim();
  const message = (input.message ?? "").trim();
  if (timeline.length > 120) return { ok: false, error: "Termín koupě je příliš dlouhý." };
  if (message.length > 4000) return { ok: false, error: "Zpráva je příliš dlouhá." };
  return {
    ok: true,
    value: {
      amountCzk: amount.value,
      currency: currency as OfferCurrency,
      financing: financing as FinancingValue,
      timeline: timeline || null,
      message: message || null,
      buyerName: contact.name,
      buyerEmail: contact.email,
      buyerPhone: contact.phone,
    },
  };
}

export function validateCoPurchase(input: {
  situation?: string | null;
  allowSeekPartner: boolean;
  allowSellerRetains: boolean;
  sharePercent: unknown;
  shareReference?: string | null;
  offeredOwnershipPercent?: number | null;
  cashContributionCzk: unknown;
  proposedTotalPriceCzk?: unknown;
  purpose?: string | null;
  hasCoInvestor?: string | boolean | null;
  financing?: string | null;
  message?: string | null;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  honeypot?: string | null;
}):
  | {
      ok: true;
      value: {
        situation: SituationValue;
        sharePercent: number;
        shareReference: ShareReferenceValue;
        cashContributionCzk: number;
        proposedTotalPriceCzk: number | null;
        purpose: PurposeValue;
        hasCoInvestor: boolean;
        financing: FinancingValue;
        message: string | null;
        buyerName: string;
        buyerEmail: string;
        buyerPhone: string | null;
      };
    }
  | { ok: false; error: string } {
  const contact = parseContact(input);
  if (!contact.ok) return contact;
  const situation = (input.situation ?? "").trim();
  if (!SITUATIONS.includes(situation as SituationValue)) {
    return { ok: false, error: "Zvolte situaci společné koupě." };
  }
  if (situation === "SEEK_PARTNER" && !input.allowSeekPartner) {
    return { ok: false, error: "Inzerent tuto situaci společné koupě nepovolil." };
  }
  if (situation === "SELLER_RETAINS" && !input.allowSellerRetains) {
    return { ok: false, error: "Inzerent tuto situaci společné koupě nepovolil." };
  }

  const shareText = String(input.sharePercent ?? "").trim().replace("%", "").replace(",", ".");
  if (!/^\d+$/.test(shareText)) {
    return { ok: false, error: "Vlastnický podíl uveďte v celých procentech." };
  }
  const sharePercent = Number(shareText);
  if (sharePercent < 1 || sharePercent > 99) {
    return { ok: false, error: "Vlastnický podíl musí být mezi 1 a 99 %." };
  }

  const offered = input.offeredOwnershipPercent ?? null;
  const listingIsShare = offered != null && offered >= 1 && offered <= 99;
  let shareReference = (input.shareReference ?? "").trim();
  if (listingIsShare) {
    if (!SHARE_REFERENCES.includes(shareReference as ShareReferenceValue)) {
      return {
        ok: false,
        error:
          "Uveďte, zda procento znamená část celé nemovitosti, nebo část nabízeného podílu.",
      };
    }
  } else {
    shareReference = "WHOLE_PROPERTY";
  }

  const cash = parseMoney(input.cashContributionCzk, "plánovaný peněžní vklad v Kč");
  if (!cash.ok) return cash;
  const proposedRaw = String(input.proposedTotalPriceCzk ?? "").trim();
  let proposedTotalPriceCzk: number | null = null;
  if (proposedRaw) {
    const proposed = parseMoney(proposedRaw, "návrh celkové kupní ceny");
    if (!proposed.ok) return proposed;
    proposedTotalPriceCzk = proposed.value;
  }

  const purpose = (input.purpose ?? "").trim();
  if (!PURPOSES.includes(purpose as PurposeValue)) {
    return { ok: false, error: "Zvolte účel." };
  }
  const coInvestorRaw = input.hasCoInvestor;
  if (coInvestorRaw !== true && coInvestorRaw !== false && coInvestorRaw !== "yes" && coInvestorRaw !== "no") {
    return { ok: false, error: "Uveďte, zda už máte dalšího spoluinvestora." };
  }
  const financing = (input.financing ?? "").trim();
  if (!FINANCING_VALUES.includes(financing as FinancingValue)) {
    return { ok: false, error: "Zvolte způsob financování." };
  }
  const message = (input.message ?? "").trim();
  if (message.length > 4000) return { ok: false, error: "Zpráva je příliš dlouhá." };

  return {
    ok: true,
    value: {
      situation: situation as SituationValue,
      sharePercent,
      shareReference: shareReference as ShareReferenceValue,
      cashContributionCzk: cash.value,
      proposedTotalPriceCzk,
      purpose: purpose as PurposeValue,
      hasCoInvestor: coInvestorRaw === true || coInvestorRaw === "yes",
      financing: financing as FinancingValue,
      message: message || null,
      buyerName: contact.name,
      buyerEmail: contact.email,
      buyerPhone: contact.phone,
    },
  };
}

/**
 * Orientační část nabídkové ceny. Není ocenění podílu.
 * Když nabídková cena kryje jen podíl a zájemce myslí procento celé nemovitosti, částku nepočítáme.
 */
export function proportionalAskingShare(input: {
  askingPrice: number | null | undefined;
  sharePercent: number;
  shareReference: ShareReferenceValue;
  offeredOwnershipPercent?: number | null;
}): { amount: number; label: string } | { amount: null; note: string } {
  const asking = input.askingPrice;
  if (asking == null || !Number.isFinite(asking) || asking <= 0) {
    return { amount: null, note: "Nabídková cena není uvedena, poměrnou část proto nepočítáme." };
  }
  const offered = input.offeredOwnershipPercent;
  const listingIsShare = offered != null && offered >= 1 && offered <= 99;
  if (listingIsShare && input.shareReference === "WHOLE_PROPERTY") {
    return {
      amount: null,
      note: "Nabídková cena se vztahuje jen k nabízenému podílu. Poměrnou část z ní proto nepočítáme.",
    };
  }
  return {
    amount: Math.round((asking * input.sharePercent) / 100),
    label: "Poměrná část nabídkové ceny, bez dalších nákladů",
  };
}

export type NegotiationVersion = {
  actor: "BUYER" | "SELLER";
  amountCzk: number | null;
  status: NegotiationStatusValue;
  message?: string | null;
};

export type NegotiationSnapshot = {
  status: NegotiationStatusValue;
  amountCzk: number;
  versions: NegotiationVersion[];
};

export function reduceNegotiation(
  state: NegotiationSnapshot,
  event:
    | { type: "counter"; amountCzk: number; message?: string | null }
    | { type: "revise"; amountCzk: number }
    | { type: "withdraw" }
    | { type: "status"; status: "IN_DISCUSSION" | "INFO_REQUESTED" | "REJECTED" | "CLOSED" },
): NegotiationSnapshot | { error: string } {
  if (TERMINAL.has(state.status)) {
    return { error: "Uzavřený, odmítnutý nebo stažený návrh už nelze měnit." };
  }
  if (event.type === "withdraw") {
    return {
      status: "WITHDRAWN",
      amountCzk: state.amountCzk,
      versions: [
        ...state.versions,
        { actor: "BUYER", amountCzk: state.amountCzk, status: "WITHDRAWN", message: "Zájemce návrh stáhl." },
      ],
    };
  }
  if (event.type === "counter") {
    if (event.amountCzk < 1) return { error: "Protinávrh musí být kladná částka." };
    return {
      status: "COUNTERED",
      amountCzk: state.amountCzk,
      versions: [
        ...state.versions,
        {
          actor: "SELLER",
          amountCzk: event.amountCzk,
          status: "COUNTERED",
          message: event.message ?? null,
        },
      ],
    };
  }
  if (event.type === "revise") {
    if (event.amountCzk < 1) return { error: "Částka musí být kladná." };
    return {
      status: "NEW",
      amountCzk: event.amountCzk,
      versions: [
        ...state.versions,
        { actor: "BUYER", amountCzk: event.amountCzk, status: "NEW" },
      ],
    };
  }
  return {
    status: event.status,
    amountCzk: state.amountCzk,
    versions: [
      ...state.versions,
      { actor: "SELLER", amountCzk: null, status: event.status },
    ],
  };
}
