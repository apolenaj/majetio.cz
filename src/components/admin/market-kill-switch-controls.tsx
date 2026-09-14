"use client";

import { useTransition } from "react";

import { adminApplyKillSwitchAction } from "@/domains/markets/server/actions";
import type { KillSwitchTarget } from "@/domains/markets";

type KillFlags = {
  pauseNewListings: boolean;
  pauseValuations: boolean;
  pauseLeadRouting: boolean;
  pausePayments: boolean;
  reviewRequired: boolean;
};

const CONTROLS: Array<{
  target: KillSwitchTarget;
  flag: keyof KillFlags;
  label: string;
}> = [
  { target: "new_listings", flag: "pauseNewListings", label: "Nové nabídky" },
  { target: "valuations", flag: "pauseValuations", label: "Valuace" },
  { target: "lead_routing", flag: "pauseLeadRouting", label: "Lead routing" },
  { target: "payments", flag: "pausePayments", label: "Platby" },
  {
    target: "review_required",
    flag: "reviewRequired",
    label: "review_required",
  },
];

export function MarketKillSwitchControls(props: {
  marketCode: string;
  killSwitch: KillFlags;
}) {
  const [pending, startTransition] = useTransition();

  function toggle(target: KillSwitchTarget, currentlyOn: boolean) {
    startTransition(async () => {
      await adminApplyKillSwitchAction({
        marketCode: props.marketCode,
        target,
        enabled: !currentlyOn,
        reason: currentlyOn ? "admin_clear" : "admin_pause",
      });
    });
  }

  return (
    <div className="flex flex-col gap-1">
      {CONTROLS.map((c) => {
        const on = props.killSwitch[c.flag];
        return (
          <button
            key={c.target}
            type="button"
            disabled={pending}
            onClick={() => toggle(c.target, on)}
            className={
              on
                ? "rounded px-2 py-0.5 text-left text-xs text-[var(--status-warning)] underline-offset-2 hover:underline disabled:opacity-50"
                : "rounded px-2 py-0.5 text-left text-xs text-[var(--text-muted)] underline-offset-2 hover:underline disabled:opacity-50"
            }
            title={
              on
                ? `Vypnout ${c.label} kill switch`
                : `Zapnout ${c.label} kill switch`
            }
          >
            {c.label}: {on ? "PAUSED" : "ok"}
          </button>
        );
      })}
    </div>
  );
}
