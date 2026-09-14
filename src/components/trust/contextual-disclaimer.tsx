import { Info, Scale } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DisclaimerContext } from "./types";

export type ContextualDisclaimerProps = {
  context: DisclaimerContext;
  /** Override default copy for this context. */
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
};

const DEFAULT_COPY: Record<DisclaimerContext, { title: string; body: string }> =
  {
    valuation: {
      title: "Modelovaný odhad hodnoty",
      body: "Zobrazené číslo a pásmo jsou orientační rozpětí z modelu Majetio, nikoli oficiální znalecký posudek ani nabídková cena. Nepoužívejte je jako jediný podklad pro nákup.",
    },
    financing: {
      title: "Orientační financování",
      body: "Sazby a splátky jsou ilustrativní. Finální nabídku banky / zprostředkovatele vždy ověřte. Předání údajů partnerovi vyžaduje váš souhlas.",
    },
    yield: {
      title: "Modelovaný výnos",
      body: "Výnosové metriky vycházejí z předpokladů scénáře (nájem, náklady, financování). Změna vstupů změní výsledek — nejde o garantovaný výnos.",
    },
    location: {
      title: "Lokalitní kontext",
      body: "Skóre a trendy lokality jsou agregované odhady. Nemusí platit pro konkrétní adresu ani budoucí vývoj trhu.",
    },
    general: {
      title: "Informativní charakter",
      body: "Majetio poskytuje podklady k rozhodnutí. Nejde o investiční, právní ani daňové poradenství.",
    },
  };

/**
 * Inline legal/method disclaimer next to the data it qualifies — not only footer.
 */
export function ContextualDisclaimer({
  context,
  children,
  className,
  compact = false,
}: ContextualDisclaimerProps) {
  const defaults = DEFAULT_COPY[context];
  const Icon = context === "valuation" || context === "financing" ? Scale : Info;

  return (
    <aside
      role="note"
      aria-label={defaults.title}
      data-trust-disclaimer={context}
      className={cn(
        "border border-[var(--border-default)] bg-[var(--background-secondary)] text-[var(--text-secondary)]",
        compact
          ? "rounded-[var(--radius-sm)] px-3 py-2 text-[var(--text-caption)]"
          : "rounded-[var(--radius-md)] px-4 py-3 text-sm",
        className,
      )}
    >
      <div className="flex gap-2">
        <Icon
          className={cn(
            "mt-0.5 shrink-0 text-[var(--text-muted)]",
            compact ? "size-3.5" : "size-4",
          )}
          aria-hidden
        />
        <div className="min-w-0 space-y-1">
          <p className="font-medium text-[var(--text-primary)]">
            {defaults.title}
          </p>
          <div>{children ?? <p>{defaults.body}</p>}</div>
        </div>
      </div>
    </aside>
  );
}
