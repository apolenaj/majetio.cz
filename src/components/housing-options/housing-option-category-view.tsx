import Link from "next/link";

import { HousingOptionExampleCard } from "@/components/housing-options/housing-option-example-card";
import { ModeInterestForm } from "@/components/marketplace/mode-interest-form";
import { Breadcrumbs } from "@/components/navigation/tabs";
import type { HousingOptionCategory } from "@/content/housing-options";

export function HousingOptionCategoryView({
  category,
}: {
  category: HousingOptionCategory;
}) {
  return (
    <div className="ho-surface">
      <section className="ho-hero">
        <div className="ho-hero-inner">
          <Breadcrumbs
            items={[
              { href: "/", label: "Domů" },
              { href: "/moznosti", label: "Možnosti bydlení" },
              { label: category.title },
            ]}
            className="mb-4"
          />
          <h1>{category.title}</h1>
          <p className="ho-hero-lead">{category.subtitle}</p>
        </div>
      </section>

      <div className="ho-body">
        <section className="ho-section" style={{ marginTop: 0 }}>
          <h2>Jak to funguje</h2>
          <p>{category.explanation}</p>
        </section>

        <section className="ho-section" aria-labelledby="ho-benefits">
          <h2 id="ho-benefits">Hlavní výhody</h2>
          <div className="ho-benefits">
            {category.benefits.map((b) => (
              <div key={b.title} className="ho-benefit">
                <strong>{b.title}</strong>
                <span>{b.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="ho-section" aria-labelledby="ho-steps">
          <h2 id="ho-steps">Tři jednoduché kroky</h2>
          <div className="ho-steps">
            {category.steps.map((s, i) => (
              <div key={s.title} className="ho-step">
                <span className="ho-step-num" aria-hidden>
                  {i + 1}
                </span>
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="ho-section" aria-labelledby="ho-examples">
          <h2 id="ho-examples">Modelové nabídky</h2>
          <p>
            Pět ukázkových scénářů. Nejde o živé inzeráty — slouží k pochopení
            fungování této možnosti.
          </p>
          <div className="ho-grid">
            {category.examples.map((example) => (
              <HousingOptionExampleCard
                key={example.id}
                categorySlug={category.slug}
                example={example}
              />
            ))}
          </div>
        </section>

        <section className="ho-section" aria-labelledby="ho-risks">
          <h2 id="ho-risks">Na co si dát pozor</h2>
          <div className="ho-risks">
            <ul>
              {category.risks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="ho-cta-block" id="zajemn">
          <h2>{category.ctaLabel}</h2>
          <p className="mt-1 text-sm text-[#667A86]">
            Nezávazně nám dejte vědět — pomůžeme najít podobný scénář nebo
            propojení.
          </p>
          <div className="ho-cta-actions">
            {category.ctaHref.startsWith("/") ? (
              <Link href={category.ctaHref} className="ho-btn-primary">
                {category.ctaLabel}
              </Link>
            ) : null}
            <Link href="/moznosti" className="ho-btn-ghost">
              ← Více možností bydlení a investování
            </Link>
          </div>
          <ModeInterestForm
            mode={category.interestMode}
            showSharePct={category.showSharePct}
            showAmount={category.showAmount}
          />
        </section>

        <p className="ho-disclaimer">
          Uvedené nabídky a výpočty jsou modelové příklady sloužící k ilustraci
          fungování služby. Nejde o aktuální nabídky nemovitostí ani individuální
          investiční, právní či finanční doporučení.
        </p>
      </div>
    </div>
  );
}
