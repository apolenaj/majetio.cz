/**
 * Trust & transparency content — plain Czech, no fake team, no absolute security slogans.
 */

export const COMPANY_PLACEHOLDER = {
  legalName: "[Obchodní firma — doplní právní tým]",
  ico: "[IČO — doplní právní tým]",
  dic: "[DIČ — je-li plátce DPH — doplní právní tým]",
  registeredSeat: "[Sídlo — doplní právní tým]",
  contactEmail: "podpora@majetio.cz",
  securityEmail: "security@majetio.cz",
} as const;

export const ABOUT_DO = [
  "Spojujeme nabídky nemovitostí s modelovanými odhady, scénáři výnosu a riziky.",
  "Ukazujeme, odkud čísla pocházejí, a kdy je spolehlivost nízká.",
  "Počítáme orientační metriky (výnos, cash flow, financování) z vašich předpokladů.",
  "Předáváme data partnerovi (např. HypotekaJasne) jen po výslovném souhlasu s konkrétním účelem.",
] as const;

export const ABOUT_DONT = [
  "Nejsme realitní kancelář a neprodáváme nemovitosti jako zprostředkovatel.",
  "Nevydáváme znalecké posudky ani závazné ocenění.",
  "Neposkytujeme právní, daňové ani investiční poradenství.",
  "Neschvalujeme hypoteční úvěry a negarantujeme schválení bankou.",
  "Nevymýšlíme „skutečnou hodnotu“ — pracujeme s modelovaným odhadem a nabídkovou cenou.",
] as const;

export type TrustCenterSection = {
  id: string;
  title: string;
  lead: string;
  bullets: string[];
  href?: string;
  hrefLabel?: string;
};

export const TRUST_CENTER_SECTIONS: TrustCenterSection[] = [
  {
    id: "zdroje-dat",
    title: "Zdroje dat",
    lead: "Oddělujeme nabídková data, registry, partner data a vaše scénáře.",
    bullets: [
      "Nabídková cena není kupní cena.",
      "U každého výstupu uvádíme původ (zdroj / model / uživatel).",
      "Interní licenční detaily partnerů na veřejných stránkách neuvádíme.",
    ],
    href: "/zdroje-dat",
    hrefLabel: "Katalog zdrojů dat",
  },
  {
    id: "metodika",
    title: "Metodika",
    lead: "Modelovaný odhad, IRR, NOI, ARV a skóre mají definici, vstupy a limity.",
    bullets: [
      "Při nedostatku dat model vrací nízkou spolehlivost — střed nevymýšlíme.",
      "AI může shrnovat výsledky; není source of truth a negeneruje právní fakta.",
    ],
    href: "/metodika",
    hrefLabel: "Celá metodika",
  },
  {
    id: "soukromi",
    title: "Soukromí",
    lead: "Souhlasy jsou verzované. Marketing a cookies nejsou předzaškrtnuté.",
    bullets: [
      "Finanční pas je v administraci defaultně maskovaný; odhalení vytváří audit.",
      "Export dat probíhá autentizovaným one-time tokem, ne veřejnou URL.",
      "Předání partnerovi vždy s přesným příjemcem a účelem — ne „souhlas s partnery“.",
    ],
    href: "/ochrana-soukromi",
    hrefLabel: "Ochrana soukromí",
  },
  {
    id: "bezpecnost",
    title: "Bezpečnostní přehled",
    lead: "Popisujeme konkrétní kontroly — ne marketingové slogany o „absolutní bezpečnosti“.",
    bullets: [
      "Přenos dat mezi prohlížečem a servery přes HTTPS (šifrovaný transport).",
      "Přístup k účtu a administraci přes autentizaci a oprávnění (RBAC).",
      "Citlivé akce (např. zobrazení Finančního pasu) vyžadují step-up a zapisují audit log.",
      "Vstupy procházejí validací; hesla a finanční údaje se nelogují v otevřené podobě.",
      "Nepoužíváme absolutní marketingové slogany o bezpečnosti — riziko nelze vyloučit úplně.",
    ],
    href: "/duvera-a-bezpecnost#responsible-disclosure",
    hrefLabel: "Nahlašování chyb",
  },
  {
    id: "responsible-disclosure",
    title: "Responsible disclosure",
    lead: "Pokud najdete bezpečnostní chybu, napište nám dřív, než ji zveřejníte.",
    bullets: [
      `Kontakt: ${COMPANY_PLACEHOLDER.securityEmail} (doplní provozovatel).`,
      "Popište kroky k reprodukci, ovlivněnou URL a závažnost — bez zneužití dat třetích stran.",
      "Koordinované zveřejnění preferujeme před okamžitým public disclosure.",
      "Prosím neprovádějte DoS, sociální engineering uživatelů ani přístup k cizím účtům.",
    ],
  },
];

export type GlossaryTerm = {
  slug: string;
  term: string;
  short: string;
  plain: string;
  relatedHref?: string;
  relatedLabel?: string;
};

/** Plain-language glossary — no jargon walls. */
export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    slug: "ltv",
    term: "LTV",
    short: "Podíl úvěru k ceně nemovitosti",
    plain:
      "LTV (loan-to-value) říká, jak velkou část kupní ceny platíte z úvěru. Například LTV 80 % znamená, že 80 % jde z hypotéky a zbytek z vlastních peněz. Nižší LTV obvykle znamená menší úvěr a často snazší schválení — ale vždy rozhoduje banka.",
  },
  {
    slug: "rpsn",
    term: "RPSN",
    short: "Roční procentní sazba nákladů",
    plain:
      "RPSN ukazuje celkové náklady úvěru za rok v procentech — nejen úrok, ale i poplatky, které do výpočtu patří. Srovnávat půjčky jen podle úrokové sazby může mást; RPSN je férovější srovnání. Orientační kalkulačky na Majetiu RPSN banky nenahrazují.",
  },
  {
    slug: "noi",
    term: "NOI",
    short: "Čistý provozní výnos",
    plain:
      "NOI (net operating income) je hrubý příjem z nájmu minus běžné provozní náklady (údržba, pojištění, správa…), ještě před splátkou hypotéky a daněmi. Pomáhá srovnat, kolik nemovitost „vydělá na provozu“ — ne kolik vám zbude na účtu po úvěru.",
    relatedHref: "/metodika/investicni-vypocty",
    relatedLabel: "Investiční výpočty",
  },
  {
    slug: "irr",
    term: "IRR",
    short: "Vnitřní výnosová míra",
    plain:
      "IRR odhaduje průměrný roční výnos z celé řady peněžních toků (nákup, nájem, prodej). Je citlivá na předpoklady — hlavně na prodejní cenu a načasování. Vysoké IRR ve scénáři není slib budoucnosti, jen výsledek vašich vstupů.",
    relatedHref: "/metodika/investicni-vypocty",
    relatedLabel: "Investiční výpočty",
  },
  {
    slug: "arv",
    term: "ARV",
    short: "Hodnota po rekonstrukci (model)",
    plain:
      "ARV (after repair value) je modelovaný odhad ceny po úpravách, ne zaručená prodejní cena. Závisí na rozsahu prací, nákladech a srovnatelných nabídkách. Bez dobrých srovnání je ARV jen hrubá orientace.",
    relatedHref: "/metodika/arv",
    relatedLabel: "ARV v metodice",
  },
  {
    slug: "roi",
    term: "ROI",
    short: "Návratnost investice",
    plain:
      "ROI srovnává zisk (nebo výnos) s vloženými penězi. Na Majetiu vždy kontrolujte, zda jde o hrubý / čistý výnos a zda je v čísle hypotéka. Není to daňový výpočet.",
    relatedHref: "/jak-pocitame-vynos",
    relatedLabel: "Jak počítáme výnos",
  },
  {
    slug: "modelovany-odhad",
    term: "Modelovaný odhad",
    short: "Orientační rozpětí z modelu",
    plain:
      "Číslo z našeho modelu na základě srovnatelných nabídek a úprav. Není to znalecký posudek ani „skutečná hodnota trhu“. Ukazujeme i pásmo a míru spolehlivosti.",
    relatedHref: "/metodika/odhad-hodnoty",
    relatedLabel: "Odhad hodnoty",
  },
  {
    slug: "nabidkova-cena",
    term: "Nabídková cena",
    short: "Cena v inzerátu",
    plain:
      "Částka, kterou prodávající (nebo portál) uvádí. Může se lišit od konečné kupní ceny i od modelovaného odhadu.",
  },
];

export function getGlossaryTerm(slug: string): GlossaryTerm | undefined {
  return GLOSSARY_TERMS.find((t) => t.slug === slug);
}
