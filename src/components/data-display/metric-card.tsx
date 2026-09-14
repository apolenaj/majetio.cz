import { TrendingDown, TrendingUp } from "lucide-react";

import { DataQualityBadge, type DataQuality } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip, DataSource } from "@/components/overlays/tooltip";
import { cn } from "@/lib/utils";

export function MetricValue({
  value,
  tone = "neutral",
  size = "l",
  className,
}: {
  value: React.ReactNode;
  tone?: "neutral" | "positive" | "negative";
  size?: "xl" | "l" | "m" | "s";
  className?: string;
}) {
  const sizeClass = {
    xl: "text-[var(--text-metric-xl)]",
    l: "text-[var(--text-metric-l)]",
    m: "text-[var(--text-metric-m)]",
    s: "text-[var(--text-metric-s)]",
  }[size];
  const toneClass = {
    neutral: "text-[var(--text-primary)]",
    positive: "text-[var(--investment-positive)]",
    negative: "text-[var(--investment-negative)]",
  }[tone];

  return (
    <p className={cn("font-metric font-semibold", sizeClass, toneClass, className)}>
      {value}
    </p>
  );
}

export function MetricCard({
  title,
  value,
  unit,
  explanation,
  explainTrigger,
  tone = "neutral",
  trend,
  changeLabel,
  quality,
  source,
  updatedAt,
  className,
}: {
  title: string;
  value: React.ReactNode;
  unit?: string;
  explanation?: string;
  /** Custom explainability control (e.g. formula registry dialog). */
  explainTrigger?: React.ReactNode;
  tone?: "neutral" | "positive" | "negative";
  trend?: "up" | "down" | "flat";
  changeLabel?: string;
  quality?: DataQuality;
  source?: string;
  updatedAt?: string;
  className?: string;
}) {
  return (
    <Card className={className} elevation="flat">
      <CardHeader className="mb-2 !flex-row items-start justify-between gap-2">
        <div>
          <CardDescription className="text-[var(--text-caption)] uppercase tracking-wide">
            {title}
          </CardDescription>
          {quality ? <div className="mt-2"><DataQualityBadge quality={quality} /></div> : null}
        </div>
        {explainTrigger ? (
          explainTrigger
        ) : explanation ? (
          <InfoTooltip label={`Vysvětlení: ${title}`} content={explanation} />
        ) : null}
      </CardHeader>
      <div className="flex items-baseline gap-2">
        <MetricValue value={value} tone={tone} size="l" />
        {unit ? <span className="text-sm text-[var(--text-muted)]">{unit}</span> : null}
      </div>
      {(trend || changeLabel) && (
        <p className="mt-2 inline-flex items-center gap-1 text-sm text-[var(--text-secondary)]">
          {trend === "up" ? <TrendingUp className="size-4 text-[var(--investment-positive)]" aria-hidden /> : null}
          {trend === "down" ? <TrendingDown className="size-4 text-[var(--investment-negative)]" aria-hidden /> : null}
          {changeLabel}
        </p>
      )}
      {source ? <DataSource className="mt-3" source={source} updatedAt={updatedAt} /> : null}
    </Card>
  );
}

export type ScoreInterpretation =
  | "excellent"
  | "very-good"
  | "good"
  | "average"
  | "weak"
  | "insufficient";

export function interpretScore(score: number | null): {
  key: ScoreInterpretation;
  label: string;
} {
  if (score == null || Number.isNaN(score)) {
    return { key: "insufficient", label: "Nedostatek dat" };
  }
  if (score >= 85) return { key: "excellent", label: "Výborné" };
  if (score >= 75) return { key: "very-good", label: "Velmi dobré" };
  if (score >= 65) return { key: "good", label: "Dobré" };
  if (score >= 50) return { key: "average", label: "Průměrné" };
  return { key: "weak", label: "Slabé" };
}

export function MajetioScore({
  score,
  variant = "horizontal",
  categories,
  className,
}: {
  score: number | null;
  variant?: "horizontal" | "ring";
  categories?: { label: string; value: number | null }[];
  className?: string;
}) {
  const interpretation = interpretScore(score);
  const insufficient = interpretation.key === "insufficient";

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Majetio skóre</CardTitle>
        <CardDescription>
          Orientační souhrn — není investičním doporučením.
        </CardDescription>
      </CardHeader>

      {insufficient ? (
        <p className="text-sm text-[var(--text-secondary)]">
          Nedostatek dat pro spolehlivé skóre.
        </p>
      ) : (
        <div className="flex flex-wrap items-end gap-6">
          {variant === "ring" ? (
            <div
              className="relative grid size-28 place-items-center rounded-full border-4 border-[var(--border-default)]"
              style={{
                background: `conic-gradient(var(--action-accent) ${(score ?? 0) * 3.6}deg, var(--background-secondary) 0)`,
              }}
              aria-hidden
            >
              <div className="grid size-20 place-items-center rounded-full bg-[var(--surface-primary)]">
                <span className="font-metric text-2xl font-semibold">{score}</span>
              </div>
            </div>
          ) : (
            <div className="min-w-[8rem]">
              <MetricValue value={score} size="xl" />
              <p className="text-sm text-[var(--text-muted)]">z 100</p>
            </div>
          )}
          <div>
            <p className="font-medium text-[var(--text-primary)]">{interpretation.label}</p>
            <div className="mt-3 h-2 w-48 overflow-hidden rounded-full bg-[var(--background-secondary)]">
              <div
                className="h-full rounded-full bg-[var(--action-accent)]"
                style={{ width: `${score}%` }}
                aria-hidden
              />
            </div>
            <p className="sr-only">Skóre {score} ze 100 — {interpretation.label}</p>
          </div>
        </div>
      )}

      {categories && categories.length > 0 ? (
        <ul className="mt-6 space-y-2 border-t border-[var(--border-default)] pt-4">
          {categories.map((cat) => (
            <li key={cat.label} className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">{cat.label}</span>
              <span className="font-metric font-medium">
                {cat.value == null ? "—" : cat.value}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
