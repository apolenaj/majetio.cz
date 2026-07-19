import { CheckSquare2, CircleAlert, ShieldAlert } from "lucide-react";

import { RiskBadge } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineAlert } from "@/components/feedback/states";
import {
  dueDiligenceLabel,
  severityLabel,
  severityOrder,
  type DueDiligenceStatus,
  type PropertyRiskItem,
  type VerifyChecklistItem,
} from "@/content/demo-property-context";
import { cn } from "@/lib/utils";

const NEU = "Neuvedeno";

/**
 * Dominant risks + verify checklist + due diligence status.
 */
export function PropertyRisksSection({
  risks,
  checklist,
  dueDiligenceStatus,
  dueDiligenceNote,
}: {
  risks: PropertyRiskItem[];
  checklist: VerifyChecklistItem[];
  dueDiligenceStatus: DueDiligenceStatus | null;
  dueDiligenceNote: string | null;
}) {
  const sorted = [...risks].sort(
    (a, b) => severityOrder(a.severity) - severityOrder(b.severity),
  );

  const ddTone =
    dueDiligenceStatus === "verified"
      ? "success"
      : dueDiligenceStatus === "partial"
        ? "warning"
        : "error";

  return (
    <section
      aria-labelledby="risks-heading"
      className="rounded-[var(--radius-card)] border-2 border-[color-mix(in_srgb,var(--status-warning)_45%,var(--border-default))] bg-[color-mix(in_srgb,var(--status-warning)_5%,var(--surface-primary))] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="risks-heading"
            className="font-display text-xl text-[var(--text-primary)] sm:text-2xl"
          >
            Rizika a co ověřit
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            Hierarchie podle závažnosti. Chybějící položky nejsou nahrazovány
            nulou ani falešnou jistotou.
          </p>
        </div>
        {dueDiligenceStatus ? (
          <Badge tone={ddTone}>
            <ShieldAlert className="size-3.5" aria-hidden />
            Due diligence: {dueDiligenceLabel(dueDiligenceStatus)}
          </Badge>
        ) : (
          <Badge tone="neutral">Due diligence: {NEU}</Badge>
        )}
      </div>

      {dueDiligenceNote ? (
        <p className="mt-3 text-sm text-[var(--text-secondary)]">{dueDiligenceNote}</p>
      ) : null}

      {sorted.length === 0 ? (
        <InlineAlert className="mt-5" tone="info" title="Rizika zatím neuvedena">
          Pro tuto nabídku nejsou připravená demonstrační rizika. To neznamená
          absenci rizik v realitě.
        </InlineAlert>
      ) : (
        <ul className="mt-5 space-y-3">
          {sorted.map((risk) => (
            <li key={risk.id}>
              <Card
                padding="md"
                elevation="flat"
                className={cn(
                  risk.severity === "critical" &&
                    "border-[var(--status-error)] bg-[color-mix(in_srgb,var(--status-error)_6%,white)]",
                  risk.severity === "high" &&
                    "border-[color-mix(in_srgb,var(--status-error)_50%,var(--border-default))]",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-caption font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    {severityLabel(risk.severity)}
                  </span>
                  <RiskBadge level={risk.severity} />
                </div>
                <h3 className="mt-2 font-display text-lg text-[var(--text-primary)]">
                  {risk.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{risk.text}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Card className="mt-6" padding="lg">
        <CardHeader>
          <CardTitle as="h3" className="flex items-center gap-2">
            <CheckSquare2 className="size-5 text-[var(--action-accent)]" aria-hidden />
            Co ověřit
          </CardTitle>
          <CardDescription>
            Checklist před rozhodnutím — Majetio neprovádí právní due diligence za vás.
          </CardDescription>
        </CardHeader>
        {checklist.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Checklist: {NEU}</p>
        ) : (
          <ul className="space-y-2">
            {checklist.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-2"
              >
                <CircleAlert
                  className="mt-0.5 size-4 shrink-0 text-[var(--status-warning)]"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {item.label}
                  </p>
                  {item.hint ? (
                    <p className="text-xs text-[var(--text-muted)]">{item.hint}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
