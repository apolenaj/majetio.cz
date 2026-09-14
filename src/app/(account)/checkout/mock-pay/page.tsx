import { redirect } from "next/navigation";
import { Suspense } from "react";

import { InlineAlert } from "@/components/feedback/states";
import { Container } from "@/components/ui/container";
import {
  isPaymentsMockAllowed,
  resolvePaymentsConfig,
} from "@/integrations/payments";

import { MockPayClient } from "./mock-pay-client";

export const metadata = {
  title: "Mock platba | Majetio",
  robots: { index: false, follow: false },
};

/**
 * Dev/staging mock PSP page — gated server-side (Prompt 20.4).
 * Production without PAYMENTS_ALLOW_MOCK redirects away.
 */
export default function MockPayPage() {
  const config = resolvePaymentsConfig();
  if (config.provider !== "mock" || !isPaymentsMockAllowed()) {
    redirect("/checkout");
  }

  return (
    <Suspense
      fallback={
        <Container className="py-10">
          <p className="text-sm text-[var(--text-muted)]">Načítám platbu…</p>
        </Container>
      }
    >
      <MockPayClient />
      <Container className="pb-6">
        <InlineAlert tone="info" title="Vývojová brána">
          Mock PSP — entitlement vzniká jen po podepsaném webhooku, ne po
          redirectu samotném.
        </InlineAlert>
      </Container>
    </Suspense>
  );
}
