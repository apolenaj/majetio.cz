"use client";

import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  formatSupportReference,
  readLastRequestId,
} from "@/lib/observability/support-reference";

export default function SegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [supportRef, setSupportRef] = useState<string | null>(null);

  useEffect(() => {
    const ref = formatSupportReference({
      digest: error.digest ?? null,
      requestId: readLastRequestId(),
    });
    setSupportRef(ref);
    console.error(
      JSON.stringify({
        level: "error",
        msg: "client_boundary_error",
        digest: error.digest ?? null,
        requestId: readLastRequestId(),
      }),
    );
  }, [error]);

  return (
    <Container className="py-24 text-center">
      <div className="mb-8 flex justify-center">
        <Logo variant="dark" size="md" label="Majetio" />
      </div>
      <h1 className="font-display text-3xl text-[var(--color-ink)]">
        Něco se pokazilo
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-[var(--color-ink-soft)]">
        Došlo k neočekávané chybě. Zkuste to prosím znovu. Pokud problém
        přetrvá, napište nám a uveďte referenci níže.
      </p>
      {supportRef ? (
        <p
          className="mx-auto mt-4 max-w-md break-all font-mono text-xs text-[var(--color-ink-soft)]"
          data-testid="support-correlation-id"
        >
          Reference: {supportRef}
        </p>
      ) : null}
      <Button type="button" className="mt-8" onClick={reset}>
        Zkusit znovu
      </Button>
    </Container>
  );
}
