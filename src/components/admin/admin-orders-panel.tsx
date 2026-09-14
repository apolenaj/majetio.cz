"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, TextInput } from "@/components/forms/field";
import { InlineAlert } from "@/components/feedback/states";
import { formatCzkFromMinor } from "@/config/commerce";
import { adminRefundOrderAction } from "@/domains/payments/server/admin-actions";
import { SENSITIVE_CONFIRM_TOKEN } from "@/domains/administration/rbac/permissions";

type AdminOrderRow = {
  id: string;
  status: string;
  productKey: string;
  priceVersionKey: string;
  amountGrossMinor: number;
  amountVatMinor: number;
  currency: string;
  userId: string;
  createdAt: Date | string;
  paidAt: Date | string | null;
  refundedAt: Date | string | null;
  user: { email: string | null };
};

export function AdminOrdersPanel({ orders }: { orders: AdminOrderRow[] }) {
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [reasonById, setReasonById] = React.useState<Record<string, string>>(
    {},
  );
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function onRefund(orderId: string) {
    const reason = (reasonById[orderId] ?? "").trim();
    setBusyId(orderId);
    setError(null);
    setMessage(null);
    const result = await adminRefundOrderAction({
      orderId,
      reason,
      confirmToken: SENSITIVE_CONFIRM_TOKEN,
      kind: "storno",
    });
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(`Storno objednávky ${orderId} provedeno.`);
  }

  return (
    <div className="space-y-4">
      {error ? (
        <InlineAlert tone="warning" title="Storno">
          {error}
        </InlineAlert>
      ) : null}
      {message ? (
        <InlineAlert tone="info" title="Hotovo">
          {message}
        </InlineAlert>
      ) : null}

      {orders.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Žádné objednávky.</p>
      ) : null}

      {orders.map((o) => {
        const canRefund =
          o.status === "PAID" || o.status === "PARTIALLY_REFUNDED";
        return (
          <Card key={o.id} className="space-y-3 p-4" elevation="flat">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="font-medium text-[var(--text-primary)]">
                  {o.productKey} · {o.status}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {o.id} · {o.user.email ?? o.userId} · verze{" "}
                  {o.priceVersionKey}
                </p>
              </div>
              <p className="text-sm font-semibold">
                {formatCzkFromMinor(o.amountGrossMinor)}{" "}
                <span className="font-normal text-[var(--text-muted)]">
                  (DPH {formatCzkFromMinor(o.amountVatMinor)})
                </span>
              </p>
            </div>
            {canRefund ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <Field id={`reason-${o.id}`} label="Důvod storna (min. 12 znaků + step-up)">
                  <TextInput
                    id={`reason-${o.id}`}
                    value={reasonById[o.id] ?? ""}
                    onChange={(e) =>
                      setReasonById((m) => ({ ...m, [o.id]: e.target.value }))
                    }
                    placeholder="Např. storno na žádost zákazníka"
                  />
                </Field>
                <Button
                  type="button"
                  variant="outline"
                  loading={busyId === o.id}
                  onClick={() => void onRefund(o.id)}
                >
                  Storno / refund
                </Button>
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
