"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { InlineAlert } from "@/components/feedback/states";

/**
 * Dev-only mock payment UI — simulates provider redirect + signed webhook.
 */
export function MockPayClient() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("orderId");
  const providerPaymentId = params.get("providerPaymentId");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function complete(
    type: "payment.succeeded" | "payment.failed" | "payment.cancelled",
  ) {
    if (!orderId || !providerPaymentId) {
      setError("Chybí parametry platby.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/payments/mock-complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId, providerPaymentId, type }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Simulace platby selhala.");
      return;
    }
    if (type === "payment.succeeded") {
      router.push(`/checkout/success?orderId=${orderId}`);
    } else {
      router.push(`/checkout/cancel?orderId=${orderId}`);
    }
  }

  return (
    <Container className="py-10">
      <Card className="mx-auto max-w-md space-y-4 p-6">
        <h1 className="font-display text-xl">Mock platební brána</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Pouze vývojové / staging prostředí. Secrets zůstávají na serveru.
        </p>
        {error ? (
          <InlineAlert tone="warning" title="Chyba">
            {error}
          </InlineAlert>
        ) : null}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            loading={busy}
            onClick={() => void complete("payment.succeeded")}
          >
            Simulovat úspěšnou platbu
          </Button>
          <Button
            type="button"
            variant="outline"
            loading={busy}
            onClick={() => void complete("payment.failed")}
          >
            Simulovat selhání
          </Button>
          <Button
            type="button"
            variant="ghost"
            loading={busy}
            onClick={() => void complete("payment.cancelled")}
          >
            Zrušit platbu
          </Button>
        </div>
      </Card>
    </Container>
  );
}
