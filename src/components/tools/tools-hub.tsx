"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ExternalLink,
  Landmark,
  LineChart,
  Percent,
  Sparkles,
  Target,
  Timer,
  Wrench,
} from "lucide-react";

import { HypotekaJasneCTA } from "@/components/financing/hypotekajasne-cta";
import {
  CATALOG_TOOLS,
  FEATURED_TOOLS,
  TOOL_FILTERS,
  type ToolFilter,
} from "./tools-catalog";

const FEATURED_ICONS = {
  yield: LineChart,
  reno: Wrench,
  finance: Landmark,
  studies: Sparkles,
} as const;

const CATALOG_ICONS = {
  overview: Calculator,
  cashflow: LineChart,
  finance: Landmark,
  maxprice: Target,
  yield: Percent,
  payback: Timer,
  reno: Wrench,
} as const;

export function ToolsHub() {
  const [filter, setFilter] = useState<ToolFilter>("all");

  const tools = useMemo(() => {
    if (filter === "all") return CATALOG_TOOLS;
    return CATALOG_TOOLS.filter((tool) => tool.filters.includes(filter));
  }, [filter]);

  return (
    <div className="tools-surface">
      <section className="tools-hero">
        <div className="tools-wrap tools-hero-grid">
          <div>
            <nav className="tools-crumb" aria-label="Drobečková navigace">
              <Link href="/">Domů</Link>
              <span aria-hidden>/</span>
              <span>Analýzy a kalkulačky</span>
            </nav>
            <h1>Analýzy a kalkulačky</h1>
            <p className="tools-hero-lead">
              Vyberte si nástroj, který vám pomůže lépe posoudit nemovitost,
              spočítat výnos, náklady i možnosti financování.
            </p>
            <ul className="tools-benefits">
              <li className="tools-benefit">
                <CheckCircle2 aria-hidden />
                Pro bydlení i investice
              </li>
              <li className="tools-benefit">
                <CheckCircle2 aria-hidden />
                Rychlé orientační výpočty
              </li>
              <li className="tools-benefit">
                <CheckCircle2 aria-hidden />
                Jasnější rozhodování
              </li>
            </ul>
          </div>

          <aside className="tools-preview" aria-hidden>
            <div className="tools-preview-top">
              <span className="tools-preview-label">Náhled nástroje</span>
              <span className="tools-preview-pill">Live model</span>
            </div>
            <div className="tools-preview-metrics">
              <div className="tools-preview-metric">
                <span>Měsíční CF</span>
                <strong>+8 420 Kč</strong>
              </div>
              <div className="tools-preview-metric">
                <span>Čistý výnos</span>
                <strong>5,4 %</strong>
              </div>
              <div className="tools-preview-metric">
                <span>Splátka</span>
                <strong>18 650 Kč</strong>
              </div>
              <div className="tools-preview-metric">
                <span>LTV</span>
                <strong>72 %</strong>
              </div>
            </div>
            <div className="tools-preview-bar">
              <i />
            </div>
            <p className="tools-preview-note">
              Orientační scénář — výsledky se mění podle vstupů.
            </p>
          </aside>
        </div>
      </section>

      <div className="tools-wrap tools-body">
        <section className="tools-section">
          <div className="tools-section-head">
            <h2>Hlavní nástroje</h2>
            <p>
              Nejčastěji používané moduly pro rychlou orientaci před prohlídkou
              nebo rozhodnutím o nabídce.
            </p>
          </div>
          <div className="tools-featured">
            {FEATURED_TOOLS.map((tool) => {
              const Icon = FEATURED_ICONS[tool.icon];
              if (tool.id === "featured-finance") {
                return (
                  <article key={tool.id} className="tools-featured-card tools-featured-card--static">
                    <div className="tools-featured-card-top">
                      <span className="tools-featured-icon">
                        <Icon aria-hidden />
                      </span>
                      {tool.badge ? (
                        <span className="tools-featured-badge">{tool.badge}</span>
                      ) : null}
                    </div>
                    <h3>{tool.title}</h3>
                    <p>
                      Spočítejte orientační splátku, vlastní zdroje a výši úvěru.
                    </p>
                    <p className="tools-featured-use">{tool.useCase}</p>
                    <div className="tools-dual-cta">
                      <Link href={tool.href} className="tools-btn-primary">
                        Spočítat financování
                      </Link>
                      <HypotekaJasneCTA
                        sourceContext="tools"
                        label="Aktuální sazby a možnosti"
                        className="tools-btn-outline tools-external-cta"
                      />
                    </div>
                  </article>
                );
              }
              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="tools-featured-card"
                >
                  <div className="tools-featured-card-top">
                    <span className="tools-featured-icon">
                      <Icon aria-hidden />
                    </span>
                    {tool.badge ? (
                      <span className="tools-featured-badge">{tool.badge}</span>
                    ) : null}
                  </div>
                  <h3>{tool.title}</h3>
                  <p>{tool.description}</p>
                  <p className="tools-featured-use">{tool.useCase}</p>
                  <span className="tools-featured-cta">
                    Otevřít nástroj
                    <ArrowRight aria-hidden size={16} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="tools-section">
          <div className="tools-section-head">
            <h2>Všechny kalkulačky</h2>
            <p>
              Katalog nástrojů podle typu rozhodování — investice, bydlení,
              financování i rekonstrukce.
            </p>
          </div>

          <div
            className="tools-filters"
            role="toolbar"
            aria-label="Filtrovat nástroje"
          >
            {TOOL_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="tools-filter"
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="tools-catalog">
            {tools.map((tool) => {
              const Icon = CATALOG_ICONS[tool.icon];
              if (tool.id === "financovani") {
                return (
                  <article key={tool.id} className="tools-catalog-card tools-catalog-card--static">
                    <div className="tools-catalog-top">
                      <span className="tools-catalog-icon">
                        <Icon aria-hidden />
                      </span>
                      {tool.badge ? (
                        <span className="tools-catalog-status">{tool.badge}</span>
                      ) : null}
                    </div>
                    <h3>{tool.title}</h3>
                    <p>
                      Spočítejte orientační splátku, vlastní zdroje a výši úvěru.
                      Detailní sazby a varianty řeší HypotékaJasně.cz.
                    </p>
                    <div className="tools-catalog-tags">
                      {tool.tags.map((tag) => (
                        <span key={tag} className="tools-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="tools-dual-cta">
                      <Link href={tool.href} className="tools-catalog-cta">
                        Spočítat splátku →
                      </Link>
                      <HypotekaJasneCTA
                        sourceContext="tools"
                        label="Aktuální sazby →"
                        className="tools-catalog-cta tools-external-cta"
                      />
                    </div>
                  </article>
                );
              }
              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="tools-catalog-card"
                >
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
                  <span className="tools-catalog-cta">Spustit nástroj →</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="tools-cta">
          <div>
            <h2>Nevíte, který nástroj použít?</h2>
            <p>
              Začněte modelovou studií, nebo nám pošlete nezávaznou poptávku na
              podrobnější analýzu konkrétní nemovitosti.
            </p>
          </div>
          <div className="tools-cta-actions">
            <Link href="/ukazky" className="tools-btn-primary">
              Zobrazit modelové studie
            </Link>
            <Link
              href="/sluzby/analyza-pred-koupi#poptavka"
              className="tools-btn-outline"
            >
              Poptat analýzu
              <ExternalLink className="ml-1 size-3.5 opacity-0" aria-hidden />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
