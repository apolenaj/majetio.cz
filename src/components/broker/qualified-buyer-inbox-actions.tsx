"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  acceptQualifiedBuyerLeadAction,
  recordQualifiedBuyerFirstResponseAction,
} from "@/domains/crm/server/broker-actions";

export function QualifiedBuyerInboxActions({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onRespond() {
    setBusy(true);
    setError(null);
    const result = await recordQualifiedBuyerFirstResponseAction({ leadId });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function onAccept() {
    setBusy(true);
    setError(null);
    const result = await acceptQualifiedBuyerLeadAction({ leadId });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        loading={busy}
        onClick={() => void onRespond()}
      >
        Zaznamenat odpověď (SLA)
      </Button>
      <Button
        type="button"
        size="sm"
        loading={busy}
        onClick={() => void onAccept()}
      >
        Přijmout lead
      </Button>
      {error ? (
        <span className="text-xs text-[var(--status-error)]">{error}</span>
      ) : null}
    </div>
  );
}
