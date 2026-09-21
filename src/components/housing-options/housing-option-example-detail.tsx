import Image from "next/image";
import Link from "next/link";

import { ModeInterestForm } from "@/components/marketplace/mode-interest-form";
import { Breadcrumbs } from "@/components/navigation/tabs";
import type {
  HousingOptionCategory,
  HousingOptionExample,
} from "@/content/housing-options";

export function HousingOptionExampleDetailView({
  category,
  example,
}: {
  category: HousingOptionCategory;
  example: HousingOptionExample;
}) {
  const gallery = example.gallery?.length
    ? example.gallery
    : [example.image, example.image];
  const main = gallery[0]!;
  const side = gallery.slice(1, 3);

  return (
    <div className="ho-surface">
      <section className="ho-hero">
        <div className="ho-hero-inner">
          <Breadcrumbs
            items={[
              { href: "/", label: "Domů" },
              { href: "/moznosti", label: "Možnosti bydlení" },
              { href: `/moznosti/${category.slug}`, label: category.title },
              { label: example.title },
            ]}
            className="mb-4"
          />
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0D9A92]">
            {example.badge}
          </p>
          <h1>{example.title}</h1>
          <p className="ho-hero-lead">
            {example.location} · {example.propertyType}
          </p>
        </div>
      </section>

      <div className="ho-body">
        <div className="ho-detail-gallery">
          <div className="ho-detail-main-img">
            <Image src={main} alt="" fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 60vw" />
            <span className="ho-card-badge">{example.badge}</span>
          </div>
          {side.length > 0 ? (
            <div className="ho-detail-side">
              {side.map((src, i) => (
                <div key={`${src}-${i}`}>
                  <Image src={src} alt="" fill className="object-cover" sizes="30vw" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-[#667A86]">{example.location}</p>
            <p className="mt-1 text-2xl font-semibold text-[#0C3551]">{example.priceLabel}</p>
          </div>
          <Link href={`/moznosti/${category.slug}`} className="ho-btn-ghost">
            ← Zpět na {category.title}
          </Link>
        </div>

        <p className="mt-4 max-w-3xl text-[0.9375rem] leading-relaxed text-[#667A86]">
          {example.description}
        </p>

        {example.swap ? (
          <div className="ho-section">
            <h2>Porovnání směny</h2>
            <div className="ho-swap mt-4">
              <div className="ho-swap-side">
                <Image
                  src={example.swap.left.image}
                  alt=""
                  width={480}
                  height={300}
                />
                <div className="ho-swap-side-body">
                  <strong>{example.swap.left.title}</strong>
                  <span>{example.swap.left.propertyType}</span>
                  <span>{example.swap.left.location}</span>
                  <span className="!text-[#0C3551] !font-semibold">
                    {example.swap.left.valueLabel}
                  </span>
                </div>
              </div>
              <div className="ho-swap-arrow" aria-hidden>
                ⇄
              </div>
              <div className="ho-swap-side">
                <Image
                  src={example.swap.right.image}
                  alt=""
                  width={480}
                  height={300}
                />
                <div className="ho-swap-side-body">
                  <strong>{example.swap.right.title}</strong>
                  <span>{example.swap.right.propertyType}</span>
                  <span>{example.swap.right.location}</span>
                  <span className="!text-[#0C3551] !font-semibold">
                    {example.swap.right.valueLabel}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-base font-semibold text-[#0C3551]">
              {example.swap.settlementLabel}
            </p>
          </div>
        ) : null}

        <section className="ho-section" aria-labelledby="ho-finance">
          <h2 id="ho-finance">Modelové parametry</h2>
          <div className="ho-finance">
            {example.metrics.map((m) => (
              <div key={m.label} className="ho-finance-item">
                <span>{m.label}</span>
                <strong className={m.emphasize ? "text-[#0D9A92]" : undefined}>
                  {m.value}
                </strong>
              </div>
            ))}
          </div>
        </section>

        {example.howItWorks?.length ? (
          <section className="ho-section">
            <h2>Jak model funguje</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#667A86]">
              {example.howItWorks.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        ) : null}

        {example.scenario ? (
          <section className="ho-section">
            <h2>Modelový scénář</h2>
            <p>{example.scenario}</p>
          </section>
        ) : null}

        <section className="ho-section">
          <h2>Výhody tohoto scénáře</h2>
          <div className="ho-benefits">
            {category.benefits.slice(0, 3).map((b) => (
              <div key={b.title} className="ho-benefit">
                <strong>{b.title}</strong>
                <span>{b.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="ho-section">
          <h2>Rizika a upozornění</h2>
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
            Tento model je ilustrativní. Pokud vás scénář zajímá, pošlete nezávazný
            zájem.
          </p>
          <ModeInterestForm
            mode={category.interestMode}
            showSharePct={category.showSharePct}
            showAmount={category.showAmount}
          />
          <div className="ho-cta-actions mt-4">
            <Link href={`/moznosti/${category.slug}`} className="ho-btn-ghost">
              ← Všechny modelové nabídky · {category.title}
            </Link>
            <Link href="/moznosti" className="ho-btn-ghost">
              Více možností bydlení a investování
            </Link>
          </div>
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
