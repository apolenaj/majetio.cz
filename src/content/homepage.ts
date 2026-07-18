/**
 * Homepage copy — centralized for future localization.
 * Keep claims aligned with docs/BRAND_GUIDE.md and docs/TONE_OF_VOICE.md.
 */

export const homepageContent = {
  announcement: {
    text: "Transparentní analýza nemovitosti — cena, výnos, financování i rizika na jednom místě.",
    linkLabel: "Financování s HypotekaJasne.cz",
    linkHref: "https://hypotekajasne.cz",
    linkExternal: true,
  },
  hero: {
    overline: "Než koupíte, mějte jasno.",
    headline: "Zjistěte, zda se nemovitost skutečně vyplatí koupit.",
    subheadline:
      "Majetio není běžný inzertní portál. Propojuje cenu, výnos, financování, rekonstrukci a rizika — aby rozhodnutí o koupi stálo na datech, ne na dojmu.",
    primaryCta: {
      label: "Analyzovat nemovitost",
      href: "/analyza",
    },
    secondaryCta: {
      label: "Jak Majetio funguje",
      href: "/jak-to-funguje",
    },
    tertiaryCta: {
      label: "Procházet nemovitosti",
      href: "/nemovitosti",
    },
  },
  demoVisual: {
    badge: "Ukázková analýza",
    disclaimer: "Ilustrativní údaje — nejde o reálnou nabídku",
    metrics: {
      askingPrice: "Nabídková cena",
      estimatedValue: "Odhad hodnoty",
      grossYield: "Hrubý výnos",
      cashFlow: "Cash flow / měs.",
      score: "Majetio skóre",
    },
  },
  quickAnalysis: {
    title: "Začněte analýzu",
    description:
      "Vložte odkaz na inzerát, nebo zvolte ruční zadání. V dalším kroku doplníte detaily — import z URL se připravuje.",
    urlTab: "Vložit URL",
    manualTab: "Zadat ručně",
    urlLabel: "URL inzerátu",
    urlPlaceholder: "https://…",
    urlHelper:
      "Podporujeme odkazy z běžných realitních portálů. Adresa se pouze předá do dalšího kroku — nenačítáme obsah automaticky.",
    urlSubmit: "Pokračovat k analýze",
    urlErrorInvalid: "Zadejte platnou HTTPS adresu inzerátu.",
    urlErrorBlocked:
      "Tuto adresu nelze použít. Vložte veřejný odkaz na inzerát (ne localhost ani interní síť).",
    urlErrorUnsupported:
      "Tento typ odkazu zatím nepodporujeme. Zkuste jiný portál, nebo zvolte ruční zadání.",
    manualHeading: "Ruční zadání",
    manualDescription:
      "Vyplníte základní údaje sami — typ, lokalitu a cenu. Detailní výpočty doplníte v dalších krocích.",
    manualCta: "Pokračovat ručně",
    nextStepNote:
      "Po odeslání vás přesměrujeme na formulář nové analýzy. Import dat z URL zatím neprobíhá.",
  },
} as const;

export type HomepageContent = typeof homepageContent;
