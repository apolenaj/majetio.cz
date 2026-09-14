import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  hasPermission,
  requirePermission,
} from "@/domains/administration";
import { getAdminPropertyDetail } from "@/domains/properties/admin/detail";
import {
  PropertyModerationPanel,
  PropertyOverrideForm,
} from "@/components/admin/property-ops-panels";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Property detail",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let actor;
  try {
    actor = await requirePermission("property.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const { id } = await params;
  const { detail, error } = await getAdminPropertyDetail(id);

  if (error) {
    return (
      <InlineAlert tone="warning" title="Detail">
        {error}
      </InlineAlert>
    );
  }
  if (!detail) {
    return (
      <InlineAlert tone="warning" title="Nenalezeno">
        Property {id} neexistuje.
      </InlineAlert>
    );
  }

  const canOverride = hasPermission(actor.role, "property.override");
  const canModerate = hasPermission(actor.role, "property.moderate");

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/admin/nemovitosti"
          className="text-xs text-[var(--text-link)] hover:underline"
        >
          ← Property list
        </Link>
        <PageHeader
          title={detail.title}
          description={`${detail.status} · ${detail.marketCode} · ${detail.freshness} · ${detail.visibility}`}
        />
        <p className="text-xs text-[var(--text-muted)]">
          {detail.id} · /{detail.slug}
          {detail.isDemo ? " · demo" : ""}
        </p>
      </div>

      {!detail.publishValidation.ok ? (
        <InlineAlert tone="warning" title="Pre-publish validation">
          {detail.publishValidation.issues.map((i) => i.message).join(" · ")}
        </InlineAlert>
      ) : (
        <InlineAlert tone="info" title="Pre-publish validation">
          Ready for review / publish (no critical blockers).
        </InlineAlert>
      )}

      {(detail.moderationReason || detail.userFacingModerationMessage) && (
        <section className="space-y-1 rounded-lg border border-[var(--border-default)] p-4">
          <h2 className="font-display text-lg">Moderation</h2>
          {detail.moderationReason ? (
            <p className="text-sm">
              <span className="text-[var(--text-muted)]">Internal reason: </span>
              {detail.moderationReason}
            </p>
          ) : null}
          {detail.userFacingModerationMessage ? (
            <p className="text-sm">
              <span className="text-[var(--text-muted)]">User-facing: </span>
              {detail.userFacingModerationMessage}
            </p>
          ) : null}
        </section>
      )}

      {canModerate ? (
        <section className="space-y-3 rounded-lg border border-[var(--border-default)] p-4">
          <h2 className="font-display text-lg">Publish / Moderace</h2>
          <PropertyModerationPanel
            propertyId={detail.id}
            status={detail.status}
            canModerate={canModerate}
          />
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl">Canonical data</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Co vidí uživatel / discovery — po apply overrideů (včetně expirace).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)]">
                <th className="py-2 pr-3 font-medium">Field</th>
                <th className="py-2 pr-3 font-medium">Display</th>
                <th className="py-2 pr-3 font-medium">Stored</th>
                <th className="py-2 pr-3 font-medium">Tag</th>
              </tr>
            </thead>
            <tbody>
              {detail.canonicalFields.map((f) => (
                <tr
                  key={f.fieldKey}
                  className="border-b border-[var(--border-subtle)]"
                >
                  <td className="py-2 pr-3 font-medium">{f.fieldKey}</td>
                  <td className="py-2 pr-3 max-w-xs truncate">
                    {f.displayValue ?? "—"}
                  </td>
                  <td className="py-2 pr-3 max-w-xs truncate text-[var(--text-muted)]">
                    {f.storedValue ?? "—"}
                  </td>
                  <td className="py-2 pr-3">
                    {f.fromOverride || f.manualTag ? (
                      <span className="text-[var(--status-warning)]">
                        Manuálně upraveno
                        {f.overrideExpiresAt
                          ? ` · exp ${new Date(f.overrideExpiresAt).toLocaleString("cs-CZ")}`
                          : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Source data</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Odkud data přišla — PropertySource relations (nikdy nemažeme při merge).
        </p>
        {detail.sources.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Žádné zdroje.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {detail.sources.map((s) => (
              <li
                key={s.id}
                className="rounded border border-[var(--border-subtle)] px-3 py-2"
              >
                <span className="font-medium">{s.provider}</span> · {s.sourceType}
                {s.isPrimary ? " · primary" : ""} · license {s.licenseStatus}
                <p className="text-xs text-[var(--text-muted)]">
                  ext={s.externalPropertyId ?? "—"} · lastSeen{" "}
                  {s.lastSeenAt.toLocaleString("cs-CZ")}
                  {s.url ? (
                    <>
                      {" "}
                      ·{" "}
                      <a
                        href={s.url}
                        className="text-[var(--text-link)] hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        URL
                      </a>
                    </>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Field-level provenance</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Historie a důvěryhodnost konkrétního pole.
        </p>
        {detail.provenance.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Bez provenance záznamů.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)]">
                  <th className="py-2 pr-3 font-medium">Field</th>
                  <th className="py-2 pr-3 font-medium">Provider</th>
                  <th className="py-2 pr-3 font-medium">Observed</th>
                  <th className="py-2 pr-3 font-medium">Confidence</th>
                  <th className="py-2 pr-3 font-medium">Snapshot</th>
                </tr>
              </thead>
              <tbody>
                {detail.provenance.map((p, idx) => (
                  <tr
                    key={`${p.fieldKey}-${idx}`}
                    className="border-b border-[var(--border-subtle)]"
                  >
                    <td className="py-2 pr-3">{p.fieldKey}</td>
                    <td className="py-2 pr-3">
                      {p.provider ?? "—"} ({p.sourceType ?? "—"})
                    </td>
                    <td className="py-2 pr-3">
                      {p.observedAt.toLocaleString("cs-CZ")}
                    </td>
                    <td className="py-2 pr-3">
                      {p.confidence != null ? p.confidence.toFixed(2) : "—"}
                    </td>
                    <td className="py-2 pr-3 max-w-xs truncate">
                      {p.valueSnapshot ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {canOverride ? (
        <section className="space-y-3 rounded-lg border border-[var(--border-default)] p-4">
          <h2 className="font-display text-lg">Manual override</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Reason, actor, timestamp a tag „Manuálně upraveno“; volitelná expirace.
          </p>
          <PropertyOverrideForm
            propertyId={detail.id}
            fields={detail.canonicalFields}
          />
          {detail.overrides.length > 0 ? (
            <ul className="mt-4 space-y-1 text-xs text-[var(--text-muted)]">
              {detail.overrides.map((o) => (
                <li key={o.fieldKey}>
                  {o.fieldKey} = {o.value.slice(0, 80)}
                  {o.reason ? ` · ${o.reason}` : ""}
                  {o.updatedById || o.createdById
                    ? ` · actor ${o.updatedById ?? o.createdById}`
                    : ""}
                  {o.updatedAt
                    ? ` · ${new Date(String(o.updatedAt)).toLocaleString("cs-CZ")}`
                    : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
