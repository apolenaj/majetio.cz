"use client";

import { useEffect, useState } from "react";

import {
  formatSupportReference,
  readLastRequestId,
} from "@/lib/observability/support-reference";

/**
 * Root global-error — must render its own <html>/<body> (replaces root layout).
 */
export default function GlobalError({
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
        msg: "global_error",
        digest: error.digest ?? null,
        requestId: readLastRequestId(),
      }),
    );
  }, [error]);

  return (
    <html lang="cs">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#0f1419",
          color: "#e8eef4",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <main style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 600,
              margin: "0 0 0.75rem",
            }}
          >
            Něco se pokazilo
          </h1>
          <p
            style={{
              margin: 0,
              lineHeight: 1.5,
              color: "#9aabbc",
              fontSize: "0.95rem",
            }}
          >
            Došlo k neočekávané chybě služby. Zkuste to prosím znovu. Pokud
            problém přetrvá, uveďte referenci níže.
          </p>
          {supportRef ? (
            <p
              style={{
                marginTop: "1rem",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.75rem",
                color: "#9aabbc",
                wordBreak: "break-all",
              }}
              data-testid="support-correlation-id"
            >
              Reference: {supportRef}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.65rem 1.25rem",
              borderRadius: "0.375rem",
              border: "none",
              background: "#3d8bfd",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Zkusit znovu
          </button>
        </main>
      </body>
    </html>
  );
}
