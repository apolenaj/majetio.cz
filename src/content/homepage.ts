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
  financialDisclaimer: {
    title: "Orientační údaje",
    text: "Všechna čísla na této stránce jsou demonstrační a orientační. Nejde o investiční doporučení, závaznou nabídku ani aktuální tržní data.",
  },
  sampleAnalysis: {
    title: "Co uvidíte v analýze",
    description:
      "Přehled ceny, výnosu, cash flow, skóre a rizik na jednom místě — včetně toho, co je odhad a co je nejisté.",
    demoBadge: "Demo",
    positivesTitle: "Co hraje ve prospěch",
    risksTitle: "Na co si dát pozor",
    uncertaintiesTitle: "Nejistoty",
    ctaLabel: "Spustit vlastní analýzu",
    ctaHref: "/analyza",
  },
  scoreAndMetrics: {
    title: "Majetio skóre a klíčové metriky",
    description:
      "Skóre není jediná známka. Skládá se z ceny, lokality, výnosu a dalších vstupů — a vždy závisí na kvalitě dat.",
    principle:
      "Vysoký výnos nemusí znamenat pozitivní cash flow. Hrubý výnos ignoruje náklady a financování; cash flow ukazuje, co zbývá po nich.",
    metrics: [
      {
        id: "asking",
        title: "Nabídková cena",
        text: "Cena, za kterou se nemovitost inzeruje. Nemusí odpovídat odhadu hodnoty.",
      },
      {
        id: "estimate",
        title: "Odhad hodnoty",
        text: "Orientační pásmo podle dostupných dat a předpokladů. Vždy označené jako odhad.",
      },
      {
        id: "gross",
        title: "Hrubý výnos",
        text: "Roční nájemné dělené kupní cenou — před náklady, daněmi a splátkami.",
      },
      {
        id: "net",
        title: "Čistý výnos",
        text: "Výnos po provozních nákladech. Stále bez hypotéky — ta patří do cash flow.",
      },
      {
        id: "cashflow",
        title: "Cash flow",
        text: "Měsíční zůstatek po nákladech a financování. Může být záporný i při vysokém hrubém výnosu.",
      },
    ],
    scoreLinkLabel: "Jak počítáme Majetio skóre",
    scoreLinkHref: "/majetio-skore",
  },
  howItWorks: {
    title: "Jak Majetio funguje",
    description: "Čtyři kroky od nabídky k rozhodnutí — bez tlaku na rychlou koupi.",
    steps: [
      {
        title: "Vyberte nemovitost",
        text: "Vložte odkaz, zvolte z katalogu, nebo zadejte údaje ručně.",
      },
      {
        title: "Zkontrolujte ekonomiku",
        text: "Porovnejte cenu s odhadem, výnosem, cash flow a riziky.",
      },
      {
        title: "Porovnejte scénáře",
        text: "Upravte předpoklady — nájem, úrok, rekonstrukci nebo strategii.",
      },
      {
        title: "Udělejte další krok",
        text: "Rozhodněte se s větší jistotou, nebo pokračujte k financování.",
      },
    ],
    ctaLabel: "Podrobný popis procesu",
    ctaHref: "/jak-to-funguje",
  },
  strategies: {
    title: "Investiční strategie",
    description: "Stejná nemovitost může dávat smysl pro různé cíle — metriky se liší.",
  },
  audiences: {
    title: "Pro koho je Majetio",
    description: "Jiný cíl, jiné metriky. Vyberte si cestu, která odpovídá vašemu rozhodnutí.",
    segments: [
      {
        id: "home",
        title: "Vlastní bydlení",
        text: "Realistická cena, rizika lokality a financovatelnost před podpisem.",
        metricLabel: "Odchylka od odhadu",
        metricValue: "−4,5 %",
        risk: "medium" as const,
        ctaLabel: "Analyzovat bydlení",
        ctaHref: "/strategie/vlastni-bydleni",
      },
      {
        id: "beginner",
        title: "Začínající investor",
        text: "Srozumitelný výnos, cash flow a srovnání nabídek bez zbytečného žargonu.",
        metricLabel: "Hrubý výnos (demo)",
        metricValue: "5,4 %",
        risk: "medium" as const,
        ctaLabel: "Prohlédnout příležitosti",
        ctaHref: "/nemovitosti/investicni-prilezitosti",
      },
      {
        id: "experienced",
        title: "Zkušený investor",
        text: "Scénáře, porovnání více nemovitostí a citlivost na úrok.",
        metricLabel: "Cash flow / měs. (demo)",
        metricValue: "+2 400 Kč",
        risk: "low" as const,
        ctaLabel: "Porovnat nemovitosti",
        ctaHref: "/porovnani",
      },
      {
        id: "flip",
        title: "Flip / rekonstrukce",
        text: "Odhad nákladů, rezervy a dopad na hodnotu i maximální nabídkovou cenu.",
        metricLabel: "Max. nabídka (demo)",
        metricValue: "6 880 000 Kč",
        risk: "high" as const,
        ctaLabel: "Kalkulačka rekonstrukce",
        ctaHref: "/kalkulacky/rekonstrukce",
      },
    ],
  },
  financing: {
    title: "Financování s HypotekaJasne.cz",
    description:
      "Majetio hodnotí nemovitost a ekonomiku koupě. HypotekaJasne hodnotí financování a klienta.",
    majetioRole: "Majetio: cena, výnos, rizika, rekonstrukce, skóre",
    hjRole: "HypotekaJasne: sazby, splátka, RPSN, hypoteční poradenství",
    ctaLabel: "Spočítat financování",
    ctaHref: "/kalkulacky/financovani",
    externalLabel: "Přejít na HypotekaJasne.cz",
    externalHref: "https://hypotekajasne.cz",
    demoNote: "Níže je demonstrační odhad (mock). Nejde o závaznou nabídku banky.",
  },
  renovationLocationRisks: {
    renovation: {
      title: "Rekonstrukce a maximální nabídka",
      description:
        "Odhad hodnoty po rekonstrukci minus náklady minus rezerva = maximální nabídková cena.",
      formula:
        "Hodnota po rekonstrukci − náklady − rezerva = max. nabídková cena",
      ctaLabel: "Kalkulačka rekonstrukce",
      ctaHref: "/kalkulacky/rekonstrukce",
    },
    location: {
      title: "Lokalita v kontextu",
      description:
        "Cena dává smysl teprve vedle místních nájmů, dostupnosti a trendů — ne jen podle fotek.",
      mapLabel: "Mapový podklad (placeholder)",
      ctaLabel: "Procházet lokality",
      ctaHref: "/lokality",
    },
    risks: {
      title: "Rizika pojmenovaná, ne skrytá",
      description:
        "Na rozdíl od prodejních webů Majetio ukazuje, co může rozhodnutí ztížit — včetně citlivosti na úrok.",
      ctaLabel: "Jak pracujeme s riziky",
      ctaHref: "/metodika",
    },
  },
  comparison: {
    title: "Porovnání nabídek",
    description:
      "Nejlevnější nemovitost nemusí být nejlepší. Srovnejte cenu, výnos, cash flow a skóre vedle sebe.",
    insight:
      "Nejlevnější byt má v ukázce vysoký hrubý výnos, ale záporné cash flow a slabší skóre. Cena sama o sobě nerozhoduje.",
    ctaLabel: "Otevřít porovnání",
    ctaHref: "/porovnani",
  },
  pricing: {
    title: "Základní versus profesionální analýza",
    description: "Začněte zdarma. Kompletní verdikt s metodikou a scénáři je k dispozici jako produkt.",
    basicCta: "Začít základní analýzu",
    basicHref: "/analyza",
    proCta: "Zobrazit ceník",
    proHref: "/cenik",
    basicFeatures: [
      "Orientační metriky ceny a výnosu",
      "Základní přehled rizik",
      "Vstup do katalogu a kalkulaček",
    ],
    proFeatures: [
      "Scénáře a citlivostní analýza",
      "Lokalita, rekonstrukce a financování",
      "Transparentní předpoklady a verdikt",
    ],
  },
  methodology: {
    title: "Metodika a důvěra",
    description:
      "Bez falešných referencí. Transparentní metodika, zdroje dat, označení odhadů a možnost upravit předpoklady.",
    points: [
      {
        title: "Otevřené předpoklady",
        text: "Každý výpočet stojí na vstupech, které si můžete upravit.",
      },
      {
        title: "Označená kvalita dat",
        text: "Rozlišujeme ověřené údaje, odhady a neúplné informace.",
      },
      {
        title: "Žádné garantované výnosy",
        text: "Nejistotu pojmenujeme. Neslibujeme bezrizikovou investici.",
      },
    ],
    links: [
      { href: "/metodika", label: "Metodika" },
      { href: "/zdroje-dat", label: "Zdroje dat" },
      { href: "/pravni-upozorneni", label: "Právní upozornění" },
    ],
  },
  faq: {
    title: "Časté otázky",
    description: "Stručné odpovědi bez marketingových slibů.",
    items: [
      {
        question: "Je Majetio realitní portál?",
        answer:
          "Ne. Majetio je analytická platforma. Pomáhá zjistit, zda se konkrétní nemovitost vyplatí koupit — ne jen najít inzerát.",
      },
      {
        question: "Jsou čísla na homepage reálná nabídka?",
        answer:
          "Ne. Jsou jasně označená jako demo a slouží k vysvětlení rozhraní. Nejde o aktuální tržní data ani investiční doporučení.",
      },
      {
        question: "Co je Majetio skóre?",
        answer:
          "Orientační souhrn podle dostupných dat (cena, lokalita, výnos a další). Není to rating banky ani garance výsledku.",
      },
      {
        question: "Proč může být cash flow záporné při vysokém výnosu?",
        answer:
          "Hrubý výnos nepočítá provozní náklady ani splátky hypotéky. Cash flow ano — proto může být při vysokém výnosu stále záporné.",
      },
      {
        question: "Jak funguje propojení s HypotekaJasne?",
        answer:
          "Majetio drží kontext nemovitosti. HypotekaJasne řeší financování. Předání údajů probíhá jen se souhlasem.",
      },
      {
        question: "Umíte importovat inzerát z URL?",
        answer:
          "Struktura vstupu je připravená. Automatický import dat se doplní v dalších fázích — zatím pokračujete ručním zadáním.",
      },
      {
        question: "Kolik stojí analýza?",
        answer:
          "Základní analýza je zdarma. Profesionální / kompletní analýza má cenu podle ceníku (výchozí hodnota je v centrální konfiguraci).",
      },
      {
        question: "Nahrazuje Majetio odhadce nebo právníka?",
        answer:
          "Ne. Majetio pomáhá s orientací a scénáři. Pro závazná rozhodnutí doporučujeme odborné posouzení.",
      },
    ],
  },
  finalCta: {
    title: "Než koupíte, mějte jasno.",
    description:
      "Začněte analýzou konkrétní nemovitosti, nebo si prohlédněte demonstrační katalog.",
    primaryLabel: "Analyzovat nemovitost",
    primaryHref: "/analyza",
    secondaryLabel: "Procházet nemovitosti",
    secondaryHref: "/nemovitosti",
  },
} as const;

export type HomepageContent = typeof homepageContent;
