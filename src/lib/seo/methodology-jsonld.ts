import {
  METHODOLOGY_SECTIONS,
  type MethodologySection,
} from "@/content/methodology/hub";
import { PUBLIC_DATA_SOURCES } from "@/content/data-sources/public-catalog";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://majetio.cz";

export function buildMethodologyHubJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Metodika Majetio",
    description:
      "Jak Majetio počítá modelované odhady, investiční metriky a skóre — včetně limitů a role AI.",
    url: `${BASE}/metodika`,
    isPartOf: { "@type": "WebSite", name: "Majetio", url: BASE },
    about: {
      "@type": "Thing",
      name: "Metodika oceňování a investiční analýzy nemovitostí",
    },
    hasPart: METHODOLOGY_SECTIONS.map((s) => ({
      "@type": "WebPage",
      name: s.title,
      url: `${BASE}/metodika/${s.slug}`,
      description: s.description,
    })),
  };
}

export function buildMethodologySectionJsonLd(section: MethodologySection) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: section.title,
    description: section.description,
    url: `${BASE}/metodika/${section.slug}`,
    inLanguage: "cs-CZ",
    author: { "@type": "Organization", name: "Majetio" },
    about: section.title,
    isPartOf: {
      "@type": "WebPage",
      name: "Metodika Majetio",
      url: `${BASE}/metodika`,
    },
  };
}

export function buildDataSourcesJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Zdroje dat Majetio",
    description:
      "Kategorie zdrojů dat Majetio: listingy, registry, partner data a odvozené metriky — bez interních licenčních detailů.",
    url: `${BASE}/zdroje-dat`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: PUBLIC_DATA_SOURCES.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: s.name,
        description: `${s.type}. Aktualizace: ${s.updateFrequency}`,
      })),
    },
  };
}

export function buildMethodologyFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Je odhad Majetio skutečná tržní cena?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ne. Jde o modelovaný odhad a orientační rozpětí. Nejde o znalecký posudek ani o nabídkovou cenu.",
        },
      },
      {
        "@type": "Question",
        name: "Je AI na Majetiu source of truth?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ne. AI může shrnovat a vysvětlovat již spočtené výsledky. Primární pravda zůstává v datech, vzorcích a metodice. AI negeneruje právní fakta.",
        },
      },
      {
        "@type": "Question",
        name: "Proč někdy chybí odhad hodnoty?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Při nedostatku srovnatelných dat model vrátí nedostatečnou spolehlivost a střed nevymýšlí. Chybějící data nenahrazujeme nulou.",
        },
      },
    ],
  };
}
