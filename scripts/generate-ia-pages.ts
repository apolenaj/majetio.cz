import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();

function write(rel: string, content: string) {
  const full = join(root, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, "utf8");
  console.log("wrote", rel);
}

function prep(title: string, description: string, opts?: { noIndex?: boolean }) {
  return `import type { Metadata } from "next";
import { PreparingPage } from "@/components/content/page-helpers";

export const metadata: Metadata = {
  title: ${JSON.stringify(title)},
  description: ${JSON.stringify(description)},
  robots: { index: ${opts?.noIndex ? "false" : "true"}, follow: ${opts?.noIndex ? "false" : "true"} },
};

export default function Page() {
  return (
    <PreparingPage
      title=${JSON.stringify(title)}
      description=${JSON.stringify(description)}
    />
  );
}
`;
}

function legal(title: string, description: string, path: string) {
  return `import type { Metadata } from "next";
import { LegalPage, preparePageMeta } from "@/components/content/page-helpers";

export const metadata: Metadata = preparePageMeta({
  title: ${JSON.stringify(title)},
  description: ${JSON.stringify(description)},
  path: ${JSON.stringify(path)},
});

export default function Page() {
  return (
    <LegalPage title=${JSON.stringify(title)} description=${JSON.stringify(description)}>
      <p>
        Text této stránky bude doplněn právním týmem před spuštěním produkčních služeb.
        Záměrně zde neuvádíme fiktivní znění podmínek.
      </p>
      <p>Struktura stránky: červenec 2026.</p>
    </LegalPage>
  );
}
`;
}

const publicPreps: [string, string, string][] = [
  ["o-majetio", "O Majetio", "Kdo za Majetio stojí a jaký problém řešíme."],
  ["kontakt", "Kontakt", "Jak nás kontaktovat."],
  ["partneri", "Partneři", "Partnerské služby kolem koupě nemovitosti."],
  ["majetio-skore", "Majetio skóre", "Jak skládáme orientační skóre a kdy ho nelze spočítat."],
  ["jak-pocitame-vynos", "Jak počítáme výnos", "Metodika hrubého a čistého výnosu."],
  ["jak-odhadujeme-hodnotu", "Jak odhadujeme hodnotu", "Principy odhadu hodnoty nemovitosti."],
];

for (const [slug, title, desc] of publicPreps) {
  write(`src/app/(public)/${slug}/page.tsx`, prep(title, desc));
}

const legals: [string, string, string][] = [
  ["obchodni-podminky", "Obchodní podmínky", "Podmínky užívání služeb Majetio."],
  ["ochrana-osobnich-udaju", "Ochrana osobních údajů", "Zásady zpracování osobních údajů."],
  ["cookies", "Cookies", "Jak používáme cookies."],
  ["pravni-upozorneni", "Právní upozornění", "Omezení odpovědnosti a upozornění k analýzám."],
];

for (const [slug, title, desc] of legals) {
  write(`src/app/(public)/${slug}/page.tsx`, legal(title, desc, `/${slug}`));
}

write(
  "src/app/(discovery)/nemovitosti/doporucene/page.tsx",
  prep("Doporučené nemovitosti", "Doporučení podle finančního profilu se připravuje."),
);
write(
  "src/app/(discovery)/nemovitosti/investicni-prilezitosti/page.tsx",
  prep(
    "Investiční příležitosti",
    "Přehled demonstračních příležitostí — nejde o aktuální tržní nabídky.",
  ),
);
write(
  "src/app/(tools)/analyza/nova/page.tsx",
  prep("Nová analýza", "Vstup do nové analýzy. Import URL a výpočty se připravují."),
);

const calcs: [string, string][] = [
  ["investicni-vynos", "Investiční výnos"],
  ["cash-flow", "Cash flow"],
  ["navratnost", "Návratnost investice"],
  ["financovani", "Financování"],
  ["rekonstrukce", "Rekonstrukce"],
  ["maximalni-nabidkova-cena", "Maximální nabídková cena"],
];

for (const [slug, title] of calcs) {
  write(
    `src/app/(tools)/kalkulacky/${slug}/page.tsx`,
    prep(
      title,
      `Struktura kalkulačky „${title}“. Výpočtová logika přijde ve Fázi 3 — bez falešných výsledků.`,
    ),
  );
}

const authPages: [string, string, string][] = [
  ["zapomenute-heslo", "Zapomenuté heslo", "Obnova hesla se připravuje spolu s autentizací."],
  ["obnovit-heslo", "Obnovit heslo", "Nastavení nového hesla."],
  ["overeni-emailu", "Ověření e-mailu", "Ověření e-mailové adresy."],
];

for (const [slug, title, desc] of authPages) {
  write(`src/app/(auth)/${slug}/page.tsx`, prep(title, desc, { noIndex: true }));
}

const accountExtra: [string, string, string][] = [
  ["porovnani", "Moje porovnání", "Uložená porovnání se připravují."],
  ["upozorneni", "Upozornění", "Upozornění na změny nabídek."],
  ["nastaveni", "Nastavení", "Nastavení účtu."],
  ["souhlasy", "Souhlasy", "Správa souhlasů se zpracováním a předáním dat."],
];

for (const [slug, title, desc] of accountExtra) {
  write(
    `src/app/(account)/ucet/${slug}/page.tsx`,
    prep(title, desc, { noIndex: true }),
  );
}

const admins = [
  "nemovitosti",
  "analyzy",
  "leady",
  "objednavky",
  "uzivatele",
  "lokality",
  "obsah",
  "partneri",
  "data-quality",
  "nastaveni",
  "audit-log",
];

for (const slug of admins) {
  write(
    `src/app/(admin)/admin/${slug}/page.tsx`,
    `import type { Metadata } from "next";
import { PreparingPage } from "@/components/content/page-helpers";

export const metadata: Metadata = {
  title: "Admin · ${slug}",
  description: "Administrační sekce. Business logika se připravuje.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <PreparingPage
      title="Admin · ${slug}"
      description="Administrační sekce. Business logika se připravuje."
      breadcrumbs={[{ href: "/admin", label: "Admin" }, { label: "${slug}" }]}
      primaryHref="/admin"
      primaryLabel="Zpět na přehled"
    />
  );
}
`,
  );
}

const analyzaSubs = ["scenare", "financovani", "rekonstrukce", "lokalita", "rizika"];
for (const sub of analyzaSubs) {
  write(
    `src/app/(tools)/analyza/[id]/${sub}/page.tsx`,
    `import type { Metadata } from "next";
import { PreparingPage } from "@/components/content/page-helpers";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Analýza · ${sub}",
    description: "Sekce analýzy ${sub}.",
    robots: { index: false, follow: false },
    alternates: { canonical: \`/analyza/\${id}/${sub}\` },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <PreparingPage
      title="Analýza · ${sub}"
      description={\`Sekce analýzy „\${id}“. Výpočty a data se připravují.\`}
      breadcrumbs={[
        { href: "/analyza", label: "Analýza" },
        { href: \`/analyza/\${id}\`, label: id },
        { label: "${sub}" },
      ]}
      primaryHref="/analyza"
      primaryLabel="Zpět na analýzu"
    />
  );
}
`,
  );
}

console.log("done");
