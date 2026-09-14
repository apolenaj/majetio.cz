"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  CheckoutStepProgress,
  CHECKOUT_STEPS,
} from "@/components/checkout/checkout-step-progress";
import { Field, TextInput, Label } from "@/components/forms/field";
import { Select } from "@/components/forms/controls";
import { InlineAlert } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { commerceConfig } from "@/config/commerce";
import {
  previewCheckoutQuoteAction,
  startCheckoutAction,
} from "@/domains/orders/server/actions";

type QuoteDisplay = {
  list: string;
  discount: string;
  net: string;
  vat: string;
  gross: string;
  vatRatePct: string;
};

export type CheckoutProductOption = {
  key: string;
  name: string;
  priceLabel: string;
};

export function CheckoutWizard({
  defaultEmail,
  defaultName,
  initialProductKey = "full_analysis",
  analysisId = null,
  products,
}: {
  defaultEmail?: string | null;
  defaultName?: string | null;
  initialProductKey?: string;
  analysisId?: string | null;
  products: CheckoutProductOption[];
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = React.useState(0);
  const productOptions =
    products.length > 0
      ? products
      : [
          {
            key: commerceConfig.products.fullAnalysis.key,
            name: commerceConfig.products.fullAnalysis.name,
            priceLabel: "",
          },
          {
            key: commerceConfig.products.basicAnalysis.key,
            name: commerceConfig.products.basicAnalysis.name,
            priceLabel: "Zdarma",
          },
        ];
  const initialKey = productOptions.some((p) => p.key === initialProductKey)
    ? initialProductKey
    : productOptions[0]?.key ?? "full_analysis";
  const [productKey, setProductKey] = React.useState(initialKey);
  const [promoCode, setPromoCode] = React.useState("");
  const [display, setDisplay] = React.useState<QuoteDisplay | null>(null);
  const [productName, setProductName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [billing, setBilling] = React.useState({
    name: defaultName ?? "",
    email: defaultEmail ?? "",
    company: "",
    street: "",
    city: "",
    zip: "",
    country: "CZ",
    vatId: "",
  });
  /** Purchase Terms — never pre-checked; marketing is not collected here (211/212). */
  const [acceptPurchaseTerms, setAcceptPurchaseTerms] = React.useState(false);

  const step = CHECKOUT_STEPS[stepIndex] ?? "select_product";

  async function refreshQuote() {
    setError(null);
    const result = await previewCheckoutQuoteAction({
      productKey,
      promoCode: promoCode || null,
    });
    if (!result.ok) {
      setError(result.error);
      setDisplay(null);
      return;
    }
    setDisplay(result.display);
    setProductName(result.productName);
  }

  React.useEffect(() => {
    void refreshQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh on product/promo
  }, [productKey]);

  async function onPay() {
    if (!acceptPurchaseTerms) {
      setError(
        "Pro dokončení nákupu je nutný souhlas s Obchodními podmínkami.",
      );
      return;
    }
    setBusy(true);
    setError(null);
    const storageKey = `majetio.checkout.idem:${productKey}:${analysisId ?? ""}`;
    let idempotencyKey: string | undefined;
    try {
      const existing =
        typeof sessionStorage !== "undefined"
          ? sessionStorage.getItem(storageKey)
          : null;
      if (existing) {
        idempotencyKey = existing;
      } else if (typeof crypto !== "undefined" && crypto.randomUUID) {
        idempotencyKey = crypto.randomUUID();
        sessionStorage.setItem(storageKey, idempotencyKey);
      }
    } catch {
      idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : undefined;
    }
    const result = await startCheckoutAction({
      productKey,
      analysisId,
      promoCode: promoCode || null,
      billing,
      acceptPurchaseTerms: true,
      idempotencyKey,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    if (result.checkoutUrl) {
      setStepIndex(CHECKOUT_STEPS.indexOf("payment"));
      window.location.href = result.checkoutUrl;
      return;
    }
    router.push(`/checkout/success?orderId=${result.orderId}`);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <CheckoutStepProgress current={step} />

      <p className="text-xs text-[var(--text-muted)]">
        Měna: pouze {commerceConfig.currency}. Ceny včetně DPH počítá server —
        klientská částka se neodesílá. Žádný skrytý recurring charge — obnova
        předplatného jen po výslovném souhlasu (viz ceník / Objednávky).
      </p>

      {error ? (
        <InlineAlert tone="warning" title="Checkout">
          {error}
        </InlineAlert>
      ) : null}

      {step === "select_product" ? (
        <Card className="space-y-4 p-5">
          <h1 className="font-display text-2xl text-[var(--text-primary)]">
            Vyberte produkt
          </h1>
          <Label htmlFor="product">Produkt</Label>
          <Select
            id="product"
            value={productKey}
            onChange={(e) => setProductKey(e.target.value)}
          >
            {productOptions.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}
                {p.priceLabel ? ` · ${p.priceLabel}` : ""}
              </option>
            ))}
          </Select>
          <Button type="button" onClick={() => setStepIndex(1)}>
            Pokračovat
          </Button>
        </Card>
      ) : null}

      {step === "review" ? (
        <Card className="space-y-4 p-5">
          <h1 className="font-display text-2xl">Rekapitulace</h1>
          <p className="text-sm text-[var(--text-secondary)]">{productName}</p>
          {display ? (
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-[var(--text-muted)]">Cena bez DPH</dt>
              <dd>{display.net}</dd>
              <dt className="text-[var(--text-muted)]">
                DPH ({display.vatRatePct} %)
              </dt>
              <dd>{display.vat}</dd>
              <dt className="text-[var(--text-muted)]">Sleva</dt>
              <dd>{display.discount}</dd>
              <dt className="font-medium">Celkem s DPH ({commerceConfig.currency})</dt>
              <dd className="font-medium">{display.gross}</dd>
            </dl>
          ) : null}
          <Field id="promo" label="Promo kód (volitelně)">
            <TextInput
              id="promo"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStepIndex(0)}
            >
              Zpět
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void refreshQuote()}
            >
              Přepočítat
            </Button>
            <Button type="button" onClick={() => setStepIndex(2)}>
              K fakturačním údajům
            </Button>
          </div>
        </Card>
      ) : null}

      {step === "billing" ? (
        <Card className="space-y-4 p-5">
          <h1 className="font-display text-2xl">Fakturační údaje</h1>
          <Field id="name" label="Jméno / název">
            <TextInput
              id="name"
              value={billing.name}
              onChange={(e) =>
                setBilling((b) => ({ ...b, name: e.target.value }))
              }
              required
            />
          </Field>
          <Field id="email" label="E-mail">
            <TextInput
              id="email"
              type="email"
              value={billing.email}
              onChange={(e) =>
                setBilling((b) => ({ ...b, email: e.target.value }))
              }
              required
            />
          </Field>
          <Field id="street" label="Ulice">
            <TextInput
              id="street"
              value={billing.street}
              onChange={(e) =>
                setBilling((b) => ({ ...b, street: e.target.value }))
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="city" label="Město">
              <TextInput
                id="city"
                value={billing.city}
                onChange={(e) =>
                  setBilling((b) => ({ ...b, city: e.target.value }))
                }
              />
            </Field>
            <Field id="zip" label="PSČ">
              <TextInput
                id="zip"
                value={billing.zip}
                onChange={(e) =>
                  setBilling((b) => ({ ...b, zip: e.target.value }))
                }
              />
            </Field>
          </div>
          <Field id="vat" label="DIČ (volitelně)">
            <TextInput
              id="vat"
              value={billing.vatId}
              onChange={(e) =>
                setBilling((b) => ({ ...b, vatId: e.target.value }))
              }
            />
          </Field>
          <label className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              className="mt-1"
              checked={acceptPurchaseTerms}
              onChange={(e) => setAcceptPurchaseTerms(e.target.checked)}
              aria-required="true"
            />
            <span>
              Souhlasím s{" "}
              <a
                href="/podminky"
                className="underline underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                Obchodními podmínkami
              </a>{" "}
              a beru na vědomí digitální přístup po zaplacení. Marketingový
              souhlas není součástí nákupu — spravujete jej samostatně v{" "}
              <a
                href="/ucet/soukromi"
                className="underline underline-offset-2"
              >
                účtu
              </a>
              .
            </span>
          </label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStepIndex(1)}
            >
              Zpět
            </Button>
            <Button
              type="button"
              loading={busy}
              onClick={() => void onPay()}
              disabled={!billing.name || !billing.email || !acceptPurchaseTerms}
            >
              Zaplatit
            </Button>
          </div>
        </Card>
      ) : null}

      {step === "payment" ? (
        <Card className="space-y-3 p-5">
          <h1 className="font-display text-2xl">Přesměrování na platbu</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Probíhá přesměrování na platební bránu. Po dokončení platby
            potvrdíme webhookem a aktivujeme přístup.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
