import {
  resolveBooleanFact,
  resolveTextFact,
  type ResolvedFact,
} from "@/domains/properties/presentation";
import {
  TECHNICAL_CONDITION_LABEL,
  type Property,
} from "@/lib/mock-properties";

export type CatalogParamRow = {
  label: string;
  fact: ResolvedFact;
  tooltip?: string;
};

export type CatalogParamGroup = {
  title: string;
  rows: CatalogParamRow[];
};

export function buildCatalogParamGroups(property: Property): CatalogParamGroup[] {
  const area = `${new Intl.NumberFormat("cs-CZ").format(property.plocha_m2)} m²`;

  const basic: CatalogParamRow[] = [
    { label: "Dispozice", fact: resolveTextFact(property.dispozice, "text") },
    { label: "Užitná plocha", fact: resolveTextFact(area, "number") },
    {
      label: "Vlastnictví",
      fact: resolveTextFact(null, "legal"),
      tooltip: "Ověřte zápis v katastru — ukázka vlastnictví neuvádí.",
    },
    {
      label: "Stav",
      fact: resolveTextFact(TECHNICAL_CONDITION_LABEL[property.technicky_stav], "text"),
    },
    { label: "Typ stavby", fact: resolveTextFact(property.konstrukce ?? null, "text") },
    {
      label: "Patro",
      fact: resolveTextFact(null, "technical"),
      tooltip: "Patro v ukázce není potvrzené.",
    },
  ];

  const outdoor: CatalogParamRow[] = [
    { label: "Balkon", fact: resolveBooleanFact(undefined) },
    { label: "Lodžie", fact: resolveBooleanFact(undefined) },
    { label: "Terasa", fact: resolveBooleanFact(undefined) },
  ];
  if (property.typ_nemovitosti === "dum") {
    outdoor.push({ label: "Zahrada", fact: resolveBooleanFact(undefined) });
  }

  const storage: CatalogParamRow[] = [
    { label: "Sklep", fact: resolveBooleanFact(undefined) },
    { label: "Parkování", fact: resolveBooleanFact(undefined) },
    { label: "Garáž", fact: resolveBooleanFact(undefined) },
  ];

  const technical: CatalogParamRow[] = [
    {
      label: "Výtah",
      fact: resolveBooleanFact(property.vytah),
      tooltip:
        property.vytah == null
          ? "Údaj o výtahu zatím není potvrzený."
          : undefined,
    },
    { label: "Bezbariérový přístup", fact: resolveBooleanFact(undefined) },
    {
      label: "PENB",
      fact: resolveTextFact(null, "technical"),
      tooltip: "Energetický průkaz v ukázce není. Chybějící údaj není třída G.",
    },
    {
      label: "Rok rekonstrukce",
      fact: resolveTextFact(null, "technical"),
      tooltip: "Rok rekonstrukce není v ukázce uveden.",
    },
  ];

  return [
    { title: "Základní informace", rows: basic.filter((row) => row.fact.status !== "hidden") },
    { title: "Venkovní prostory", rows: outdoor.filter((row) => row.fact.status !== "hidden") },
    {
      title: "Úložné prostory a parkování",
      rows: storage.filter((row) => row.fact.status !== "hidden"),
    },
    { title: "Technické vybavení", rows: technical.filter((row) => row.fact.status !== "hidden") },
  ].filter((group) => group.rows.length > 0);
}
