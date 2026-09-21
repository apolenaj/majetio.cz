import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  exampleDetailHref,
  type HousingOptionExample,
} from "@/content/housing-options";

export function HousingOptionExampleCard({
  categorySlug,
  example,
}: {
  categorySlug: string;
  example: HousingOptionExample;
}) {
  const href = exampleDetailHref(categorySlug, example.slug);
  const metrics = example.metrics.slice(0, 6);

  return (
    <article className="ho-card">
      {example.swap ? (
        <div className="p-3 pb-0">
          <div className="ho-swap">
            <div className="ho-swap-side">
              <Image
                src={example.swap.left.image}
                alt=""
                width={400}
                height={250}
              />
              <div className="ho-swap-side-body">
                <strong>{example.swap.left.title}</strong>
                <span>{example.swap.left.location}</span>
                <span>{example.swap.left.valueLabel}</span>
              </div>
            </div>
            <div className="ho-swap-arrow" aria-hidden>
              ⇄
            </div>
            <div className="ho-swap-side">
              <Image
                src={example.swap.right.image}
                alt=""
                width={400}
                height={250}
              />
              <div className="ho-swap-side-body">
                <strong>{example.swap.right.title}</strong>
                <span>{example.swap.right.location}</span>
                <span>{example.swap.right.valueLabel}</span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-center text-sm font-semibold text-[#0C3551]">
            {example.swap.settlementLabel}
          </p>
        </div>
      ) : (
        <Link href={href} className="ho-card-media block" aria-label={example.title}>
          <Image
            src={example.image}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <span className="ho-card-badge">{example.badge}</span>
        </Link>
      )}

      <div className="ho-card-body">
        {example.swap ? (
          <span className="ho-card-badge relative inset-auto mb-1 w-fit">
            {example.badge}
          </span>
        ) : null}
        <p className="ho-card-type">{example.propertyType}</p>
        <h3 className="ho-card-title">
          <Link href={href} className="hover:underline">
            {example.title}
          </Link>
        </h3>
        <p className="ho-card-loc">{example.location}</p>
        <p className="ho-card-price">{example.priceLabel}</p>
        <p className="ho-card-desc">{example.description}</p>
        <dl className="ho-metrics">
          {metrics.map((m) => (
            <div key={m.label}>
              <dt>{m.label}</dt>
              <dd className={m.emphasize ? "is-strong" : undefined}>{m.value}</dd>
            </div>
          ))}
        </dl>
        <Link href={href} className="ho-card-cta">
          Zobrazit model
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
