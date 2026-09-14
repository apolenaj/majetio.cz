import Link from "next/link";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/feedback/states";

export type AdminMetricTone = "neutral" | "ok" | "warn" | "bad";

/**
 * Internal metric tile — never invents values; null → empty (211–212).
 */
export function AdminMetricTile(props: {
  label: string;
  value: string | number | null;
  hint?: string | null;
  href?: string;
  tone?: AdminMetricTone;
  emptyLabel?: string;
}) {
  const tone = props.tone ?? "neutral";
  const toneClass =
    tone === "ok"
      ? "text-[var(--status-success)]"
      : tone === "warn"
        ? "text-[var(--status-warning)]"
        : tone === "bad"
          ? "text-[var(--status-error)]"
          : "text-[var(--text-primary)]";

  const body =
    props.value == null ? (
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        {props.emptyLabel ?? "Data nejsou k dispozici"}
      </p>
    ) : (
      <>
        <p
          className={cn(
            "mt-2 text-2xl font-semibold tabular-nums",
            toneClass,
          )}
        >
          {props.value}
        </p>
        {props.hint ? (
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{props.hint}</p>
        ) : null}
      </>
    );

  const card = (
    <Card elevation="flat" className="p-3">
      <p className="text-[10px] font-medium tracking-wide text-[var(--text-muted)] uppercase">
        {props.label}
      </p>
      {body}
    </Card>
  );

  if (props.href && props.value != null) {
    return (
      <Link
        href={props.href}
        className="block rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      >
        {card}
      </Link>
    );
  }
  return card;
}

export function AdminMetricsGrid(props: {
  title: string;
  metrics: Array<{
    id: string;
    label: string;
    value: string | number | null;
    hint?: string | null;
    href?: string;
    tone?: AdminMetricTone;
  }>;
}) {
  const hasAny = props.metrics.some((m) => m.value != null);
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg text-[var(--text-primary)]">
        {props.title}
      </h2>
      {!hasAny ? (
        <EmptyState
          title="Žádné metriky"
          description="Zatím nejsou k dispozici reálná data pro tuto sekci."
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {props.metrics.map((m) => (
            <AdminMetricTile key={m.id} {...m} />
          ))}
        </div>
      )}
    </section>
  );
}
