/**
 * Methodology Hub content — Trust by Design, no false certainty.
 * Used by /metodika and /metodika/[section].
 */

export type MethodologyFieldBlock = {
  definition: string;
  inputs: string[];
  sources: string[];
  limits: string[];
};

export type MethodologySection = {
  slug: string;
  title: string;
  /** Short SEO description */
  description: string;
  lead: string;
  blocks: MethodologyFieldBlock;
  /** Extra H3 subsections */
  subsections?: Array<{
    id: string;
    title: string;
    paragraphs: string[];
  }>;
};

export const METHODOLOGY_REVALIDATE_SECONDS = 86_400; // ISR 24h

export const METHODOLOGY_SECTIONS: MethodologySection[] = [
  {
    slug: "jak-funguje-majetio",
    title: "Jak funguje Majetio",
    description:
      "Jak Majetio odděluje nabídková data, modelované odhady a uživatelské scénáře.",
    lead: "Majetio spojuje veřejná a partnerská data o nemovitostech s výpočetními modely. Cílem je srovnatelné rozhodování — ne vydávat model za skutečnou tržní cenu.",
    blocks: {
      definition:
        "Platforma zobrazuje nabídkové údaje ze zdrojů, modelované odhady Majetio a scénáře, které si nastavíte vy. Každá metrika má původ (zdroj / odhad / scénář) a limity.",
      inputs: [
        "Nabídková cena, plocha, lokalita a atributy z property sources",
        "Vaše předpoklady (nájem, náklady, financování, rekonstrukce)",
        "Verzované výpočetní jádro (IRR, NOI, valuace)",
      ],
      sources: [
        "Property listings a registry (viz /zdroje-dat)",
        "Interní agregace a verifikované úpravy analytikem (kde jsou k dispozici)",
        "Uživatelský Finanční pas a scénáře analýzy",
      ],
      limits: [
        "Modelovaný odhad ≠ znalecký posudek ani kupní cena",
        "Chybějící data se nezaplňují nulou ani „jistotou“",
        "AI neslouží jako source of truth pro fakta o trhu ani právo",
      ],
    },
    subsections: [
      {
        id: "vrstvy-dat",
        title: "Vrstvy dat",
        paragraphs: [
          "Zdrojový údaj pochází z inzerátu nebo feedu a označujeme ho jako nabídkový.",
          "Odhad Majetio je výstup modelu (comparables + úpravy) s intervalem a mírou spolehlivosti.",
          "Modelový scénář závisí na vašich vstupech — změna předpokladu změní výsledek.",
        ],
      },
    ],
  },
  {
    slug: "odhad-hodnoty",
    title: "Odhad hodnoty",
    description:
      "Comparables, úpravy, interval p20–p80 a confidence — jak Majetio modeluje hodnotu bytu.",
    lead: "Automatický odhad `residential_apartment_v1` počítá orientační rozpětí z vážených srovnatelných případů. Nejde o oficiální ocenění.",
    blocks: {
      definition:
        "Modelovaný odhad = vážený medián Kč/m² ze srovnatelných transakcí/nabídek × plocha subjectu, po vysvětlitelných feature úpravách, s pásmem p20–p80.",
      inputs: [
        "Cena a plocha subjectu (bez spočitatelného Kč/m² odhad neběží)",
        "Geo kontext (mikro → sousedství → širší okolí)",
        "Čas pozorování comparables (time decay)",
        "Podobnost: plocha, dispozice, stav",
        "Volitelné atributy (balkon, patro, výtah, stav)",
      ],
      sources: [
        "Srovnatelné nabídky / pozorování v databázi Majetio",
        "Lokální cenové kontexty (agregace — ne náhrada comps)",
        "Dokumentace: docs/VALUATION_METHOD.md",
      ],
      limits: [
        "Málo comparables ⇒ INSUFFICIENT — žádný vymyšlený střed",
        "Široké pásmo snižuje confidence; úzké pásmo se nevymýšlí",
        "LAND, COMMERCIAL, shell a extrémy jdou do individuálního posouzení",
        "Outliery se nevynulují — označí se jako nevybrané s důvodem",
      ],
    },
    subsections: [
      {
        id: "comparables",
        title: "Comparables",
        paragraphs: [
          "Kandidáti procházejí geo hierarchií a time decay. Váha = geo × čas × podobnost. Minimální podobnost a strop počtu comps brání šumu.",
          "Outlier detekce (IQR, z-score, nereálná plocha) comps nemaže — jen vyloučí z váženého mediánu.",
        ],
      },
      {
        id: "adjustments",
        title: "Adjustments",
        paragraphs: [
          "Úpravy (balkon, přízemí, výtah, stav…) jsou vysvětlitelné faktory s českým důvodem. Upravená hodnota = základ × (1 + součet faktorů).",
        ],
      },
      {
        id: "confidence",
        title: "Confidence",
        paragraphs: [
          "Spolehlivost High / Medium / Low / Insufficient reflektuje počet a kvalitu comps, rozptyl Kč/m² a úplnost vstupů. Tooltip u indikátoru uvádí konkrétní důvod (např. málo comparables).",
        ],
      },
    ],
  },
  {
    slug: "investicni-vypocty",
    title: "Investiční výpočty",
    description:
      "ROI, NOI, IRR a cash flow — vzorce, vstupy a limity před zdaněním.",
    lead: "Investiční metriky slouží ke srovnání scénářů. Počítají se ve výpočetním jádru mimo UI; výsledky jsou před zdaněním, pokud není uvedeno jinak.",
    blocks: {
      definition:
        "NOI ≈ provozní příjem − provozní náklady. ROI / cash-on-cash vztahují výnos k vlastnímu kapitálu. IRR diskontuje cash flow v čase za zvolený horizont.",
      inputs: [
        "Kupní cena nebo modelovaný odhad (scénář musí uvést, kterou cenu používá)",
        "Předpokládaný nájem, neobsazenost, provozní náklady",
        "Financování (LTV, sazba, splatnost) — pokud scénář počítá s hypotékou",
        "Horizont držení a exit předpoklady",
      ],
      sources: [
        "Vaše scénářové vstupy",
        "Nabídková nebo modelovaná cena nemovitosti",
        "Metodika výnosu: /jak-pocitame-vynos",
      ],
      limits: [
        "Nejde o prognózu budoucího nájmu ani kapitálového zhodnocení",
        "Daně, odpisy a individuální účetnictví nejsou defaultně zahrnuty",
        "Chybějící vstupy → metrika neuvedena, ne nula",
        "Stress / citlivost ukazuje rozsah, ne „správnou“ budoucnost",
      ],
    },
    subsections: [
      {
        id: "noi-roi",
        title: "NOI a ROI",
        paragraphs: [
          "NOI (Net Operating Income) odděluje provoz od financování. Gross yield používá hrubý nájem; net yield zohledňuje náklady — vždy kontrolujte, která definice je u metriky uvedená.",
        ],
      },
      {
        id: "irr",
        title: "IRR",
        paragraphs: [
          "IRR řeší vnitřní výnosovou míru cash flow včetně nákupu a prodeje. Je citlivá na exit cenu a timing. Při nestandardním cash flow může být více kořenů — UI to musí signalizovat, ne skrýt.",
        ],
      },
    ],
  },
  {
    slug: "hypotecni-vypocty",
    title: "Hypoteční výpočty",
    description:
      "Orientační splátky a připravenost — bez příslibu schválení úvěru.",
    lead: "Hypoteční kalkulace na Majetiu jsou ilustrativní. Finální podmínky stanoví věřitel po posouzení bonity.",
    blocks: {
      definition:
        "Anuitní / lineární splátkové vzorce z jistiny, sazby a splatnosti. Volitelně se porovnají s měsíční kapacitou z Finančního pasu.",
      inputs: [
        "Výše úvěru (nebo LTV z kupní ceny)",
        "Nominální úroková sazba a fixace (scénář)",
        "Splatnost ve letech",
        "Volitelně: příjem, závazky, dostupný kapitál (Finanční pas)",
      ],
      sources: [
        "Uživatelské vstupy a Finanční pas",
        "Cache / partner nabídky HypotekaJasne (pokud zapojené) — vždy s časovou značkou",
        "Consent před předáním údajů partnerovi",
      ],
      limits: [
        "Nejde o závaznou nabídku banky ani o scoring schválení",
        "Poplatky, pojištění a RPSN se mohou lišit",
        "Sazby stárnou — stale data označujeme",
        "AI negeneruje právní výklad smlouvy ani DSTI limity jako fakta",
      ],
    },
  },
  {
    slug: "arv",
    title: "ARV — stav po rekonstrukci",
    description:
      "After Repair Value jako modelovaný scénář, ne příslib prodejní ceny.",
    lead: "ARV odhaduje hodnotu po předpokládané rekonstrukci. Závisí na rozsahu prací, nákladech a tržních comps — není to zaručený exit.",
    blocks: {
      definition:
        "ARV = modelovaný odhad hodnoty subjectu ve zvoleném cílovém stavu (např. po renovaci), odvozený z comps a úprav — nebo ze scénáře nákladů + hodnotového upliftu.",
      inputs: [
        "Výchozí stav a cílový stav (kvalita / scope)",
        "Nákladový katalog / uživatelský rozpočet rekonstrukce",
        "Comparables odpovídající cílovému stavu, pokud jsou k dispozici",
      ],
      sources: [
        "Renovation engine a cost catalog (tržní / interní odhady nákladů)",
        "Valuační jádro pro cílový stav",
        "Uživatelské úpravy scope",
      ],
      limits: [
        "Náklady i uplift jsou odhady; realita stavby se liší",
        "Bez cílových comps je ARV hrubě orientační (nízká confidence)",
        "Nezahrnuje automaticky povolení, vady skryté ani časové zpoždění",
      ],
    },
  },
  {
    slug: "maximum-offer",
    title: "Maximum Offer",
    description:
      "Maximální nabídková cena ve scénáři — nástroj disciplíny, ne rada „kolik koupit“.",
    lead: "Maximum Offer pomáhá držet strop kupní ceny vůči výnosovým a rizikovým předpokladům scénáře.",
    blocks: {
      definition:
        "Nejvyšší kupní cena, při které scénář stále plní vámi zvolené podmínky (např. minimální cash-on-cash, maximální LTV, cílový IRR).",
      inputs: [
        "Cílové investiční prahy (výnos, hotovostní tok, riziko)",
        "Náklady pořízení a rekonstrukce",
        "Financování a rezervy",
      ],
      sources: [
        "Scénář uživatele + výpočetní jádro",
        "Volitelně modelovaný odhad / ARV jako kotva — explicitně označená",
      ],
      limits: [
        "Není investiční doporučení ani „férová cena trhu“",
        "Změní se při změně nájmu, sazby nebo nákladů",
        "Ignoruje vyjednávací dynamiku a nestandardní právní vady",
      ],
    },
  },
  {
    slug: "scoring",
    title: "Scoring",
    description:
      "Majetio skóre a match — transparentní váhy, ne černá skříňka pravdy.",
    lead: "Skóre řadí nabídky podle pravidel a vašeho profilu. Vysoké skóre neznamená, že nemovitost „musíte koupit“.",
    blocks: {
      definition:
        "Skóre / match kombinuje pozorovatelné atributy (cena vs. odhad, lokalita, riziko, data quality) s preferencemi uživatele. Výsledek je relativní pořadí ve filtru, ne absolutní pravda o kvalitě investice.",
      inputs: [
        "Atributy listingu a data quality",
        "Modelovaný odhad a rizikovost (pokud dostupné)",
        "Match profil (rozpočet, lokalita, strategie)",
      ],
      sources: [
        "Interní skórovací pravidla (dokumentovaná verze)",
        "Uživatelský profil / Finanční pas (volitelně)",
        "/majetio-skore — srozumitelný popis",
      ],
      limits: [
        "Váhy se mohou verzovat; historické žebříčky nejsou stabilní napříč verzemi",
        "Skóre nezahrnuje právní due diligence ani stavební průzkum",
        "AI shrnutí vysvětlení skóre nesmí vymýšlet chybějící faktory",
      ],
    },
  },
  {
    slug: "ai-a-vysvetlitelnost",
    title: "AI a vysvětlitelnost",
    description:
      "Kde AI na Majetiu pomáhá a kde nesmí být source of truth.",
    lead: "Umělá inteligence může shrnovat a strukturovat. Nemůže nahrazovat registry, smlouvy ani znalecký posudek.",
    blocks: {
      definition:
        "AI = asistent pro srozumitelnost (shrnutí, vysvětlení metrik vlastními slovy). Source of truth zůstávají data, vzorce a lidsky spravované metodiky.",
      inputs: [
        "Již spočtené metriky a jejich metadata (zdroj, confidence, čas)",
        "Schválené textové šablony a metodické stránky",
      ],
      sources: [
        "Výpočetní jádro a databáze Majetio",
        "Tato metodika a /zdroje-dat",
      ],
      limits: [
        "AI negeneruje právní fakta, daňové výklady ani závazné limity DSTI/LTV jako zákon",
        "AI nevytváří falešné comparables ani ceny „protože to zní pravděpodobně“",
        "Každé AI shrnutí musí jít ověřit na primárních číslech a badge původu dat",
      ],
    },
    subsections: [
      {
        id: "kde-ai-pomaha",
        title: "Kde AI pomáhá",
        paragraphs: [
          "Shrnutí dlouhého výstupu analýzy do krátkého checklistu.",
          "Vysvětlení, proč confidence klesla (např. málo comparables) — z již spočtených důvodů.",
          "Návrh otázek na prohlídku nebo due diligence — jako tipy, ne jako právní rada.",
        ],
      },
      {
        id: "kde-ai-neni-pravda",
        title: "Kde AI není source of truth",
        paragraphs: [
          "Katastr, smlouvy, regulační status, výše daně, schválení úvěru.",
          "Jakákoli věta ve stylu „skutečná hodnota je…“ — zakázaná; správně: modelovaný odhad / orientační rozpětí.",
        ],
      },
    ],
  },
];

export function getMethodologySection(
  slug: string,
): MethodologySection | undefined {
  return METHODOLOGY_SECTIONS.find((s) => s.slug === slug);
}

export function listMethodologySlugs(): string[] {
  return METHODOLOGY_SECTIONS.map((s) => s.slug);
}
