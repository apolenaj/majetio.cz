/**
 * Ukázkový katalog pro výpis /nemovitosti.
 * Není to živý trh — slouží k ověření filtrů a štítků.
 */

import { foldDiacritics } from "@/domains/properties/search/text-match";
import type { PropertyUrlFilterState } from "@/domains/properties/search/url-state";

export type PropertyTransaction = "prodej" | "pronajem";
export type PropertyKind = "byt" | "dum" | "pozemek" | "komerce";
export type ListingPresentation = "premium" | "klasicky";

export interface PropertyImages {
  /** Jedna hlavní fotka klasického inzerátu. */
  hlavni?: string;
  /** Premium: stav před úpravou. */
  pred_rekonstrukci?: string;
  /** Premium: stav po homestagingu / rekonstrukci. */
  po_rekonstrukci?: string;
  /** Premium: počet dalších upravených fotek v galerii. */
  pocet_wow_fotek?: number;
}

export interface Property {
  id: number;
  nazev: string;
  typ_transakce: PropertyTransaction;
  typ_nemovitosti: PropertyKind;
  dispozice: string | null;
  lokalita: string;
  cena: number;
  plocha_m2: number;
  stav_inzeratu: ListingPresentation;
  obrazky: PropertyImages;
  /** Delší text inzerátu: stav, okolí, potenciál. Není znalecký posudek. */
  detail_popis: string;
  /** Další fotky mimo hlavní snímek / srovnání před–po. */
  galerie: string[];
  stitky: string[];
  popis_upravy: string;
}

const TYPE_SLUG_TO_KIND: Record<string, PropertyKind> = {
  byt: "byt",
  dum: "dum",
  "dum-na-klic": "dum",
  pozemek: "pozemek",
  komercni: "komerce",
  projekty: "komerce",
};

const catalogSeed: Array<Omit<Property, "detail_popis" | "galerie">> = [
  {
    id: 1,
    nazev: "Světlý byt 2+kk blízko metra",
    typ_transakce: "prodej",
    typ_nemovitosti: "byt",
    dispozice: "2+kk",
    lokalita: "Praha 9 - Vysočany",
    cena: 6500000,
    plocha_m2: 54,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1490006388477-9ab871431fb6?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 5,
    },
    stitky: ["Vysoký výnos", "Bez rekonstrukce"],
    popis_upravy:
      "Premium: Profesionální fotky, homestaging, 3D scan a optimalizovaný copywriting pro maximální dosah.",
  },
  {
    id: 2,
    nazev: "Byt 3+1 v původním stavu",
    typ_transakce: "prodej",
    typ_nemovitosti: "byt",
    dispozice: "3+1",
    lokalita: "Ostrava - Poruba",
    cena: 2100000,
    plocha_m2: 72,
    stav_inzeratu: "klasicky",
    obrazky: {
      hlavni:
        "https://images.unsplash.com/photo-1490006388477-9ab871431fb6?auto=format&fit=crop&w=900&q=70",
    },
    stitky: ["Pod tržním odhadem", "Fix & Rent"],
    popis_upravy: "Klasika: Fotky z mobilu, stručný popis od majitele, bez přípravy.",
  },
  {
    id: 3,
    nazev: "Investiční garsonka v centru",
    typ_transakce: "pronajem",
    typ_nemovitosti: "byt",
    dispozice: "1+kk",
    lokalita: "Brno - Střed",
    cena: 12000,
    plocha_m2: 28,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1490006388477-9ab871431fb6?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 4,
    },
    stitky: ["Stabilní pronájem", "Pozitivní cashflow"],
    popis_upravy:
      "Premium: Vyladěný inzerát cílící na studenty a mladé profíky, profi svícení fotek.",
  },
  {
    id: 4,
    nazev: "Pronájem 2+1 s balkonem",
    typ_transakce: "pronajem",
    typ_nemovitosti: "byt",
    dispozice: "2+1",
    lokalita: "Olomouc",
    cena: 14500,
    plocha_m2: 61,
    stav_inzeratu: "klasicky",
    obrazky: {
      hlavni:
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=70",
    },
    stitky: ["Stabilní pronájem"],
    popis_upravy: "Klasika: Běžný inzerát, prázdné místnosti s horším světlem.",
  },
  {
    id: 5,
    nazev: "Rodinný dům se zahradou",
    typ_transakce: "prodej",
    typ_nemovitosti: "dum",
    dispozice: "4+1",
    lokalita: "Krnov",
    cena: 5200000,
    plocha_m2: 145,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 6,
    },
    stitky: ["Bez rekonstrukce"],
    popis_upravy: "Premium: Dronové záběry okolí, vyčištěná zahrada, virtuální prohlídka.",
  },
  {
    id: 6,
    nazev: "Starší dům k rekonstrukci",
    typ_transakce: "prodej",
    typ_nemovitosti: "dum",
    dispozice: "5+kk",
    lokalita: "Kladno",
    cena: 3800000,
    plocha_m2: 180,
    stav_inzeratu: "klasicky",
    obrazky: {
      hlavni:
        "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=900&q=70",
    },
    stitky: ["Pod tržním odhadem"],
    popis_upravy: "Klasika: Pouze venkovní fotky a pár tmavých fotek interiéru.",
  },
  {
    id: 7,
    nazev: "Luxusní mezonet s výhledem",
    typ_transakce: "prodej",
    typ_nemovitosti: "byt",
    dispozice: "4+kk",
    lokalita: "Praha 2 - Vinohrady",
    cena: 18500000,
    plocha_m2: 130,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 8,
    },
    stitky: ["Bez rekonstrukce"],
    popis_upravy:
      "Premium: Video prohlídka, prémiový copywriting zdůrazňující lokalitu a materiály.",
  },
  {
    id: 8,
    nazev: "Pronájem moderního domu",
    typ_transakce: "pronajem",
    typ_nemovitosti: "dum",
    dispozice: "5+kk",
    lokalita: "Říčany u Prahy",
    cena: 45000,
    plocha_m2: 160,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdbc?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 5,
    },
    stitky: ["Stabilní pronájem"],
    popis_upravy: "Premium: Zaměření na expaty, anglický překlad, perfektní fotky detailů.",
  },
  {
    id: 9,
    nazev: "Byt 1+1 před rekonstrukcí",
    typ_transakce: "prodej",
    typ_nemovitosti: "byt",
    dispozice: "1+1",
    lokalita: "Plzeň - Slovany",
    cena: 2800000,
    plocha_m2: 41,
    stav_inzeratu: "klasicky",
    obrazky: {
      hlavni:
        "https://images.unsplash.com/photo-1490006388477-9ab871431fb6?auto=format&fit=crop&w=900&q=70",
    },
    stitky: ["Fix & Rent", "Pod tržním odhadem"],
    popis_upravy: "Klasika: Neuklizený byt, osobní věci majitele na fotkách.",
  },
  {
    id: 10,
    nazev: "Prostorný byt 3+kk novostavba",
    typ_transakce: "prodej",
    typ_nemovitosti: "byt",
    dispozice: "3+kk",
    lokalita: "Brno - Královo Pole",
    cena: 8900000,
    plocha_m2: 82,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 3,
    },
    stitky: ["Bez rekonstrukce"],
    popis_upravy: "Premium: Vizualizace možného zařízení pro prázdné novostavby.",
  },
  {
    id: 11,
    nazev: "Stavební pozemek na kraji lesa",
    typ_transakce: "prodej",
    typ_nemovitosti: "pozemek",
    dispozice: null,
    lokalita: "Čeladná",
    cena: 4200000,
    plocha_m2: 1100,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 7,
    },
    stitky: [],
    popis_upravy:
      "Premium: Zakreslení inženýrských sítí do fotky z dronu, vizualizace možného domu.",
  },
  {
    id: 12,
    nazev: "Komerční prostor pro kavárnu",
    typ_transakce: "pronajem",
    typ_nemovitosti: "komerce",
    dispozice: null,
    lokalita: "Ostrava - Centrum",
    cena: 25000,
    plocha_m2: 85,
    stav_inzeratu: "klasicky",
    obrazky: {
      hlavni:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=70",
    },
    stitky: ["Vysoký výnos"],
    popis_upravy: "Klasika: Strohý text, fotky prázdného zaprášeného prostoru.",
  },
  {
    id: 13,
    nazev: "Menší dům v řadové zástavbě",
    typ_transakce: "pronajem",
    typ_nemovitosti: "dum",
    dispozice: "3+kk",
    lokalita: "Pardubice",
    cena: 22000,
    plocha_m2: 95,
    stav_inzeratu: "klasicky",
    obrazky: {
      hlavni:
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=70",
    },
    stitky: ["Stabilní pronájem"],
    popis_upravy: "Klasika: Běžný popis, fotky za špatného počasí.",
  },
  {
    id: 14,
    nazev: "Apartmán na horách",
    typ_transakce: "prodej",
    typ_nemovitosti: "byt",
    dispozice: "2+kk",
    lokalita: "Špindlerův Mlýn",
    cena: 11500000,
    plocha_m2: 52,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 6,
    },
    stitky: ["Vysoký výnos", "Pozitivní cashflow", "Bez rekonstrukce"],
    popis_upravy:
      "Premium: Lifestyle fotky, detailní kalkulace ROI pro krátkodobé pronájmy v textu.",
  },
  {
    id: 15,
    nazev: "Chata u přehrady",
    typ_transakce: "prodej",
    typ_nemovitosti: "dum",
    dispozice: "2+1",
    lokalita: "Lipno nad Vltavou",
    cena: 6800000,
    plocha_m2: 70,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 4,
    },
    stitky: ["Vysoký výnos"],
    popis_upravy:
      "Premium: Dron s ukázkou vzdálenosti k vodě, zútulnění interiéru před focením.",
  },
  {
    id: 16,
    nazev: "Sdílený pokoj pro studenty",
    typ_transakce: "pronajem",
    typ_nemovitosti: "byt",
    dispozice: "4+1",
    lokalita: "Praha 6 - Dejvice",
    cena: 8000,
    plocha_m2: 15,
    stav_inzeratu: "klasicky",
    obrazky: {
      hlavni:
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=900&q=70",
    },
    stitky: ["Stabilní pronájem"],
    popis_upravy: "Klasika: Rychlá fotka na mobil, inzerát formou inzerce na Facebooku.",
  },
  {
    id: 17,
    nazev: "Skladovací hala",
    typ_transakce: "pronajem",
    typ_nemovitosti: "komerce",
    dispozice: null,
    lokalita: "Brno - Slatina",
    cena: 85000,
    plocha_m2: 450,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 5,
    },
    stitky: ["Stabilní pronájem"],
    popis_upravy: "Premium: 3D model haly, přesně kótovaný plánek, logistická dostupnost v textu.",
  },
  {
    id: 18,
    nazev: "Zemědělská půda",
    typ_transakce: "prodej",
    typ_nemovitosti: "pozemek",
    dispozice: null,
    lokalita: "Znojmo (okolí)",
    cena: 1500000,
    plocha_m2: 25000,
    stav_inzeratu: "klasicky",
    obrazky: {
      hlavni:
        "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=70",
    },
    stitky: [],
    popis_upravy: "Klasika: Jen screen z katastrální mapy.",
  },
  {
    id: 19,
    nazev: "Byt 4+1 ideální na spolubydlení",
    typ_transakce: "pronajem",
    typ_nemovitosti: "byt",
    dispozice: "4+1",
    lokalita: "Hradec Králové",
    cena: 24000,
    plocha_m2: 88,
    stav_inzeratu: "premium",
    obrazky: {
      pred_rekonstrukci:
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=70",
      po_rekonstrukci:
        "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=900&q=70",
      pocet_wow_fotek: 7,
    },
    stitky: ["Vysoký výnos", "Pozitivní cashflow"],
    popis_upravy: "Premium: Natočené Reels/TikTok video pro cílovou skupinu studentů.",
  },
  {
    id: 20,
    nazev: "Dům v insolvenci",
    typ_transakce: "prodej",
    typ_nemovitosti: "dum",
    dispozice: "4+kk",
    lokalita: "Teplice",
    cena: 2900000,
    plocha_m2: 110,
    stav_inzeratu: "klasicky",
    obrazky: {
      hlavni:
        "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=900&q=70",
    },
    stitky: ["Pod tržním odhadem", "Fix & Rent"],
    popis_upravy: "Klasika: Těžko čitelné fotky, strohé právní informace.",
  },
];

function shot(id: string): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;
}

const CATALOG_DETAIL: Record<number, Pick<Property, "detail_popis" | "galerie">> = {
  1: {
    detail_popis:
      "Byt 2+kk v cihlovém domě na Vysočanech, pět minut pěšky od metra B. Dispozice je běžná pražská: obývák s kuchyňským koutem, samostatná ložnice, koupelna s vanou a malá předsíň. Podlaha je původní, okna plastová zhruba z roku 2012. Dům má výtah a klidný dvůr.\n\nZa 6,5 milionu nejde o Vinohrady ani o novostavbu u řeky. Cena sedí na udržovaný menší byt u metra. Okolo je obchod, škola a park. Pro nájem je lokalita srozumitelná, ale výnos z inzerátu nepočítejte — jde o ukázkový text, ne o ověřenou kalkulaci.",
    galerie: [
      shot("1545324418-cc1a3fa10c00"),
      shot("1631679706909-1844bbd07221"),
      shot("1616594039964-ae9021a400a0"),
      shot("1584622650111-993a426fbf0a"),
    ],
  },
  2: {
    detail_popis:
      "Panelový byt 3+1 v Porubě, 4. patro bez výtahu. Jádro je stále umakartové, v koupelně je vana a starší baterie, v kuchyni linka z devadesátých let. Okna jsou vyměněná, podlahy jsou PVC a v obýváku staré parkety pod kobercem. Byt je vyklizený, ale nikdo ho před focením nepřipravoval.\n\n2,1 milionu je cena původního stavu na ostravském sídlišti, ne zařízeného bytu v centru. MHD a obchod jsou dole v ulici. Rekonstrukce jádra tu dává smysl, ale rozpočet na ni v inzerátu není — fotky ukazují to, co v bytě opravdu je.",
    galerie: [
      shot("1460317442991-0ec209397118"),
      shot("1484154218962-a197022b5858"),
      shot("1505691938895-1758d7feb511"),
    ],
  },
  3: {
    detail_popis:
      "Garsonka 28 m² v činžáku u centra Brna, vhodná spíš pro jednoho člověka nebo studenta. Kuchyňský kout je v jedné místnosti s postelí, koupelna je malá se sprchovým koutem. Dům je starší, bez výtahu, druhé patro.\n\nNájem 12 000 Kč včetně energií by byl na tuhle výměru nízký, proto počítejte spíš s nájmem bez služeb — v textu je uvedená nabídková částka 12 000 Kč měsíčně. Fotky po úpravě jsou homestaging malého bytu, ne loft.",
    galerie: [
      shot("1554995207-c18c203602cb"),
      shot("1598928506311-c55ded91a20c"),
      shot("1522708323590-d24dbb6b0267"),
    ],
  },
  4: {
    detail_popis:
      "Byt 2+1 v běžném olomouckém domě, nájem 14 500 Kč měsíčně. Obývák a ložnice jsou prázdné, světlo je odpolední a na fotkách z telefonu tmavší, než je byt ve dne. Kuchyně je funkční, spotřebiče starší, balkon na dvůr.\n\nV okolí je škola a zastávka. Inzerát neprošel úpravou: žádný homestaging, žádné 3D. Hodí se pro někoho, kdo si byt umí představit i z obyčejných snímků.",
    galerie: [
      shot("1493809842364-78817add7ffb"),
      shot("1505691938895-1758d7feb511"),
      shot("1545324418-cc1a3fa10c00"),
    ],
  },
  5: {
    detail_popis:
      "Rodinný dům 4+1 v Krnově se zahradou kolem 400 m². Přízemí má obývák, kuchyň a koupelnu, v patře jsou ložnice. Střecha je v pořádku, fasáda potřebuje nátěr, okna jsou mix plastu a původního dřeva. Topení je plynový kotel.\n\n5,2 milionu je cena udržovaného domu v menším městě, ne vily u Prahy. Zahrada je užitková, v ulici stojí podobné domy ze sedmdesátých a osmdesátých let. Premium úprava inzerátu znamená dron a uklizenou zahradu, ne mramor a bazén.",
    galerie: [
      shot("1448630360428-65456885c650"),
      shot("1416879595882-3373a0480b5b"),
      shot("1484154218962-a197022b5858"),
      shot("1572120360610-d971b9d7767c"),
    ],
  },
  6: {
    detail_popis:
      "Starší dům v Kladně, 5+kk na papíře, ve skutečnosti velké místnosti v původním stavu. Elektroinstalace je stará, koupelna v přízemí, topení kotlem na tuhá paliva. Střecha nezatéká, ale krytina je na konci životnosti. Fotky jsou jen z venku a pár tmavých záběrů chodby.\n\n3,8 milionu počítá s tím, že kupec bude rekonstruovat. Není to dům k nastěhování. V okolí je zástavba rodinných domů a autobus do centra.",
    galerie: [
      shot("1448630360428-65456885c650"),
      shot("1493809842364-78817add7ffb"),
      shot("1484154218962-a197022b5858"),
    ],
  },
  7: {
    detail_popis:
      "Mezonet 4+kk ve starším činžáku na Vinohradech, 130 m², výtah v domě. Spodní patro je obývák s kuchyní, nahoře ložnice a pracovna. Okna do vnitrobloku, stropy vyšší než v paneláku, podlahy dubové parkety v obytných místnostech. Koupelny jsou po dílčí úpravě kolem roku 2015.\n\n18,5 milionu je pražská cena většího bytu v dobré čtvrti, ne cena paláce. V docházkové vzdálenosti je náměstí Míru a tramvaj. Text zdůrazňuje materiály a klid dvora, protože u téhle ceny kupující porovnává právě lokalitu a stav domu.",
    galerie: [
      shot("1541849546-216549ae216d"),
      shot("1616486338812-3dadae4b4ace"),
      shot("1616594039964-ae9021a400a0"),
      shot("1584622650111-993a426fbf0a"),
    ],
  },
  8: {
    detail_popis:
      "Pronájem rodinného domu 5+kk v Říčanech, 45 000 Kč měsíčně. Dům je zhruba patnáct let starý, zateplený, s garáží pro jedno auto a zahradou. Kuchyň je na míru, ale ne z showroomu, podlahy vinyl a dlažba. Vhodné pro rodinu, která chce zůstat u Prahy a dojíždět.\n\nČástka je na horní hraně místního nájmu. Fotky jsou připravené pro zahraničního nájemce: uklizený interiér, žádné osobní věci. Nejde o vilu s bazénem.",
    galerie: [
      shot("1572120360610-d971b9d7767c"),
      shot("1600210492490-ec8edb0f5d0b"),
      shot("1631679706909-1844bbd07221"),
      shot("1416879595882-3373a0480b5b"),
    ],
  },
  9: {
    detail_popis:
      "Byt 1+1 na Slovanech v Plzni, 41 m², cena 2,8 milionu. Koupelna je původní, kuchyňská linka opotřebená, na fotkách jsou ještě krabice a nábytek majitele. Okna do ulice, třetí patro bez výtahu.\n\nLokalita je běžná plzeňská čtvrť s tramvají. Byt dává smysl jako menší vlastní bydlení nebo jako základ pro kosmetickou úpravu. Inzerát je neupravený schválně: má ukázat, jak vypadá nabídka bez přípravy.",
    galerie: [
      shot("1484154218962-a197022b5858"),
      shot("1505691938895-1758d7feb511"),
      shot("1493809842364-78817add7ffb"),
    ],
  },
  10: {
    detail_popis:
      "Novostavba 3+kk v Králově Poli, 82 m², 8,9 milionu. Byt je ve stavu po kolaudaci: bílé stěny, podlaha vinyl, kuchyňská příprava bez linky, koupelna obložená světlým obkladem. Parkování v ceně není, sklep ano. Dům je menší bytovka, ne mrakodrap.\n\nCena odpovídá novému bytu v Brně mimo historické centrum. Vizualizace zařízení na fotkách po úpravě je homestaging prázdného bytu, aby šlo odhadnout měřítko místností.",
    galerie: [
      shot("1598928506311-c55ded91a20c"),
      shot("1631679706909-1844bbd07221"),
      shot("1616594039964-ae9021a400a0"),
      shot("1545324418-cc1a3fa10c00"),
    ],
  },
  11: {
    detail_popis:
      "Stavební pozemek 1 100 m² na okraji Čeladné, 4,2 milionu. Svažitý, přístup ze zpevněné obecní cesty, sítě na hranici pozemku je potřeba ověřit u obce — v ukázce je nebereme jako jisté. Okolo je louka a les, ne satelit plný plotů.\n\nVizualizace domu na fotce po úpravě je dřevostavba v měřítku pozemku, ne skleněná vila. 4,2 milionu je cena pozemku, ne domu na klíč.",
    galerie: [
      shot("1441974231531-c6227db76b6e"),
      shot("1500382017468-9049fed747ef"),
      shot("1464822759023-fed622ff2c3b"),
    ],
  },
  12: {
    detail_popis:
      "Komerční prostor 85 m² v centru Ostravy k pronájmu za 25 000 Kč měsíčně. Dříve obchod, teď prázdný, podlaha je stará dlažba, stěny potřebují výmalbu, zázemí je jeden záchod a malý sklad. Výloha do ulice s provozem.\n\nFotky jsou strohé, protože prostor nikdo před návštěvou neuklidil. Na kavárnu se hodí dispozicí, ne současným stavem. Nájem je bez energií a bez úprav, které si nájemce udělá sám.",
    galerie: [
      shot("1497366216548-37526070297c"),
      shot("1497366754035-f200968a6e72"),
      shot("1460317442991-0ec209397118"),
    ],
  },
  13: {
    detail_popis:
      "Řadový dům 3+kk v Pardubicích, nájem 22 000 Kč měsíčně. Obývák, kuchyň, dvě ložnice, malá zahrádka do dvora. Vybavení je základní, podlahy laminát, koupelna se sprchou. Fotky vznikly za deště mobilem.\n\nJde o běžný pronájem pro rodinu, ne o designový dům. Zastávka a škola jsou v docházkové vzdálenosti. Kauce a energie v textu nejsou dopočítané.",
    galerie: [
      shot("1572120360610-d971b9d7767c"),
      shot("1522708323590-d24dbb6b0267"),
      shot("1416879595882-3373a0480b5b"),
    ],
  },
  14: {
    detail_popis:
      "Apartmán 2+kk ve Špindlerově Mlýně, 52 m², 11,5 milionu. Cena je vysoká kvůli horám, ne kvůli metráži: jde o menší byt v apartmánovém domě, ne o chatu na samotě. Obývák s kuchyňským koutem, ložnice, sprcha. Společná recepce v domě není.\n\nFotky po úpravě ukazují horský interiér se dřevem, jaký v Krkonoších potkáte v udržovaných apartmánech. Krátkodobý pronájem je v textu jen jako možnost, bez slíbeného výnosu.",
    galerie: [
      shot("1483728642387-6c3bdd6c93e5"),
      shot("1505691938895-1758d7feb511"),
      shot("1518780664697-55e3ad937233"),
      shot("1464822759023-fed622ff2c3b"),
    ],
  },
  15: {
    detail_popis:
      "Chata 2+1 u Lipna, 70 m², 6,8 milionu. Dřevostavba se sedlovou střechou, veranda, suché WC nebo malá koupelna podle sezónního režimu — v ukázce počítejte s jednoduchým sociálním zázemím, ne s wellness. K vodě je to pěšky, ne vlastní pláž.\n\nCena je za chatu v turistické obci, ne za hotel. Premium inzerát přidává letecký záběr okolí a uklizený interiér. Rekonstrukce na celoroční bydlení by byla další investice mimo kupní cenu.",
    galerie: [
      shot("1449844908441-8829872d2607"),
      shot("1439066615861-d1af74d74000"),
      shot("1518780664697-55e3ad937233"),
    ],
  },
  16: {
    detail_popis:
      "Pokoj 15 m² ve sdíleném bytě 4+1 v Dejvicích, 8 000 Kč měsíčně. Postel, stůl, skříň, společná kuchyň a jedna koupelna na byt. Fotka je z mobilu, v záběru je povlečení a kabel od notebooku.\n\nJde o studentský podnájem u metra Dejvická, ne o samostatný byt. V ceně bývají energie, ale v téhle ukázce to berte jako nabídkovou částku za pokoj. Smlouva a počet spolubydlících se řeší až na prohlídce.",
    galerie: [
      shot("1522771739844-6a9f6d5f14af"),
      shot("1484154218962-a197022b5858"),
      shot("1554995207-c18c203602cb"),
    ],
  },
  17: {
    detail_popis:
      "Hala 450 m² ve Slatině k pronájmu za 85 000 Kč měsíčně. Světlá výška umožňuje regály, vjezd pro dodávku, sociální zázemí v rohu haly. Podlaha je beton, osvětlení zářivky. Okolo jsou další sklady a nájezd na okruh.\n\nČástka sedí na brněnský sklad této velikosti, ne na kancelářskou budovu. Premium podklady přidávají plánek a čistší fotku interiéru. Úpravy na míru nájemce v nájmu nejsou.",
    galerie: [
      shot("1586528116311-ad8dd3c8310d"),
      shot("1587293852726-70cdb56c2866"),
      shot("1460317442991-0ec209397118"),
    ],
  },
  18: {
    detail_popis:
      "Orná půda 2,5 ha v okolí Znojma, 1,5 milionu. Pozemek je v jednom celku, přístup po polní cestě, bez stavebního povolení. Fotka je krajina a letecký pohled, žádný dům na parcele nestojí a stavět se tu v ukázce nepředpokládá.\n\nCena je za zemědělskou půdu, ne za stavební parcelu. Pro kupujícího je podstatný druh pozemku v katastru a přístup, ne vizualizace domu.",
    galerie: [
      shot("1500382017468-9049fed747ef"),
      shot("1625246333195-78d9c38ad449"),
      shot("1441974231531-c6227db76b6e"),
    ],
  },
  19: {
    detail_popis:
      "Byt 4+1 v Hradci Králové, 88 m², nájem 24 000 Kč měsíčně. Čtyři obyvatelná místnosti, společná kuchyň, jedna koupelna. Dům je panelový, výtah ano, balkon na východ. Po úpravě fotek je byt uklizený a světlý, předtím v něm bydlel víc lidí najednou.\n\n24 tisíc za celý byt, ne za pokoj. Pro spolubydlení čtyř lidí je to srozumitelná matematika, ale inzerát neslibuje obsazenost. Lokalita je u školy a trolejbusu.",
    galerie: [
      shot("1522708323590-d24dbb6b0267"),
      shot("1631679706909-1844bbd07221"),
      shot("1505691938895-1758d7feb511"),
      shot("1460317442991-0ec209397118"),
    ],
  },
  20: {
    detail_popis:
      "Rodinný dům 4+kk v Teplicích za 2,9 milionu, prodávaný z insolvence. Stav odpovídá ceně: fasáda oprýskaná, v interiéru staré podlahy, koupelna v původním jádru, topení na tuhá paliva. Právní text v ukázce nenahrazuje výpis z katastru ani podmínky dražby.\n\nFotky jsou špatně čitelné schválně — takhle vypadá neupravený inzerát. Dům není k nastěhování. Kdo počítá s opravou, musí si rozpočet sehnat sám; v datech žádný odhad rekonstrukce není.",
    galerie: [
      shot("1448630360428-65456885c650"),
      shot("1493809842364-78817add7ffb"),
      shot("1484154218962-a197022b5858"),
    ],
  },
};

export const mockProperties: Property[] = catalogSeed.map((item) => {
  const extra = CATALOG_DETAIL[item.id];
  if (!extra) {
    throw new Error(`Chybí detail ukázkového inzerátu ${item.id}`);
  }
  return { ...item, ...extra };
});

const CATALOG_SLUG_PREFIX = "ukazka-";

export function catalogPropertyHref(id: number): string {
  return `/nemovitosti/${CATALOG_SLUG_PREFIX}${id}`;
}

export function findCatalogPropertyBySlug(slug: string): Property | undefined {
  const match = new RegExp(`^${CATALOG_SLUG_PREFIX}(\\d+)$`).exec(slug);
  if (!match) return undefined;
  const id = Number(match[1]);
  return mockProperties.find((item) => item.id === id);
}

function includesText(haystack: string, needle: string | undefined): boolean {
  if (!needle) return true;
  return foldDiacritics(haystack).includes(foldDiacritics(needle));
}

/**
 * Keeps a listing only when every active filter matches.
 * A selected štítek must appear in `stitky` — missing tags do not pass.
 */
export function filterProperties(
  items: readonly Property[],
  state: PropertyUrlFilterState,
): Property[] {
  const text = state.q || state.lokalita;
  const kinds = new Set(
    state.typ
      .map((slug) => TYPE_SLUG_TO_KIND[slug])
      .filter((kind): kind is PropertyKind => Boolean(kind)),
  );
  const layouts = new Set(state.dispozice.map((value) => value.toLowerCase()));
  const tags = state.stitky ?? [];

  return items.filter((property) => {
    if (text) {
      const blob = `${property.nazev} ${property.lokalita}`;
      if (!includesText(blob, text)) return false;
    }
    if (state.nabidka === "prodej" && property.typ_transakce !== "prodej") return false;
    if (state.nabidka === "pronajem" && property.typ_transakce !== "pronajem") return false;
    if (state.nabidka === "drazba" || state.nabidka === "podil") return false;
    if (kinds.size > 0 && !kinds.has(property.typ_nemovitosti)) return false;
    if (layouts.size > 0) {
      if (!property.dispozice) return false;
      if (!layouts.has(property.dispozice.toLowerCase())) return false;
    }
    if (state.cenaOd != null && property.cena < state.cenaOd) return false;
    if (state.cenaDo != null && property.cena > state.cenaDo) return false;
    if (state.plochaOd != null && property.plocha_m2 < state.plochaOd) return false;
    if (state.plochaDo != null && property.plocha_m2 > state.plochaDo) return false;
    if (state.pozemekOd != null || state.pozemekDo != null) {
      if (property.typ_nemovitosti !== "pozemek") return false;
      if (state.pozemekOd != null && property.plocha_m2 < state.pozemekOd) return false;
      if (state.pozemekDo != null && property.plocha_m2 > state.pozemekDo) return false;
    }
    if (tags.length > 0 && !tags.every((tag) => property.stitky.includes(tag))) {
      return false;
    }
    return true;
  });
}
