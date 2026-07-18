import { ConsentType } from "@prisma/client";

import { CURRENT_CONSENT_VERSIONS } from "@/lib/auth/constants";

export const CONSENT_LABELS: Record<
  ConsentType,
  { title: string; description: string; required?: boolean }
> = {
  TERMS: {
    title: "Obchodní podmínky",
    description: "Nutné pro provoz účtu. Změny zveřejňujeme na majetio.cz.",
    required: true,
  },
  PRIVACY: {
    title: "Ochrana osobních údajů",
    description: "Informace o zpracování údajů podle GDPR.",
    required: true,
  },
  MARKETING: {
    title: "Marketingová komunikace",
    description:
      "Tipy a novinky, které nejsou nutné k poskytnutí služby. Nikdy předvyplněno — musíte aktivně souhlasit.",
  },
  HYPOTEKAJASNE_HANDOFF: {
    title: "Předání HypotekaJasne.cz",
    description:
      "Jednorázové předání vybraných údajů partnerovi za účelem nabídky financování. Bez výslovného potvrzení se nic neodesílá.",
  },
  PARTNER_SHARE: {
    title: "Sdílení s dalšími partnery",
    description: "Obecný souhlas — konkrétní předání vždy s náhledem dat.",
  },
};

export const HYPOTEKAJASNE_RECIPIENT = {
  name: "HypotekaJasne.cz",
  legalName: "HypotekaJasne",
  url: "https://hypotekajasne.cz",
  purpose:
    "Orientační posouzení možností hypotečního / úvěrového financování a případný kontakt ze strany poradce.",
} as const;

/** Fields that may be offered in DataSharingPreview — never more than listed. */
export const HYPOTEKAJASNE_SHAREABLE_FIELDS = [
  { key: "email", label: "E-mail", always: true },
  { key: "phone", label: "Telefon (pokud je v profilu)", always: false },
  { key: "maxPriceCzk", label: "Maximální kupní cena / rozpočet", always: false },
  { key: "availableEquityCzk", label: "Vlastní zdroje", always: false },
  { key: "financingMode", label: "Preferovaný způsob financování", always: false },
  { key: "monthlyIncomeCzk", label: "Měsíční příjem (pokud jste jej zadali)", always: false },
  { key: "monthlyLiabilitiesCzk", label: "Měsíční závazky (pokud jste je zadali)", always: false },
] as const;

export type HypotekaShareFieldKey = (typeof HYPOTEKAJASNE_SHAREABLE_FIELDS)[number]["key"];

export function consentVersionFor(type: ConsentType): string {
  return CURRENT_CONSENT_VERSIONS[type];
}

export const ACCOUNT_DELETE_CONSEQUENCES = [
  "Trvale smažeme účet a přihlašovací údaje.",
  "Odstraníme Finanční pas, preference, oblíbené, analýzy a porovnání vázané na účet.",
  "Zrušíme aktivní marketingové souhlasy.",
  "Historie auditů může zůstat v anonymizované podobě kvůli bezpečnosti a zákonným povinnostem.",
  "Tuto akci nelze vrátit zpět.",
] as const;
