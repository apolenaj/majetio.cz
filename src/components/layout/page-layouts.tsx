import { Breadcrumbs } from "@/components/navigation/tabs";
import { Container } from "@/components/ui/container";
import { Inline } from "@/components/ui/layout-primitives";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  breadcrumbs,
  badge,
  actions,
  metadata,
  className,
}: {
  title: string;
  description?: string;
  breadcrumbs?: { href?: string; label: string }[];
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  metadata?: React.ReactNode;
  className?: string;
}) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://majetio.cz";
  const breadcrumbJsonLd =
    breadcrumbs && breadcrumbs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            ...(item.href ? { item: `${base}${item.href}` } : {}),
          })),
        }
      : null;

  return (
    <header className={cn("mb-8 max-w-4xl sm:mb-10", className)}>
      {breadcrumbJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      ) : null}
      {breadcrumbs ? <Breadcrumbs items={breadcrumbs} className="mb-4" /> : null}
      <Inline className="items-start justify-between gap-4" wrap>
        <div className="min-w-0">
          <Inline gap="sm">
            <h1 className="text-h1 text-[var(--text-primary)]">{title}</h1>
            {badge}
          </Inline>
          {description ? (
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
              {description}
            </p>
          ) : null}
          {metadata ? <div className="mt-3 text-sm text-[var(--text-muted)]">{metadata}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </Inline>
    </header>
  );
}

export function MarketingPageLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("pb-16", className)}>
      <Container width="marketing">{children}</Container>
    </div>
  );
}

export function StandardPageLayout({
  children,
  className,
  header,
}: {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
}) {
  return (
    <Container width="marketing" className={cn("py-12 sm:py-16", className)}>
      {header}
      {children}
    </Container>
  );
}

export function DashboardLayout({
  children,
  sidebar,
  className,
}: {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
}) {
  return (
    <Container width="dashboard" className={cn("py-8 sm:py-10", className)}>
      <div className={cn("grid gap-8", sidebar && "lg:grid-cols-[16rem_1fr]")}>
        {sidebar ? (
          <aside className="lg:sticky lg:top-24 lg:self-start">{sidebar}</aside>
        ) : null}
        <div>{children}</div>
      </div>
    </Container>
  );
}

export function FormWizardLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Container width="form" className={cn("py-12 sm:py-16", className)}>
      {children}
    </Container>
  );
}

export function AuthenticationLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Container width="form" className={cn("py-16 sm:py-20", className)}>
      {children}
    </Container>
  );
}

export function ArticleLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Container width="article" className={cn("py-12 sm:py-16", className)}>
      <article className="prose-majetio space-y-4 text-[var(--text-secondary)]">
        {children}
      </article>
    </Container>
  );
}

export function CalculatorShell({
  inputs,
  results,
  className,
}: {
  inputs: React.ReactNode;
  results: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-8 lg:grid-cols-2", className)}>
      <section aria-label="Vstupy kalkulačky" className="space-y-4">
        {inputs}
      </section>
      <section
        aria-label="Výsledky kalkulačky"
        className="space-y-4 lg:sticky lg:top-24 lg:self-start"
      >
        {results}
      </section>
    </div>
  );
}

export function ComparisonLayout({
  header,
  children,
  className,
}: {
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Container width="dashboard" className={cn("py-10", className)}>
      {header}
      <div className="mt-6 overflow-x-auto">{children}</div>
    </Container>
  );
}
