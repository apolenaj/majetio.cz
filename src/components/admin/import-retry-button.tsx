"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/states";
import { adminRetryImportJobAction } from "@/domains/data-engine/server/admin-actions";

export function ImportRetryButton({
  jobId,
  canRetry,
}: {
  jobId: string;
  canRetry: boolean;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  if (!canRetry) return null;

  async function onRetry() {
    setBusy(true);
    setError(null);
    setOk(null);
    const result = await adminRetryImportJobAction({ jobId });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOk(
      `Retry queued — ${result.resetItemCount} failed item(s) reset (idempotent).`,
    );
  }

  return (
    <div className="space-y-2">
      {error ? (
        <InlineAlert tone="warning" title="Retry">
          {error}
        </InlineAlert>
      ) : null}
      {ok ? (
        <InlineAlert tone="info" title="Hotovo">
          {ok}
        </InlineAlert>
      ) : null}
      <Button type="button" size="sm" disabled={busy} onClick={() => void onRetry()}>
        {busy ? "Retry…" : "Retry failed job"}
      </Button>
    </div>
  );
}
