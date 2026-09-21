import Link from "next/link";

export function CalculatorShell({
  title,
  description,
  breadcrumbs,
  badge,
  children,
  footer,
}: {
  title: string;
  description: string;
  breadcrumbs: { href?: string; label: string }[];
  badge?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="tools-surface calc-shell">
      <header className="calc-hero">
        <div className="tools-wrap">
          <nav className="tools-crumb" aria-label="Drobečková navigace">
            {breadcrumbs.map((item, index) => (
              <span key={`${item.label}-${index}`} style={{ display: "contents" }}>
                {index > 0 ? <span aria-hidden>/</span> : null}
                {item.href ? (
                  <Link href={item.href}>{item.label}</Link>
                ) : (
                  <span>{item.label}</span>
                )}
              </span>
            ))}
          </nav>
          <h1>{title}</h1>
          <p className="calc-hero-lead">{description}</p>
          {badge ? <span className="calc-badge">{badge}</span> : null}
        </div>
      </header>
      <div className="tools-wrap calc-body">
        {children}
        {footer}
      </div>
    </div>
  );
}

export function CalculatorFooterCta() {
  return (
    <div className="calc-footer-cta">
      <Link href="/ukazky" className="tools-btn-outline">
        Prohlédnout modelovou studii
      </Link>
      <Link
        href="/sluzby/analyza-pred-koupi#poptavka"
        className="tools-btn-primary"
      >
        Poptat podrobnou analýzu
      </Link>
    </div>
  );
}
