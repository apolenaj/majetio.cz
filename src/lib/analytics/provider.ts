/**
 * Analytics provider adapter (checklist 157).
 * Call sites use track(); swap provider without rewriting events.
 */

import type { AnalyticsContext } from "@/lib/analytics/context";
import type { AnalyticsEvent } from "@/lib/analytics/events";

export type AnalyticsPayload = AnalyticsEvent & {
  context: AnalyticsContext;
};

export type AnalyticsProvider = {
  name: string;
  send: (payload: AnalyticsPayload) => void | Promise<void>;
};

const consoleProvider: AnalyticsProvider = {
  name: "console",
  send(payload) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[analytics]", payload.name, payload.props, payload.context);
    }
  },
};

const noopProvider: AnalyticsProvider = {
  name: "noop",
  send() {
    /* production default until a warehouse/vendor is wired */
  },
};

let override: AnalyticsProvider | null = null;

export function setAnalyticsProvider(provider: AnalyticsProvider | null): void {
  override = provider;
}

export function getAnalyticsProvider(): AnalyticsProvider {
  if (override) return override;
  if (process.env.ANALYTICS_PROVIDER === "console") return consoleProvider;
  if (process.env.NODE_ENV === "development") return consoleProvider;
  return noopProvider;
}
