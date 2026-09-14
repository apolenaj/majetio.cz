import { RiskBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LocationRisksProps } from "@/components/locations/types";

const LEVEL_TO_RISK = {
  low: "low",
  medium: "medium",
  high: "high",
} as const;

export function LocationRisksSection({ risks }: LocationRisksProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {risks.map((risk) => (
        <li key={risk.title}>
          <Card padding="md" elevation="flat">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium text-[var(--text-primary)]">{risk.title}</h3>
              <RiskBadge level={LEVEL_TO_RISK[risk.level]} />
            </div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{risk.description}</p>
          </Card>
        </li>
      ))}
    </ul>
  );
}
