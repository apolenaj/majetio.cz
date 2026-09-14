import Link from "next/link";

import type { AttentionItem } from "@/domains/administration";
import { cn } from "@/lib/utils";

const SEVERITY_CLASS: Record<string, string> = {
  CRITICAL: "text-[var(--status-error)]",
  HIGH: "text-[var(--status-warning)]",
  MEDIUM: "text-[var(--text-primary)]",
  INFO: "text-[var(--text-muted)]",
};

function formatAge(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / (60 * 24))}d`;
}

export function OperationsAttentionQueue(props: {
  items: AttentionItem[];
  error?: string | null;
}) {
  if (props.error) {
    return (
      <p className="text-sm text-[var(--status-warning)]">
        Attention queue nedostupná: {props.error}
      </p>
    );
  }

  if (props.items.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        Žádné otevřené operační položky. Systém je v klidu.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)]">
            <th className="py-2 pr-3 font-medium">Severity</th>
            <th className="py-2 pr-3 font-medium">Typ</th>
            <th className="py-2 pr-3 font-medium">Popis</th>
            <th className="py-2 pr-3 font-medium">Entita</th>
            <th className="py-2 pr-3 font-medium">Age</th>
            <th className="py-2 pr-3 font-medium">Owner</th>
            <th className="py-2 font-medium">CTA</th>
          </tr>
        </thead>
        <tbody>
          {props.items.map((item) => (
            <tr
              key={item.id}
              className="border-b border-[var(--border-default)] align-top"
            >
              <td
                className={cn(
                  "py-2.5 pr-3 text-xs font-semibold",
                  SEVERITY_CLASS[item.severity],
                )}
              >
                {item.severity}
              </td>
              <td className="py-2.5 pr-3 text-xs text-[var(--text-muted)]">
                {item.type}
              </td>
              <td className="py-2.5 pr-3">{item.title}</td>
              <td className="py-2.5 pr-3 text-xs">
                {item.entityKind}
                <span className="block text-[var(--text-muted)]">
                  {item.entityId.slice(0, 16)}
                  {item.entityId.length > 16 ? "…" : ""}
                </span>
              </td>
              <td className="py-2.5 pr-3 text-xs tabular-nums">
                {formatAge(item.ageMinutes)}
              </td>
              <td className="py-2.5 pr-3 text-xs text-[var(--text-muted)]">
                {item.ownerLabel ?? "—"}
              </td>
              <td className="py-2.5">
                <Link
                  href={item.href}
                  className="text-xs font-medium text-[var(--text-primary)] underline-offset-2 hover:underline"
                >
                  Otevřít
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
