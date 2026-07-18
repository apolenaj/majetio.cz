import Link from "next/link";

import { PassportSummaryCard } from "@/components/financial-passport/passport-summary";
import { EmptyState, InlineAlert } from "@/components/feedback/states";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatCzk, formatDateTime } from "@/lib/format";
import type { DashboardSnapshot } from "@/lib/financial-passport/actions";

function progressTone(
  level: DashboardSnapshot["progress"]["level"],
): "neutral" | "info" | "success" | "warning" {
  switch (level) {
    case "ready":
      return "success";
    case "extended":
      return "info";
    case "basic":
      return "warning";
    default:
      return "neutral";
  }
}

export function AccountDashboard({ data }: { data: DashboardSnapshot }) {
  const { progress, recommendations } = data;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-[var(--text-muted)]">Vítejte zpět</p>
        <h1 className="mt-1 text-h2 text-[var(--text-primary)]">
          Dobrý den, {data.displayName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Přehled vašeho účtu. Žádná fiktivní data — uvidíte jen to, co máte skutečně uložené.
        </p>
      </div>

      <section aria-labelledby="passport-status-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="passport-status-heading" className="text-h3 text-[var(--text-primary)]">
            Finanční pas
          </h2>
          <StatusBadge tone={progressTone(progress.level)}>{progress.label}</StatusBadge>
        </div>

        <Card padding="lg">
          <CardHeader>
            <CardTitle>Stav dokončení — {progress.percent} %</CardTitle>
            <CardDescription>{progress.description}</CardDescription>
          </CardHeader>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--background-secondary)]"
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Dokončení finančního pasu"
          >
            <div
              className="h-full rounded-full bg-[var(--action-accent)]"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/ucet/financni-profil" size="lg">
              {progress.level === "empty" ? "Vyplnit Finanční pas" : "Upravit Finanční pas"}
            </ButtonLink>
            <ButtonLink href="/nemovitosti" variant="secondary" size="lg">
              Procházet nemovitosti
            </ButtonLink>
          </div>
        </Card>

        <PassportSummaryCard state={data.passport} compact />

        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((tip) => (
              <InlineAlert key={tip.id} tone={tip.tone} title={tip.title}>
                {tip.body}
              </InlineAlert>
            ))}
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardListCard
          title="Oblíbené nemovitosti"
          count={data.favouritesCount}
          href="/ucet/oblibene"
          emptyTitle="Zatím nemáte uložené nemovitosti"
          emptyDescription="Uložte si tipy z katalogu a vraťte se k nim později."
          emptyAction={
            <ButtonLink href="/nemovitosti" variant="secondary">
              Procházet nemovitosti
            </ButtonLink>
          }
        >
          {data.recentFavourites.map((item) => (
            <li key={item.id}>
              <Link
                href={`/nemovitosti/${item.slug}`}
                className="block rounded-[var(--radius-md)] px-2 py-2 hover:bg-[var(--background-secondary)]"
              >
                <p className="font-medium text-[var(--text-primary)]">{item.title}</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {[item.city, item.priceCzk != null ? formatCzk(item.priceCzk) : null]
                    .filter(Boolean)
                    .join(" · ") || "Bez ceny"}
                </p>
              </Link>
            </li>
          ))}
        </DashboardListCard>

        <DashboardListCard
          title="Poslední analýzy"
          count={data.analysesCount}
          href="/ucet/analyzy"
          emptyTitle="Zatím nemáte žádné analýzy"
          emptyDescription="Spusťte analýzu nemovitosti — výsledky se zobrazí tady."
          emptyAction={
            <ButtonLink href="/analyza" variant="secondary">
              Analyzovat nemovitost
            </ButtonLink>
          }
        >
          {data.recentAnalyses.map((item) => (
            <li key={item.id}>
              <Link
                href={`/analyza/${item.id}`}
                className="block rounded-[var(--radius-md)] px-2 py-2 hover:bg-[var(--background-secondary)]"
              >
                <p className="font-medium text-[var(--text-primary)]">
                  {item.propertyTitle ?? `Analýza ${item.id.slice(0, 8)}`}
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  {item.status}
                  {item.majetioScore != null ? ` · skóre ${item.majetioScore}` : ""}
                  {` · ${formatDateTime(item.updatedAt)}`}
                </p>
              </Link>
            </li>
          ))}
        </DashboardListCard>

        <DashboardListCard
          title="Porovnání"
          count={data.comparisonsCount}
          href="/ucet/porovnani"
          emptyTitle="Zatím nemáte porovnání"
          emptyDescription="Porovnejte dvě a více nemovitostí vedle sebe."
          emptyAction={
            <ButtonLink href="/porovnani" variant="secondary">
              Spustit porovnání
            </ButtonLink>
          }
        >
          {data.recentComparisons.map((item) => (
            <li key={item.id}>
              <Link
                href="/ucet/porovnani"
                className="block rounded-[var(--radius-md)] px-2 py-2 hover:bg-[var(--background-secondary)]"
              >
                <p className="font-medium text-[var(--text-primary)]">
                  {item.name?.trim() || "Bez názvu"}
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  {item.itemCount} položek · {formatDateTime(item.updatedAt)}
                </p>
              </Link>
            </li>
          ))}
        </DashboardListCard>
      </div>
    </div>
  );
}

function DashboardListCard({
  title,
  count,
  href,
  emptyTitle,
  emptyDescription,
  emptyAction,
  children,
}: {
  title: string;
  count: number;
  href: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card padding="lg" className="flex flex-col">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
        <StatusBadge tone="neutral">{count}</StatusBadge>
      </div>
      {count === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <>
          <ul className="flex-1 space-y-1">{children}</ul>
          <div className="mt-4">
            <ButtonLink href={href} variant="ghost" fullWidth>
              Zobrazit vše
            </ButtonLink>
          </div>
        </>
      )}
    </Card>
  );
}
