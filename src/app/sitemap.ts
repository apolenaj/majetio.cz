import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://majetio.cz";

const PUBLIC_PATHS = [
  "/",
  "/nemovitosti",
  "/nemovitosti/praha",
  "/nemovitosti/brno",
  "/nemovitosti/ostrava",
  "/nemovitosti/investicni-prilezitosti",
  "/analyza",
  "/porovnani",
  "/kalkulacky",
  "/kalkulacky/investicni-vynos",
  "/kalkulacky/cash-flow",
  "/kalkulacky/navratnost",
  "/kalkulacky/financovani",
  "/kalkulacky/rekonstrukce",
  "/kalkulacky/maximalni-nabidkova-cena",
  "/lokality",
  "/strategie",
  "/strategie/vlastni-bydleni",
  "/strategie/dlouhodoby-pronajem",
  "/strategie/kratkodoby-pronajem",
  "/strategie/rekonstrukce",
  "/strategie/flip",
  "/jak-to-funguje",
  "/cenik",
  "/metodika",
  "/zdroje-dat",
  "/majetio-skore",
  "/jak-pocitame-vynos",
  "/jak-odhadujeme-hodnotu",
  "/pruvodce",
  "/o-majetio",
  "/kontakt",
  "/partneri",
  "/obchodni-podminky",
  "/ochrana-osobnich-udaju",
  "/cookies",
  "/pravni-upozorneni",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PUBLIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
