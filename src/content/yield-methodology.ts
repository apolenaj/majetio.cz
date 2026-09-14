/**
 * Public-facing methodology copy — no security / implementation internals.
 */

export const YIELD_METHODOLOGY = {
  title: "Jak Majetio počítá výnos a cash flow",
  lead:
    "Srozumitelný popis toho, co znamenají naše metriky a jaké předpoklady do výpočtu vstupují. Nejde o investiční doporučení — budoucí nájem, ceny i sazby se mění.",
  sections: [
    {
      id: "zaklad",
      title: "Od čeho počítáme",
      paragraphs: [
        "Základem je kupní cena a související pořizovací náklady (například poplatky, rekonstrukce nebo vybavení, pokud je zadáte). Tomuto součtu říkáme celkové pořizovací náklady — právě jimi dělíme výnosové ukazatele, aby výsledek neodrážel jen „holou“ cenu nemovitosti.",
        "Pokud některý údaj chybí, výsledek u dané metriky nezobrazíme jako nulu. Raději uvedeme, že vstup nestačí — nula by působila jako jistý výsledek.",
      ],
    },
    {
      id: "najem-noi",
      title: "Nájem, neobsazenost a NOI",
      paragraphs: [
        "Z měsíčního nebo ročního nájmu spočítáme potenciální hrubý příjem při plné obsazenosti. Od něj odečteme ztrátu z neobsazenosti (vacancy) a dostaneme efektivní hrubý příjem.",
        "Po odečtení provozních nákladů majitele vzniká NOI (čistý provozní výnos). Do NOI nepatří splátka hypotéky — tu řešíme až u cash flow. Zálohy SVJ, které jen protečou, do provozních nákladů NOI nepočítáme.",
      ],
    },
    {
      id: "vynosy",
      title: "Hrubý a čistý výnos, cap rate",
      paragraphs: [
        "Hrubý výnos = efektivní hrubý příjem ÷ celkové pořizovací náklady.",
        "Čistý výnos = NOI ÷ celkové pořizovací náklady. To je hlavní výnosový ukazatel v Majetio.",
        "Cap rate počítáme jako NOI ÷ hodnota (ve výchozím year-1 výpočtu obvykle stejná báze jako pořizovací náklady). U vlastního bydlení výnosové metriky nezobrazujeme jako 0 % — označíme je jako nepoužitelné.",
      ],
    },
    {
      id: "cash-flow",
      title: "Cash flow a financování",
      paragraphs: [
        "Roční cash flow po financování = NOI minus roční náklad na úvěr (splátky). Měsíční cash flow je obdobný poměr.",
        "Splátku modelujeme z jistiny, nominální úrokové sazby a splatnosti (anuita). Uváděná RPSN/APR slouží ke srovnání nabídek, ne jako vstup do naší anuity.",
        "Záporné cash flow je běžný výsledek u silně financovaných nemovitostí — není to chyba kalkulačky. U koupě bez úvěru cash flow odpovídá NOI a ukazatel pokrytí splátek (DSCR) nepoužíváme.",
      ],
    },
    {
      id: "coc-irr",
      title: "Návratnost kapitálu (CoC, IRR)",
      paragraphs: [
        "Cash-on-cash ukazuje, jaký podíl vlastního kapitálu vrátí roční cash flow v prvním modelovém roce.",
        "Na delším horizontu můžeme ukázat modelovaný IRR a equity multiple — vycházejí z řady peněžních toků a předpokladů růstu. Jsou citlivé na vstupy a mohou být i záporné nebo nejednoznačné.",
      ],
    },
    {
      id: "scenare",
      title: "Scénáře a citlivost",
      paragraphs: [
        "Konzervativní, realistický a optimistický scénář upravují výchozí předpoklady (například neobsazenost nebo sazbu) podle zveřejněné verze předpokladů Majetio.",
        "Citlivostní tabulka ukazuje, jak se cash flow mění při změně úroku nebo příjmu. Barva je jen doplněk — v každé buňce je vždy číslo.",
      ],
    },
    {
      id: "omezeni",
      title: "Co model záměrně neříká",
      paragraphs: [
        "Výpočty jsou před zdaněním. Nezohledňujeme individuální daňovou situaci.",
        "Neodhadujeme automaticky budoucí hodnotu po rekonstrukci (ARV) ani maximální nabídkovou cenu — tyto nástroje připravujeme samostatně a nechceme je nahrazovat falešnými čísly.",
        "Verze výpočetního jádra a verze předpokladů se u uložených analýz uchovávají, aby bylo zpětně jasné, čím byl výsledek spočítán.",
      ],
    },
  ],
  relatedLinks: [
    { href: "/metodika", label: "Obecná metodika Majetio" },
    { href: "/kalkulacky/investicni-vynos", label: "Kalkulačka investičního výnosu" },
    { href: "/pravni-upozorneni", label: "Právní upozornění" },
  ],
} as const;
