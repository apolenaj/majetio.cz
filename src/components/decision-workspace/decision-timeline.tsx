import Link from "next/link";

import type { DecisionTimelineEvent } from "@/domains/decision-workspace/service/timeline";
import { formatDateTime } from "@/lib/format";

export function DecisionTimeline({
  events,
  compact = false,
}: {
  events: DecisionTimelineEvent[];
  compact?: boolean;
}) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        Zatím žádné rozhodovací události.
      </p>
    );
  }

  return (
    <ol
      className={
        compact
          ? "space-y-2 border-l border-[var(--border-default)] pl-3"
          : "space-y-3 border-l-2 border-[var(--border-default)] pl-4"
      }
    >
      {events.map((ev) => (
        <li key={ev.id} className="relative">
          <span
            className="absolute -left-[1.28rem] top-1.5 size-2 rounded-full bg-[var(--action-accent)]"
            aria-hidden
          />
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {ev.href ? (
              <Link href={ev.href} className="hover:underline">
                {ev.label}
              </Link>
            ) : (
              ev.label
            )}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {formatDateTime(ev.at)}
          </p>
        </li>
      ))}
    </ol>
  );
}
