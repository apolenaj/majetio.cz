import type { PublicFeatureGroup } from "@/domains/properties/parameters";

export function PropertyFeaturesPanel({
  groups,
  basicRows,
}: {
  groups: PublicFeatureGroup[];
  basicRows?: Array<{ label: string; value: string }>;
}) {
  if (!groups.length && !basicRows?.length) return null;

  return (
    <section id="parametry" className="scroll-mt-28 space-y-8" aria-labelledby="features-heading">
      <h2 id="features-heading" className="font-display text-2xl text-[var(--text-primary)]">
        Parametry
      </h2>

      {basicRows?.length ? (
        <FeatureGroup title="Základní informace" rows={basicRows.map((row) => ({ ...row, note: null, key: row.label }))} />
      ) : null}

      <div className="grid gap-8 sm:grid-cols-2">
        {groups.map((group) => (
          <FeatureGroup key={group.id} title={group.title} rows={group.rows} />
        ))}
      </div>
    </section>
  );
}

function FeatureGroup({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ key?: string; label: string; value: string; note: string | null }>;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {title}
      </h3>
      <dl className="mt-3 divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
        {rows.map((row) => (
          <div key={row.key ?? row.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 py-2.5 text-sm">
            <dt className="text-[var(--text-secondary)]">{row.label}</dt>
            <dd className="text-[var(--text-primary)]">
              <span className="font-medium">{row.value}</span>
              {row.note ? (
                <p className="mt-0.5 text-xs font-normal text-[var(--text-muted)]">{row.note}</p>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
