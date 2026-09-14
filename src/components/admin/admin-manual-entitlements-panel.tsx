"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, TextInput } from "@/components/forms/field";
import { Select } from "@/components/forms/controls";
import { InlineAlert } from "@/components/feedback/states";
import {
  adminGrantManualEntitlementAction,
  adminListManualEntitlementsAction,
  adminRevokeManualEntitlementAction,
} from "@/domains/entitlements/server/actions";

/**
 * Admin UI for MANUAL_ADMIN entitlements (208 / 209) — separated from paid.
 */
export function AdminManualEntitlementsPanel() {
  const [email, setEmail] = React.useState("");
  const [productKey, setProductKey] = React.useState("buyer_pass");
  const [reason, setReason] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [listed, setListed] = React.useState<
    Array<{
      id: string;
      productKey: string;
      status: string;
      expiresAt: Date | string | null;
      manualReason: string | null;
    }>
  >([]);

  async function onGrant() {
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await adminGrantManualEntitlementAction({
      userEmail: email,
      productKey,
      reason,
      expiresAtIso: expiresAt || null,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(`Manuální entitlement vytvořen: ${result.entitlementId}`);
    await onList();
  }

  async function onList() {
    setBusy(true);
    setError(null);
    const result = await adminListManualEntitlementsAction({
      userEmail: email,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      setListed([]);
      return;
    }
    setListed(
      result.entitlements.map((e) => ({
        id: e.id,
        productKey: e.productKey,
        status: e.status,
        expiresAt: e.expiresAt,
        manualReason: e.manualReason,
      })),
    );
  }

  async function onRevoke(entitlementId: string) {
    setBusy(true);
    setError(null);
    const result = await adminRevokeManualEntitlementAction({
      entitlementId,
      reason: reason || "Admin revoke manual entitlement",
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(`Revokováno: ${entitlementId}`);
    await onList();
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        <h2 className="font-display text-xl">Manuální entitlement (208/209)</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Source vždy <code>MANUAL_ADMIN</code>, bez <code>orderId</code> —
          odděleno od placených grantů.
        </p>
        {error ? (
          <InlineAlert tone="warning" title="Chyba">
            {error}
          </InlineAlert>
        ) : null}
        {message ? (
          <InlineAlert tone="info" title="OK">
            {message}
          </InlineAlert>
        ) : null}
        <Field id="email" label="E-mail uživatele">
          <TextInput
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <div>
          <label htmlFor="product" className="text-sm font-medium">
            Produkt
          </label>
          <Select
            id="product"
            value={productKey}
            onChange={(e) => setProductKey(e.target.value)}
          >
            <option value="buyer_pass">Buyer Pass</option>
            <option value="deep_analysis">Deep Analysis</option>
            <option value="investor_pro">Investor Pro</option>
            <option value="full_analysis">Kompletní analýza</option>
          </Select>
        </div>
        <Field id="reason" label="Důvod (min. 8 znaků)">
          <TextInput
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Např. kompenzace výpadku služby"
          />
        </Field>
        <Field id="expires" label="Expirace (volitelně, ISO datum)">
          <TextInput
            id="expires"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="button" loading={busy} onClick={() => void onGrant()}>
            Udělit manuálně
          </Button>
          <Button
            type="button"
            variant="outline"
            loading={busy}
            onClick={() => void onList()}
          >
            Načíst manuální entitlements
          </Button>
        </div>
      </Card>

      {listed.length > 0 ? (
        <div className="space-y-3">
          {listed.map((e) => (
            <Card key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-4" elevation="flat">
              <div>
                <p className="font-medium">
                  {e.productKey} · {e.status}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {e.id}
                  {e.expiresAt
                    ? ` · expirace ${new Date(e.expiresAt).toLocaleDateString("cs-CZ")}`
                    : ""}
                </p>
                {e.manualReason ? (
                  <p className="text-xs text-[var(--text-secondary)]">
                    {e.manualReason}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                loading={busy}
                onClick={() => void onRevoke(e.id)}
              >
                Revokovat
              </Button>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
