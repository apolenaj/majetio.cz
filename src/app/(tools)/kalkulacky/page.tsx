import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Landmark,
  LineChart,
  Percent,
  Target,
  Timer,
  Wrench,
} from "lucide-react";

import { preparePageMeta } from "@/components/content/page-helpers";
import { CATALOG_TOOLS } from "@/components/tools/tools-catalog";

export const metadata: Metadata = preparePageMeta({
  title: "Kalkulačky",
  description:
    "Přehled kalkulaček Majetio — výnos, cash flow, financování, rekonstrukce a maximální nabídková cena.",
  path: "/kalkulacky",
});

const ICONS = {
  overview: Calculator,
  cashflow: LineChart,
  finance: Landmark,
  maxprice: Target,
  yield: Percent,
  payback: Timer,
  reno: Wrench,
} as const;

export default function KalkulackyPage() {
  const tools = CATALOG_TOOLS.filter((t) => t.id !== "overview");

  return (
    <div className="tools-surface calc-shell">
      <header className="calc-hero">
        <div className="tools-wrap">
          <nav className="tools-crumb" aria-label="Drobečková navigace">
            <Link href="/">Domů</Link>
            <span aria-hidden>/</span>
            <Link href="/analyzy-a-kalkulacky">Analýzy a kalkulačky</Link>
            <span aria-hidden>/</span>
            <span>Kalkulačky</span>
          </nav>
          <h1>Přehled kalkulaček</h1>
          <p className="calc-hero-lead">
            Všechny výpočtové nástroje na jednom místě. Každý modul má funkční
            formulář a orientační výsledky.
          </p>
        </div>
      </header>

      <div className="tools-wrap calc-body">
        <div className="tools-catalog">
          {tools.map((tool) => {
            const Icon = ICONS[tool.icon];
            return (
              <Link key={tool.id} href={tool.href} className="tools-catalog-card">
                <div className="tools-catalog-top">
                  <span className="tools-catalog-icon">
                    <Icon aria-hidden />
                  </span>
                  {tool.badge ? (
                    <span className="tools-catalog-status">{tool.badge}</span>
                  ) : null}
                </div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
                <div className="tools-catalog-tags">
                  {tool.tags.map((tag) => (
                    <span key={tag} className="tools-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="tools-catalog-cta">
                  Spustit nástroj <ArrowRight size={14} aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="calc-footer-cta">
          <Link href="/analyzy-a-kalkulacky" className="tools-btn-outline">
            Zpět na Analýzy a kalkulačky
          </Link>
          <Link href="/ukazky" className="tools-btn-primary">
            Modelové studie
          </Link>
        </div>
      </div>
    </div>
  );
}
