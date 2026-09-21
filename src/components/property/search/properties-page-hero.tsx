import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Layers, Wrench } from "lucide-react";

const BENEFITS = [
  {
    title: "Ověřené nabídky",
    text: "Skuteční inzerenti",
    icon: CheckCircle2,
  },
  {
    title: "Chytré nástroje",
    text: "Pro lepší rozhodování",
    icon: Wrench,
  },
  {
    title: "Vše na jednom místě",
    text: "Bydlení i investice",
    icon: Layers,
  },
] as const;

export function PropertiesPageHero({
  title,
  description,
  breadcrumbs,
}: {
  title: string;
  description: string;
  breadcrumbs: { href?: string; label: string }[];
}) {
  return (
    <section className="properties-hero">
      <div className="properties-hero-inner">
        <div className="properties-hero-copy">
          <nav aria-label="Drobečková navigace" className="properties-breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1.5">
                {index > 0 ? <span aria-hidden>/</span> : null}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-[#0D9A92]">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[#18384B]">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
          <h1 className="properties-hero-title">{title}</h1>
          <p className="properties-hero-lead">
            {description}
            <br />
            Ať už hledáte domov, nebo investiční příležitost.
          </p>
          <ul className="properties-hero-benefits">
            {BENEFITS.map((item) => (
              <li key={item.title}>
                <item.icon aria-hidden />
                <span>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="properties-hero-media">
          <Image
            src="/home/hero.png"
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 48vw"
          />
          <p className="properties-hero-quote">Lepší rozhodnutí. Bohatší zítřky.</p>
        </div>
      </div>
    </section>
  );
}
