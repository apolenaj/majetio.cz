import type { PublicSourceFreshness } from "@/domains/properties/service/dto";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function formatDateTime(iso: string | null): string {
  if (!iso) return "neznámé";
  try {
    return new Intl.DateTimeFormat("cs-CZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const FRESHNESS_TONE: Record<string, "success" | "warning" | "neutral"> = {
  FRESH: "success",
  STALE: "warning",
  UNAVAILABLE: "neutral",
};

const FRESHNESS_LABEL: Record<string, string> = {
  FRESH: "Aktuální",
  STALE: "Zastaralé",
  UNAVAILABLE: "Nedostupné",
};

export function PropertySourceFreshness({
  sources,
  lastSeenAt,
  freshness,
  className,
}: {
  sources: PublicSourceFreshness[];
  lastSeenAt?: string | null;
  freshness?: string | null;
  className?: string;
}) {
  const overall = freshness ?? sources[0]?.freshness ?? "FRESH";

  return (
    <div className={cn("space-y-3 text-sm", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[var(--text-muted)]">Aktuálnost dat:</span>
        <Badge tone={FRESHNESS_TONE[overall] ?? "neutral"}>
          {FRESHNESS_LABEL[overall] ?? overall}
        </Badge>
      </div>
      <p className="text-[var(--text-secondary)]">
        Poslední ověření zdroje:{" "}
        <strong className="font-medium text-[var(--text-primary)]">
          {formatDateTime(lastSeenAt ?? sources.find((s) => s.isPrimary)?.lastSeenAt ?? null)}
        </strong>
      </p>
      {sources.length > 0 ? (
        <ul className="space-y-2">
          {sources.map((source) => (
            <li
              key={`${source.provider}-${source.lastSeenAt}`}
              className="rounded-[var(--radius-sm)] border border-[var(--border-default)] px-3 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {source.provider}
                  {source.isPrimary ? " (primární)" : ""}
                </span>
                <Badge tone={FRESHNESS_TONE[source.freshness] ?? "neutral"}>
                  {FRESHNESS_LABEL[source.freshness] ?? source.freshness}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Naposledy viděn: {formatDateTime(source.lastSeenAt)}
                {source.lastFetchedAt
                  ? ` · staženo: ${formatDateTime(source.lastFetchedAt)}`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[var(--text-muted)]">Žádný externí zdroj není napojen.</p>
      )}
    </div>
  );
}
