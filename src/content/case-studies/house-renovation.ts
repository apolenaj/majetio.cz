import type { CaseStudyDefinition } from "./types";

export const houseRenovationStudy: CaseStudyDefinition = {
  slug: "dum-pred-rekonstrukci",
  title: "Rodinný dům před rekonstrukcí",
  shortTitle: "Dům k rekonstrukci",
  assignment:
    "Modelový rodinný dům — spočítat náklady rekonstrukce, rezervu a cash flow po zprovoznění.",
  purposeLabel: "Rekonstrukce + bydlení / pronájem",
  locationLabel: "Modelová lokalita — okraj okresního města",
  propertyTypeLabel: "Rodinný dům",
  areaSqm: 128,
  heroImage: {
    src: "/case-studies/house-before.png",
    alt: "Ilustrační fotografie rodinného domu před rekonstrukcí",
    caption: "Ilustrační fotografie · AI vizualizace · Modelová analýza",
    kind: "illustration",
    width: 1200,
    height: 900,
  },
  secondaryImages: [
    {
      src: "/case-studies/house-after-visualization.png",
      alt: "Vizualizace možného stavu stejného domu po rekonstrukci",
      caption:
        "Vizualizace možného stavu · stejný objekt · nepotvrzuje stavební proveditelnost",
      kind: "ai_visualization",
      width: 1200,
      height: 900,
    },
  ],
  purchasePriceCzk: 5_900_000,
  closingCostsCzk: 220_000,
  renovationCostCzk: 1_650_000,
  reserveCzk: 330_000,
  equityCzk: 2_500_000,
  loanTermYears: 25,
  baseMonthlyRentCzk: 28_000,
  baseVacancyRatePct: 5,
  baseInterestRatePctPoints: 5.1,
  opexAnnual: {
    propertyManagementCzk: 0,
    maintenanceCzk: 42_000,
    insuranceCzk: 9_600,
    propertyTaxCzk: 4_800,
    svjOwnerCostCzk: 0,
  },
  scenarios: [
    {
      id: "conservative",
      label: "Konzervativní",
      monthlyRentEffectiveCzk: 24_000,
      vacancyRatePct: 10,
      opexMultiplier: 1.2,
      interestRatePctPoints: 5.6,
    },
    {
      id: "base",
      label: "Základní",
      monthlyRentEffectiveCzk: 28_000,
      vacancyRatePct: 5,
      opexMultiplier: 1,
      interestRatePctPoints: 5.1,
    },
    {
      id: "favorable",
      label: "Příznivý",
      monthlyRentEffectiveCzk: 31_000,
      vacancyRatePct: 3,
      opexMultiplier: 0.9,
      interestRatePctPoints: 4.7,
    },
  ],
  inputFields: [
    {
      label: "Kupní cena",
      value: "5 900 000 Kč",
      provenance: "stated",
    },
    {
      label: "Odhad rekonstrukce",
      value: "1 650 000 Kč",
      provenance: "model_assumption",
    },
    {
      label: "Rezerva 20 %",
      value: "330 000 Kč",
      provenance: "model_assumption",
    },
    {
      label: "Modelové nájemné po zprovoznění",
      value: "28 000 Kč / měsíc",
      provenance: "model_assumption",
    },
  ],
  risks: [
    "Rozsah rekonstrukce není doložen stavebním průzkumem.",
    "Vizualizace možného stavu nepotvrzuje povolení ani rozpočet.",
    "Provozní náklady domu (energie, údržba) mohou být vyšší než model.",
  ],
  missingDocuments: [
    "Stavebně-technický průzkum",
    "Rozpočet a harmonogram rekonstrukce",
    "Projektová dokumentace / povolení",
    "Aktuální náklady na energie",
  ],
  findings: [
    "Celkové pořizovací náklady výrazně převyšují samotnou kupní cenu.",
    "Bez rezervy model podceňuje riziko překročení rozpočtu.",
    "Tržní hodnotu po rekonstrukci záměrně neuvádíme — chybí podklady k ocenění.",
  ],
  conclusion:
    "Model ukazuje ekonomiku po zadané rekonstrukci a rezervě. Nejde o potvrzení stavební proveditelnosti ani o odhad budoucí tržní hodnoty — pouze o scénáře cash flow při uvedených předpokladech.",
  omitMarketValue: true,
  targetGrossYieldPct: 4.5,
};
