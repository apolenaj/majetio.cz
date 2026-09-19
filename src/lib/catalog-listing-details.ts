import type { CivicAmenity, Property, PropertyGps } from "@/lib/mock-properties";

function shot(id: string): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;
}

const photo = {
  panel: shot("1770233447535-d557efaa1550"),
  brick: shot("1676578116771-8b5e17e9ce2d"),
  row: shot("1687255634768-71ca855616c6"),
  old: shot("1490006388477-9ab871431fb6"),
  euro: shot("1522708323590-d24dbb6b0267"),
  small: shot("1502672260266-1c1ef2d93688"),
  staged: shot("1586023492125-27b2c045efd7"),
  kitchen: shot("1600566753190-17f0baa2a6c3"),
  field: shot("1500382017468-9049fed747ef"),
  forest: shot("1441974231531-c6227db76b6e"),
  farm: shot("1625246333195-78d9c38ad449"),
  mountain: shot("1464822759023-fed622ff2c3b"),
  hall: shot("1586528116311-ad8dd3c8310d"),
  hall2: shot("1587293852726-70cdb56c2866"),
  room: shot("1555854877-bab0e564b8d5"),
};

function popis(oNemovitosti: string, technickyStav: string, potencial: string): string {
  return [
    "O nemovitosti",
    oNemovitosti,
    "Technický stav",
    technickyStav,
    "Potenciál a investice",
    potencial,
  ].join("\n\n");
}

function nearby(items: Array<[CivicAmenity["kategorie"], string, string]>): CivicAmenity[] {
  return items.map(([kategorie, nazev, vzdalenost]) => ({ kategorie, nazev, vzdalenost }));
}

function gps(lat: number, lng: number): PropertyGps {
  return { lat, lng };
}

export const CATALOG_DETAIL: Record<
  number,
  Pick<Property, "detail_popis" | "galerie" | "obcanska_vybavenost" | "lokalita_gps">
> = {
  1: {
    lokalita_gps: gps(50.1098, 14.5012),
    detail_popis: popis(
      "Nabízíme byt 2+kk v cihlovém domě na Vysočanech, pět minut pěšky od metra B Kolbenova. Dispozice je běžná pražská: obývací pokoj s kuchyňským koutem, samostatná ložnice, koupelna a předsíň. Dům má výtah a klidný vnitroblok. Nabídková cena je 6,5 milionu.",
      "Podlahy jsou původní, okna plastová zhruba z roku 2012, stoupačky funkční. Byt je po dílčí úpravě povrchů, ne po kompletní rekonstrukci jádra. Fotografie v galerii jsou ilustrační, ne dokumentace této jednotky.",
      "Lokalita dává smysl pro vlastní bydlení i pro dlouhodobý pronájem u metra. Plánované úpravy si doplňte do rozpočtu níže — text sám výnos nepočítá.",
    ),
    galerie: [photo.euro, photo.small],
    obcanska_vybavenost: nearby([
      ["transport", "Metro B Kolbenova", "400 m (5 min pěšky)"],
      ["shopping", "Obchod a drogerie v ulici", "200 m (3 min pěšky)"],
      ["education", "ZŠ Špitálská", "700 m (9 min pěšky)"],
      ["health", "Praktický lékař", "900 m (11 min pěšky)"],
    ]),
  },
  2: {
    lokalita_gps: gps(49.8308, 18.1685),
    detail_popis: popis(
      "Panelový byt 3+1 v Ostravě-Porubě, čtvrté patro bez výtahu. Tři pokoje, kuchyň, předsíň a umakartové jádro. Byt je vyklizený. Cena 2,1 milionu je za původní stav na sídlišti.",
      "Jádro je stále umakartové, v koupelně vana a starší baterie, kuchyňská linka z devadesátých let. Okna jsou vyměněná, podlahy PVC a v obýváku staré parkety pod krytinou. Fotky jsou z domu a z neupraveného interiéru, bez homestagingu.",
      "Rekonstrukce jádra tu dává smysl, ale její cenu inzerát neobsahuje. MHD a obchod jsou dole v ulici. Pro kupujícího je to základ k bydlení nebo k postupné úpravě, ne hotový investiční produkt s dopočítaným výnosem.",
    ),
    galerie: [photo.old, photo.small, photo.panel],
    obcanska_vybavenost: nearby([
      ["transport", "Zastávka MHD Hlavní třída", "180 m (2 min pěšky)"],
      ["shopping", "Albert v přízemí ulice", "250 m (3 min pěšky)"],
      ["education", "ZŠ Porubská", "600 m (8 min pěšky)"],
      ["health", "Lékařský dům Poruba", "1,1 km (4 min autem)"],
    ]),
  },
  3: {
    lokalita_gps: gps(49.1952, 16.608),
    detail_popis: popis(
      "Garsonka 28 m² v činžovním domě u centra Brna. Jedna místnost s kuchyňským koutem, malá koupelna se sprchou, druhé patro bez výtahu. Nabídkový nájem je 12 000 Kč měsíčně. Hodí se pro jednoho člověka, ne pro pár do loftu.",
      "Dům je starší, jádro po dílčí výměně obkladů, podlaha vinyl. Fotografie v galerii jsou ilustrační. Dispozice odpovídá malé garsonce, ne loftu.",
      "Pro majitele je to malá jednotka v docházkové vzdálenosti od centra. Text neslibuje obsazenost ani čistý výnos. Energie a služby je potřeba ověřit ve smlouvě, v ukázce je uvedena nabídková částka.",
    ),
    galerie: [photo.small, photo.old, photo.euro],
    obcanska_vybavenost: nearby([
      ["transport", "Tramvajová zastávka", "220 m (3 min pěšky)"],
      ["shopping", "Potraviny na rohu", "150 m (2 min pěšky)"],
      ["education", "Masarykova univerzita, docházka", "1,4 km (17 min pěšky)"],
      ["health", "Lékárna", "400 m (5 min pěšky)"],
    ]),
  },
  4: {
    lokalita_gps: gps(49.5938, 17.2509),
    detail_popis: popis(
      "Pronájem bytu 2+1 v běžném olomouckém domě, 61 m², 14 500 Kč měsíčně. Obývák, ložnice, kuchyň a balkon do dvora. Inzerát je bez homestagingu: místnosti jsou prázdnější a světlo na fotkách z telefonu je odpolední.",
      "Kuchyně je funkční, spotřebiče starší, koupelna po výměně vany. Okna plastová, stoupačky v pořádku. Dům je cihlový, výtah v sekci není. Stav odpovídá běžnému pronájmu, ne rekonstruovanému bytu na míru.",
      "Lokalita sedí na dlouhodobý pronájem u školy a zastávky. Kauce a rozpis energií v textu nejsou. Pro nájemce je podstatné, že byt jde obývat bez rekonstrukce, ne že by šlo o designový interiér.",
    ),
    galerie: [photo.old, photo.panel, photo.small],
    obcanska_vybavenost: nearby([
      ["transport", "Zastávka tramvaje", "300 m (4 min pěšky)"],
      ["education", "ZŠ v docházkové vzdálenosti", "500 m (6 min pěšky)"],
      ["shopping", "Penny Market", "700 m (9 min pěšky)"],
      ["health", "Poliklinika", "1,3 km (4 min autem)"],
    ]),
  },
  5: {
    lokalita_gps: gps(50.0905, 17.7038),
    detail_popis: popis(
      "Exkluzivně nabízíme k prodeji rodinný dům o dispozici 4+1 v klidné lokalitě Krnova. V přízemí se nachází prostorný obývací pokoj prosluněný okny do zahrady, kuchyň s jídelním koutem a koupelna. V patře jsou tři neprůchozí ložnice. K domu náleží rovinatá zahrada kolem 400 m².",
      "Dům je v udržovaném stavu před částečnou rekonstrukcí. Střecha prošla revizí, vytápění řeší plynový kotel, fasáda potřebuje nátěr a okna jsou mix novějších plastových a původních dřevěných. Stavba je zděná, se sedlovou střechou.",
      "Nemovitost dává smysl jako rodinné bydlení s možností úprav podle vlastních představ. Další práce si kupující nacení sám — inzerát rozpočet rekonstrukce neobsahuje a neslibuje výnos z pronájmu.",
    ),
    // Jedna konzistentní ilustrace domu — ne koláž cizích staveb a krajiny.
    galerie: [],
    obcanska_vybavenost: nearby([
      ["education", "MŠ Smetanova", "300 m (4 min pěšky)"],
      ["education", "ZŠ Janáčkovo náměstí", "800 m (10 min pěšky)"],
      ["shopping", "Kaufland", "1,2 km (3 min autem)"],
      ["transport", "Autobusová zastávka", "150 m (2 min pěšky)"],
      ["health", "Poliklinika a lékárna", "1,5 km (4 min autem)"],
    ]),
  },
  6: {
    lokalita_gps: gps(50.143, 14.105),
    detail_popis: popis(
      "Starší zděný dům v Kladně, na papíře 5+kk, ve skutečnosti velké místnosti v původním členění. Přízemí obývák, kuchyň a hygienické zázemí, v patře ložnice. Cena 3,8 milionu počítá s tím, že kupec bude rekonstruovat. Není to dům k nastěhování příští týden.",
      "Elektroinstalace je stará, koupelna v přízemí v původním jádru, topení kotlem na tuhá paliva. Střecha nezatéká, krytina je na konci životnosti. Fasáda je cihlová se sedlovou střechou, bez nové zateplené obálky. Fotografie jsou ilustrační snímky domu a neupraveného interiéru.",
      "Smysl dává jako základ pro rodinu, která si dům upraví po svém. Okolí je zástavba rodinných domů a autobus do centra. Odhad nákladů na rekonstrukci v datech není a z inzerátu ho neodvozujte.",
    ),
    galerie: [photo.old, photo.brick, photo.row],
    obcanska_vybavenost: nearby([
      ["transport", "Autobus do centra Kladna", "200 m (3 min pěšky)"],
      ["shopping", "Lidl", "1,1 km (3 min autem)"],
      ["education", "ZŠ Amálská", "900 m (11 min pěšky)"],
      ["health", "Nemocnice Kladno", "2,4 km (6 min autem)"],
    ]),
  },
  7: {
    lokalita_gps: gps(50.0754, 14.441),
    detail_popis: popis(
      "Mezonet 4+kk ve starším činžáku na Vinohradech, 130 m². Spodní podlaží je obývák s kuchyní, nahoře ložnice a pracovna. Stropy jsou vyšší než v paneláku, okna do vnitrobloku, v domě je výtah. Cena 18,5 milionu je nabídková cena tohoto bytu.",
      "Podlahy v obytných místnostech jsou dubové parkety, koupelny po dílčí úpravě kolem roku 2015. Dům je zděný, fasáda ulice udržovaná. Fotografie jsou ilustrační; materiály v textu odpovídají činžáku.",
      "Kupující u téhle ceny porovnává lokalitu u náměstí Míru a stav domu, ne metráž samotnou. Text zdůrazňuje dispozici a materiály. Není to posudek a neobsahuje dopočítaný výnos z krátkodobého pronájmu.",
    ),
    galerie: [photo.euro, photo.staged, photo.kitchen, photo.old],
    obcanska_vybavenost: nearby([
      ["transport", "Tramvaj náměstí Míru", "450 m (6 min pěšky)"],
      ["shopping", "Obchody na Vinohradské", "300 m (4 min pěšky)"],
      ["education", "ZŠ na Sázavské", "600 m (8 min pěšky)"],
      ["health", "Poliklinika Vinohrady", "1,0 km (12 min pěšky)"],
    ]),
  },
  8: {
    lokalita_gps: gps(49.9915, 14.654),
    detail_popis: popis(
      "Pronájem rodinného domu 5+kk v Říčanech, 160 m², 45 000 Kč měsíčně. Dům je zděný, zhruba patnáct let starý, s garáží pro jedno auto a zahradou. Vhodné pro rodinu, která chce zůstat u Prahy a dojíždět.",
      "Zateplená obálka, kuchyň na míru, podlahy vinyl a dlažba. Topení plynový kotel. Fotografie jsou ilustrační; interiér v textu je běžný rodinný dům bez luxusních materiálů.",
      "Částka je na horní hraně místního nájmu za dům této velikosti. V textu nejsou energie ani kauce. Pro pronajímatele je to stabilní rodinný nájem, ne krátkodobý apartmán s dopočítanou obsazeností.",
    ),
    galerie: [photo.brick, photo.row, photo.euro, photo.field],
    obcanska_vybavenost: nearby([
      ["transport", "Vlak Říčany, nádraží", "1,6 km (5 min autem)"],
      ["education", "ZŠ Říčany", "800 m (10 min pěšky)"],
      ["shopping", "Tesco", "1,4 km (4 min autem)"],
      ["health", "Lékař a lékárna u náměstí", "1,2 km (15 min pěšky)"],
    ]),
  },
  9: {
    lokalita_gps: gps(49.7265, 13.3955),
    detail_popis: popis(
      "Byt 1+1 na Slovanech v Plzni, 41 m², cena 2,8 milionu. Třetí patro bez výtahu, okna do ulice. Malý byt pro vlastní bydlení nebo jako základ po kosmetické úpravě. Inzerát je neupravený: na fotkách je ještě původní kuchyně a běžný panelový dům.",
      "Koupelna je původní, kuchyňská linka opotřebená, jádro nebylo vybourané. Okna vyměněná, elektroinstalace částečně původní. Stav odpovídá ceně menšího bytu v běžné plzeňské čtvrti, ne rekonstruované garsonce v centru.",
      "Tramvaj je v docházkové vzdálenosti. Kdo počítá s novým jádrem, ať si sežene rozpočet — v datech žádný odhad rekonstrukce není. Text neslibuje podtržní výnos.",
    ),
    galerie: [photo.panel, photo.old, photo.small],
    obcanska_vybavenost: nearby([
      ["transport", "Tramvaj Slovany", "250 m (3 min pěšky)"],
      ["shopping", "Coop v ulici", "200 m (3 min pěšky)"],
      ["education", "ZŠ Slovany", "550 m (7 min pěšky)"],
      ["health", "Lékárna", "400 m (5 min pěšky)"],
    ]),
  },
  10: {
    lokalita_gps: gps(49.228, 16.5955),
    detail_popis: popis(
      "Novostavba 3+kk v Brně-Králově Poli, 82 m², 8,9 milionu. Byt je ve stavu po kolaudaci v menší bytovce, ne v mrakodrapu. Obývák s kuchyní, dvě ložnice, koupelna, sklep. Parkování v ceně není.",
      "Bílé stěny, podlaha vinyl, kuchyňská příprava bez linky, koupelna se světlým obkladem. Rozvody nové. Fotografie jsou ilustrační a slouží jen k představě měřítka místností.",
      "Cena odpovídá novému bytu v Brně mimo historické centrum. Pro kupujícího je to bydlení bez rekonstrukce jádra. Výnos z pronájmu text nepočítá.",
    ),
    galerie: [photo.staged, photo.euro, photo.small, photo.kitchen],
    obcanska_vybavenost: nearby([
      ["transport", "Tramvaj Královo Pole", "400 m (5 min pěšky)"],
      ["shopping", "Albert", "350 m (4 min pěšky)"],
      ["education", "VUT v docházkové vzdálenosti", "1,2 km (15 min pěšky)"],
      ["health", "Poliklinika", "900 m (11 min pěšky)"],
    ]),
  },
  11: {
    lokalita_gps: gps(49.548, 18.33),
    detail_popis: popis(
      "Stavební pozemek 1 100 m² na okraji Čeladné, 4,2 milionu. Svažitý, přístup ze zpevněné obecní cesty, okolo louka a les. Cena je za pozemek, ne za dům na klíč.",
      "Sítě na hranici pozemku je potřeba ověřit u obce — v ukázce je nebereme jako jisté. Na parcele dnes nestojí stavba. Fotografie jsou ilustrační snímky okolí a terénu.",
      "Pro kupujícího je podstatný územní plán a přístup. Inzerát stavební povolení nepředjímá a náklady na dům neuvádí.",
    ),
    galerie: [photo.forest, photo.field, photo.brick],
    obcanska_vybavenost: nearby([
      ["shopping", "Potraviny v obci", "1,8 km (4 min autem)"],
      ["transport", "Autobusová zastávka", "600 m (8 min pěšky)"],
      ["education", "MŠ a ZŠ ve Frýdlantu nad Ostravicí", "9 km (12 min autem)"],
      ["health", "Lékař ve Frýdlantu", "9 km (12 min autem)"],
    ]),
  },
  12: {
    lokalita_gps: gps(49.8356, 18.2923),
    detail_popis: popis(
      "Komerční prostor 85 m² v centru Ostravy k pronájmu za 25 000 Kč měsíčně. Dříve obchod, teď prázdný, výloha do ulice s provozem. Na kavárnu se hodí dispozicí, ne současným stavem. Nájem je nabídková částka bez energií.",
      "Podlaha je stará dlažba, stěny potřebují výmalbu, zázemí je jeden záchod a malý sklad. Rozvody vody a elektřiny jsou funkční, ale ne nové. Fotky jsou strohé schválně: prázdný provoz, ne hotová kavárna s bary a designovým nábytkem.",
      "Úpravy si udělá nájemce. Pro provozovatele je to výloha v centru, ne kancelářský open space. Obsazenost ani tržby text neslibuje.",
    ),
    galerie: [photo.hall2, photo.panel, photo.old],
    obcanska_vybavenost: nearby([
      ["transport", "Zastávka u Masarykova náměstí", "250 m (3 min pěšky)"],
      ["shopping", "Obchody v pěší zóně", "100 m (1 min pěšky)"],
      ["education", "Jazyková škola v centru", "400 m (5 min pěšky)"],
      ["health", "Lékárna", "300 m (4 min pěšky)"],
    ]),
  },
  13: {
    lokalita_gps: gps(50.0343, 15.7812),
    detail_popis: popis(
      "Řadový dům 3+kk v Pardubicích k pronájmu za 22 000 Kč měsíčně, 95 m². Obývák, kuchyň, dvě ložnice a malá zahrádka do dvora. Jde o běžný rodinný pronájem, ne o designový dům. Fotky vznikly bez homestagingu.",
      "Zděná řadovka se sedlovou střechou, podlahy laminát, koupelna se sprchou, topení plynový kotel. Vybavení je základní a funkční. Dům je zateplený jen částečně, okna plastová. Stav odpovídá nájmu, ne novostavbě.",
      "Zastávka a škola jsou v docházkové vzdálenosti. Kauce a energie v textu nejsou dopočítané. Pro nájemce je to bydlení bez rekonstrukce, pro majitele dlouhodobý pronájem bez slíbené obsazenosti.",
    ),
    galerie: [photo.brick, photo.row, photo.small],
    obcanska_vybavenost: nearby([
      ["transport", "Trolejbus", "280 m (4 min pěšky)"],
      ["education", "ZŠ Staňkova", "500 m (6 min pěšky)"],
      ["shopping", "Billa", "650 m (8 min pěšky)"],
      ["health", "Praktický lékař", "800 m (10 min pěšky)"],
    ]),
  },
  14: {
    lokalita_gps: gps(50.7255, 15.608),
    detail_popis: popis(
      "Apartmán 2+kk ve Špindlerově Mlýně, 52 m², 11,5 milionu. Cena je vysoká kvůli horám, ne kvůli metráži: jde o menší byt v apartmánovém domě, ne o hotel ani o chatu na samotě. Obývák s kuchyňským koutem, ložnice, sprcha.",
      "Dům je zděný, byt po úpravě povrchů, podlahy vinyl, koupelna se sprchovým koutem. Společná recepce v domě není. Fotografie jsou ilustrační snímky okolí a interiéru v měřítku asi 52 m².",
      "Krátkodobý pronájem je možnost, ne slíbený výnos. Sezónnost, poplatky obci a správa se řeší mimo tento text. Kupní cena odráží lokalitu v Krkonoších.",
    ),
    galerie: [photo.mountain, photo.small, photo.euro, photo.forest],
    obcanska_vybavenost: nearby([
      ["transport", "Autobusové nádraží", "400 m (5 min pěšky)"],
      ["shopping", "Potraviny v centru", "250 m (3 min pěšky)"],
      ["health", "Horská služba a lékárna", "600 m (8 min pěšky)"],
      ["education", "ZŠ ve Vrchlabí", "16 km (20 min autem)"],
    ]),
  },
  15: {
    lokalita_gps: gps(48.6394, 14.2286),
    detail_popis: popis(
      "Chata 2+1 u Lipna, 70 m², 6,8 milionu. Jednoduchý rekreační objekt se sedlovou střechou a verandou. K vodě je to pěšky, ne vlastní pláž. Cena je za chatu v turistické obci.",
      "Konstrukce dřevěná na zděné podezdívce, sociální zázemí jednoduché, vytápění lokální. Na celoroční bydlení by byla potřeba další investice mimo kupní cenu.",
      "Smysl dává jako druhé bydlení u vody. Přestavba na celoroční dům ani výnos z krátkodobého pronájmu nejsou v ceně. Územní režim rekreačního objektu si ověřte na obci.",
    ),
    galerie: [photo.forest, photo.mountain, photo.small],
    obcanska_vybavenost: nearby([
      ["shopping", "Potraviny v Lipně nad Vltavou", "1,2 km (3 min autem)"],
      ["transport", "Autobus", "700 m (9 min pěšky)"],
      ["health", "Lékař v Českém Krumlově", "22 km (25 min autem)"],
      ["education", "ZŠ v Českém Krumlově", "22 km (25 min autem)"],
    ]),
  },
  16: {
    lokalita_gps: gps(50.1025, 14.393),
    detail_popis: popis(
      "Pokoj 15 m² ve sdíleném bytě 4+1 v Dejvicích, 8 000 Kč měsíčně. Postel, stůl, skříň, společná kuchyň a jedna koupelna na celý byt. Jde o studentský podnájem u metra Dejvická, ne o samostatný byt.",
      "Dům je činžovní, pokoj v původním stavu, nábytek základní. Fotka je z mobilu, bez homestagingu. Společné prostory odpovídají spolubydlení, ne hotelovému standardu.",
      "V ceně bývají energie, ale v téhle ukázce berte částku jako nabídku za pokoj. Počet spolubydlících a smlouva se řeší na prohlídce. Text neslibuje volné místo k datu nastěhování.",
    ),
    galerie: [photo.room, photo.old, photo.small],
    obcanska_vybavenost: nearby([
      ["transport", "Metro A Dejvická", "350 m (4 min pěšky)"],
      ["education", "ČVUT", "700 m (9 min pěšky)"],
      ["shopping", "Albert na Dejvické", "400 m (5 min pěšky)"],
      ["health", "Lékárna", "300 m (4 min pěšky)"],
    ]),
  },
  17: {
    lokalita_gps: gps(49.1775, 16.685),
    detail_popis: popis(
      "Hala 450 m² v Brně-Slatině k pronájmu za 85 000 Kč měsíčně. Světlá výška na regály, vjezd pro dodávku, sociální zázemí v rohu. Okolo jsou další sklady a nájezd na okruh. Částka sedí na sklad této velikosti, ne na kancelářskou budovu.",
      "Podlaha beton, osvětlení zářivky, vrata sekční. Rozvody v provozuschopném stavu, bez kancelářských příček a bez klimatizovaného open space. Prémiové podklady přidávají čistší fotku interiéru a plánek v textu, ne 3D vizualizaci kanceláří.",
      "Úpravy na míru nájemce v nájmu nejsou. Pro logistiku je podstatná výška, vjezd a okruh. Výnos ani obsazenost text nepočítá.",
    ),
    galerie: [photo.hall, photo.hall2, photo.field],
    obcanska_vybavenost: nearby([
      ["transport", "Nájezd na brněnský okruh", "1,5 km (3 min autem)"],
      ["shopping", "Čerpací stanice a občerstvení", "800 m (2 min autem)"],
      ["health", "Závodní lékař ve Slatině", "2 km (4 min autem)"],
      ["education", "Střední škola v docházkové zóně areálu", "1,6 km (4 min autem)"],
    ]),
  },
  18: {
    lokalita_gps: gps(48.8555, 16.0488),
    detail_popis: popis(
      "Orná půda 2,5 ha v okolí Znojma, 1,5 milionu. Pozemek je v jednom celku, přístup po polní cestě. Na parcele nestojí dům a v ukázce se se stavbou nepočítá. Cena je za zemědělskou půdu, ne za stavební parcelu.",
      "Druh pozemku a způsob ochrany je potřeba ověřit v katastru. Fotografie jsou pole a krajina, žádný render domu. Bonita a pacht v textu nejsou — neberte je jako ověřené.",
      "Pro kupujícího je podstatný přístup, výměra a druh pozemku. Investiční příběh o zástavbě sem nepatří. Inzerát stavební povolení nepředpokládá.",
    ),
    galerie: [photo.field, photo.farm, photo.forest],
    obcanska_vybavenost: nearby([
      ["transport", "Silnice III. třídy", "700 m (2 min autem)"],
      ["shopping", "Znojmo, obchod", "8 km (10 min autem)"],
      ["health", "Nemocnice Znojmo", "9 km (12 min autem)"],
      ["education", "ZŠ Znojmo", "8 km (11 min autem)"],
    ]),
  },
  19: {
    lokalita_gps: gps(50.2104, 15.8252),
    detail_popis: popis(
      "Byt 4+1 v Hradci Králové, 88 m², nájem 24 000 Kč měsíčně za celý byt, ne za pokoj. Čtyři místnosti, kuchyň, koupelna, balkon. Dům je panelový, výtah ano. Lokalita u školy a trolejbusu.",
      "Po úpravě povrchů je byt uklizený a světlý, jádro je po výměně umakartu za zděné, podlahy vinyl. Fotografie jsou ilustrační snímky panelového domu a běžného bytu.",
      "Pro spolubydlení čtyř lidí je matematika nájmu srozumitelná, ale inzerát neslibuje obsazenost. Energie v částce nejsou rozepsané. Jde o pronájem celého bytu v udržovaném paneláku.",
    ),
    galerie: [photo.panel, photo.old, photo.small, photo.euro],
    obcanska_vybavenost: nearby([
      ["transport", "Trolejbus", "200 m (3 min pěšky)"],
      ["education", "ZŠ a SŠ v okolí", "500 m (6 min pěšky)"],
      ["shopping", "Kaufland", "1,0 km (3 min autem)"],
      ["health", "Fakultní nemocnice", "2,2 km (6 min autem)"],
    ]),
  },
  20: {
    lokalita_gps: gps(50.6404, 13.8245),
    detail_popis: popis(
      "Rodinný dům 4+kk v Teplicích za 2,9 milionu, prodávaný z insolvence. Zděný dům se sedlovou střechou, 110 m². Stav odpovídá ceně: není to dům k nastěhování a není to dražba s dopočítanou slevou vůči odhadu. Právní text v ukázce nenahrazuje výpis z katastru ani podmínky řízení.",
      "Fasáda potřebuje opravu, v interiéru staré podlahy, koupelna v původním jádru, topení na tuhá paliva. Elektroinstalace původní. Fotky jsou z exteriéru domu a z neupravené kuchyně, bez homestagingu a bez dřevěné verandy.",
      "Kdo počítá s opravou, musí si rozpočet sehnat sám. V datech žádný odhad rekonstrukce není. Smysl dává jako levnější dům v severních Čechách pro kupujícího, který si prověří insolvenční spis, ne jako hotová investice.",
    ),
    galerie: [photo.old, photo.brick, photo.row],
    obcanska_vybavenost: nearby([
      ["transport", "Autobus", "250 m (3 min pěšky)"],
      ["shopping", "Penny Market", "800 m (10 min pěšky)"],
      ["education", "ZŠ v Teplicích", "700 m (9 min pěšky)"],
      ["health", "Nemocnice Teplice", "2 km (5 min autem)"],
    ]),
  },
};
