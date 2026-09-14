import Link from "next/link";

import { MortgageLeadsCompactList } from "@/components/account/mortgage-leads-panel";
import { DecisionTimeline } from "@/components/decision-workspace/decision-timeline";
import { SavedSearchCard } from "@/components/decision-workspace/saved-search-card";
import { EmptyState, InlineAlert } from "@/components/feedback/states";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DecisionWorkspaceSnapshot } from "@/domains/decision-workspace/service/workspace-snapshot";
import { formatCzk, formatDateTime } from "@/lib/format";

export function DecisionWorkspaceDashboard({
  data,
}: {
  data: DecisionWorkspaceSnapshot;
}) {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-[var(--text-muted)]">Property Decision Workspace</p>
        <h1 className="mt-1 text-h2 text-[var(--text-primary)]">
          Rozhodovací centrum
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Dobrý den, {data.displayName}. Shortlist, porovnání, úkoly a uložená
          hledání na jednom místě — bez fiktivních odznaků.
        </p>
      </div>

      {data.nextStep ? (
        <section aria-labelledby="next-step-heading">
          <InlineAlert tone="info" title={data.nextStep.title}>
            <p>{data.nextStep.body}</p>
            <div className="mt-3">
              <ButtonLink href={data.nextStep.href} size="sm">
                {data.nextStep.cta}
              </ButtonLink>
            </div>
          </InlineAlert>
          <h2 id="next-step-heading" className="sr-only">
            Doporučený další krok
          </h2>
        </section>
      ) : null}

      <section aria-labelledby="workspace-kpis-heading" className="space-y-3">
        <h2 id="workspace-kpis-heading" className="sr-only">
          Přehled workspace
        </h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <KpiCard
            label="Shortlist"
            value={data.counts.shortlist}
            href="/ucet/oblibene"
          />
          <KpiCard
            label="Aktivní porovnání"
            value={data.counts.comparisons}
            href="/ucet/porovnani"
          />
          <KpiCard
            label="Změny cen"
            value={
              data.recentChanges.filter((e) =>
                e.kind.includes("PRICE"),
              ).length
            }
            href="/ucet/upozorneni"
          />
          <KpiCard
            label="Nové shody"
            value={data.savedSearches.reduce(
              (sum, s) => sum + s.newMatchCount,
              0,
            )}
            href="/ucet#ulozena-hledani"
          />
          <KpiCard
            label="Nedokončené úkoly"
            value={data.counts.openTasks}
            href="/ucet#ukoly"
          />
        </ul>
      </section>

      <section id="shortlist" aria-labelledby="shortlist-heading" className="space-y-4">
        <SectionHeading
          id="shortlist-heading"
          title="Můj shortlist"
          count={data.counts.shortlist}
          href="/ucet/oblibene"
        />
        {data.shortlist.length === 0 ? (
          <EmptyState
            title="Začněte uložením první nemovitosti"
            description="Uložte tip z katalogu a přesuňte vážné kandidáty mezi Favority."
            action={
              <ButtonLink href="/nemovitosti" variant="secondary">
                Procházet nemovitosti
              </ButtonLink>
            }
          />
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {data.shortlist.map((item) => (
              <li key={item.favouriteId}>
                <Card padding="lg">
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle>
                          <Link href={item.href} className="hover:underline">
                            {item.title}
                          </Link>
                        </CardTitle>
                        <CardDescription>
                          {item.location}
                          {item.askingPrice != null
                            ? ` · ${formatCzk(item.askingPrice)}`
                            : ""}
                        </CardDescription>
                      </div>
                      <StatusBadge tone="info">{item.statusLabel}</StatusBadge>
                    </div>
                  </CardHeader>
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                      Decision timeline
                    </p>
                    <DecisionTimeline events={item.timeline} compact />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="compare-heading" className="space-y-4">
          <SectionHeading
            id="compare-heading"
            title="Aktivní porovnání"
            count={data.counts.comparisons}
            href="/ucet/porovnani"
          />
          <ListOrEmpty
            emptyTitle="Žádné uložené porovnání"
            emptyDescription="Porovnejte dvě a více nemovitostí vedle sebe."
            emptyHref="/porovnani"
            emptyCta="Spustit porovnání"
            count={data.activeComparisons.length}
          >
            {data.activeComparisons.map((c) => (
              <li key={c.id}>
                <Link
                  href={c.href}
                  className="block rounded-[var(--radius-md)] px-2 py-2 hover:bg-[var(--background-secondary)]"
                >
                  <p className="font-medium text-[var(--text-primary)]">
                    {c.name?.trim() || "Bez názvu"}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {c.itemCount} položek · {formatDateTime(c.updatedAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ListOrEmpty>
        </section>

        <section aria-labelledby="changes-heading" className="space-y-4">
          <SectionHeading
            id="changes-heading"
            title="Poslední změny"
            count={data.recentChanges.length}
            href="/ucet/upozorneni"
          />
          {data.recentChanges.length === 0 ? (
            <EmptyState
              title="Zatím bez změn"
              description="Uložení, shortlist, změny cen a stavy se objeví tady."
            />
          ) : (
            <Card padding="lg">
              <DecisionTimeline events={data.recentChanges} />
            </Card>
          )}
        </section>
      </div>

      <section id="ukoly" aria-labelledby="tasks-heading" className="space-y-4">
        <SectionHeading
          id="tasks-heading"
          title="Úkoly k ověření"
          count={data.counts.openTasks}
        />
        <ListOrEmpty
          emptyTitle="Žádné otevřené úkoly"
          emptyDescription="Checklist ověření najdete u detailu nemovitosti v sekci Rozhodnutí."
          emptyHref="/ucet/oblibene"
          emptyCta="K oblíbeným"
          count={data.openTasks.length}
        >
          {data.openTasks.map((t) => (
            <li key={t.id}>
              {t.href ? (
                <Link
                  href={t.href}
                  className="block rounded-[var(--radius-md)] px-2 py-2 hover:bg-[var(--background-secondary)]"
                >
                  <TaskRow task={t} />
                </Link>
              ) : (
                <div className="px-2 py-2">
                  <TaskRow task={t} />
                </div>
              )}
            </li>
          ))}
        </ListOrEmpty>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="analyses-heading" className="space-y-4">
          <SectionHeading
            id="analyses-heading"
            title="Analýzy"
            count={data.counts.analyses}
            href="/ucet/analyzy"
          />
          <ListOrEmpty
            emptyTitle="Zatím žádné analýzy"
            emptyDescription="Spusťte analýzu nemovitosti ze shortlistu."
            emptyHref="/analyza"
            emptyCta="Analyzovat"
            count={data.analyses.length}
          >
            {data.analyses.map((a) => (
              <li key={a.id}>
                <Link
                  href={a.href}
                  className="block rounded-[var(--radius-md)] px-2 py-2 hover:bg-[var(--background-secondary)]"
                >
                  <p className="font-medium text-[var(--text-primary)]">
                    {a.propertyTitle ?? `Analýza ${a.id.slice(0, 8)}`}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {a.status}
                    {a.majetioScore != null ? ` · skóre ${a.majetioScore}` : ""}
                    {` · ${formatDateTime(a.updatedAt)}`}
                  </p>
                </Link>
              </li>
            ))}
          </ListOrEmpty>
        </section>

        <section aria-labelledby="financing-heading" className="space-y-4">
          <SectionHeading
            id="financing-heading"
            title="Financování"
            count={data.financing.count}
            href="/ucet/financovani"
          />
          <ListOrEmpty
            emptyTitle="Zatím bez požadavku na financování"
            emptyDescription="Po výslovném souhlasu u kalkulačky se zde zobrazí stav od partnera."
            emptyHref="/kalkulacky/financovani"
            emptyCta="Kalkulačka financování"
            count={data.financing.leads.length}
          >
            <MortgageLeadsCompactList leads={data.financing.leads} />
          </ListOrEmpty>
        </section>
      </div>

      <section
        id="ulozena-hledani"
        aria-labelledby="saved-search-heading"
        className="space-y-4"
      >
        <SectionHeading
          id="saved-search-heading"
          title="Uložená hledání"
          count={data.counts.savedSearches}
          href="/ucet/ulozena-hledani"
        />
        {data.savedSearches.length === 0 ? (
          <EmptyState
            title="Žádná uložená hledání"
            description="Na katalogu nastavte filtry a uložte hledání."
            action={
              <ButtonLink href="/nemovitosti" variant="secondary">
                Procházet nemovitosti
              </ButtonLink>
            }
          />
        ) : (
          <ul className="space-y-4">
            {data.savedSearches.map((s) => (
              <li key={s.id}>
                <SavedSearchCard
                  item={{
                    id: s.id,
                    name: s.name,
                    href: s.href,
                    filterSummary: s.filterSummary,
                    alertFrequency: s.alertFrequency,
                    alertFrequencyLabel: s.alertFrequencyLabel,
                    matchCount: s.matchCount,
                    newMatchCount: s.newMatchCount,
                    lastCheckedAt: s.lastCheckedAt,
                    createdAt: s.createdAt,
                  }}
                  compact
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SectionHeading({
  id,
  title,
  count,
  href,
}: {
  id: string;
  title: string;
  count: number;
  href?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id={id} className="text-h3 text-[var(--text-primary)]">
        {title}
      </h2>
      <div className="flex items-center gap-2">
        <StatusBadge tone="neutral">{count}</StatusBadge>
        {href ? (
          <ButtonLink href={href} size="sm" variant="ghost">
            Zobrazit vše
          </ButtonLink>
        ) : null}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-4 hover:bg-[var(--background-secondary)]"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          {label}
        </p>
        <p className="mt-1 font-display text-2xl text-[var(--text-primary)]">
          {value}
        </p>
      </Link>
    </li>
  );
}

function ListOrEmpty({
  count,
  emptyTitle,
  emptyDescription,
  emptyHref,
  emptyCta,
  children,
}: {
  count: number;
  emptyTitle: string;
  emptyDescription: string;
  emptyHref: string;
  emptyCta: string;
  children: React.ReactNode;
}) {
  if (count === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          <ButtonLink href={emptyHref} variant="secondary">
            {emptyCta}
          </ButtonLink>
        }
      />
    );
  }
  return (
    <Card padding="lg">
      <ul className="space-y-1">{children}</ul>
    </Card>
  );
}

function TaskRow({
  task,
}: {
  task: DecisionWorkspaceSnapshot["openTasks"][number];
}) {
  return (
    <>
      <p className="font-medium text-[var(--text-primary)]">{task.title}</p>
      <p className="text-sm text-[var(--text-muted)]">
        {task.propertyTitle ?? "Nemovitost"}
        {task.dueDate ? ` · do ${formatDateTime(task.dueDate)}` : ""}
      </p>
    </>
  );
}
