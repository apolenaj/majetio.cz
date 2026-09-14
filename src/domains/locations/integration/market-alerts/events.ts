/**
 * Market Alerts — event types and webhook payload contract.
 */

import type {
  MarketAlertEventPayload,
  MarketAlertEventType,
  MarketAlertSubscription,
} from "@/domains/locations/integration/types";
import { assertSafeOutboundUrl, safeFetch } from "@/lib/security";

export const MARKET_ALERT_EVENT_LABELS: Record<MarketAlertEventType, string> = {
  "location.price_trend.changed": "Změna cenového trendu lokality",
  "location.supply.spike": "Nárůst nabídky (supply spike)",
  "location.yield.threshold.crossed": "Překročení prahu výnosu",
  "location.dom.threshold.crossed": "Změna mediánu days on market",
};

export type MarketAlertDispatchResult = {
  eventId: string;
  delivered: boolean;
  webhookStatus?: number;
  error?: string;
};

export type MarketAlertPublisher = {
  publish(event: MarketAlertEventPayload): Promise<MarketAlertDispatchResult>;
  publishBatch(events: MarketAlertEventPayload[]): Promise<MarketAlertDispatchResult[]>;
};

export function createInMemoryMarketAlertPublisher(
  hooks?: {
    onEvent?: (event: MarketAlertEventPayload) => void;
    webhookFetch?: (url: string, body: string) => Promise<Response>;
  },
): MarketAlertPublisher {
  return {
    async publish(event) {
      hooks?.onEvent?.(event);
      return { eventId: event.eventId, delivered: true };
    },
    async publishBatch(events) {
      return Promise.all(events.map((e) => this.publish(e)));
    },
  };
}

export function matchesSubscription(
  event: MarketAlertEventPayload,
  sub: MarketAlertSubscription,
): boolean {
  if (!sub.active) return false;
  if (!sub.eventTypes.includes(event.type)) return false;
  if (sub.locationIds?.length && !sub.locationIds.includes(event.locationId)) {
    return false;
  }
  if (sub.segmentKey && sub.segmentKey !== event.segmentKey) return false;
  return true;
}

export async function dispatchToWebhook(
  event: MarketAlertEventPayload,
  subscription: MarketAlertSubscription,
  fetchFn: (url: string, init: RequestInit) => Promise<Response> = (url, init) =>
    safeFetch(url, { ...init, timeoutMs: 8_000 }),
): Promise<MarketAlertDispatchResult> {
  if (!subscription.webhookUrl) {
    return { eventId: event.eventId, delivered: false, error: "No webhook URL" };
  }

  const urlCheck = assertSafeOutboundUrl(subscription.webhookUrl);
  if (!urlCheck.ok) {
    return {
      eventId: event.eventId,
      delivered: false,
      error: `SSRF_BLOCKED:${urlCheck.reason}`,
    };
  }

  try {
    const res = await fetchFn(urlCheck.url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Majetio-Event": event.type,
        "X-Majetio-Event-Id": event.eventId,
      },
      body: JSON.stringify(event),
    });
    return {
      eventId: event.eventId,
      delivered: res.ok,
      webhookStatus: res.status,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      eventId: event.eventId,
      delivered: false,
      error: err instanceof Error ? err.message : "Webhook failed",
    };
  }
}

export function buildPriceTrendChangedEvent(input: {
  locationId: string;
  locationSlug: string;
  metricKey: string;
  segmentKey: string;
  previousValue: number;
  currentValue: number;
  period: string;
  sampleCount: number;
  confidence: number;
}): MarketAlertEventPayload {
  const changePct =
    input.previousValue !== 0
      ? ((input.currentValue - input.previousValue) / Math.abs(input.previousValue)) * 100
      : null;

  return {
    eventId: `evt_${input.locationSlug}_${Date.now()}`,
    type: "location.price_trend.changed",
    occurredAt: new Date().toISOString(),
    locationId: input.locationId,
    locationSlug: input.locationSlug,
    metricKey: input.metricKey,
    segmentKey: input.segmentKey,
    previousValue: input.previousValue,
    currentValue: input.currentValue,
    changePct,
    period: input.period,
    sampleCount: input.sampleCount,
    confidence: input.confidence,
    methodologyVersion: "location-metrics.v2026.07",
    source: "internal:location-engine",
  };
}

export function buildSupplySpikeEvent(input: {
  locationId: string;
  locationSlug: string;
  segmentKey: string;
  previousListings: number;
  currentListings: number;
  period: string;
}): MarketAlertEventPayload {
  const changePct =
    input.previousListings > 0
      ? ((input.currentListings - input.previousListings) / input.previousListings) * 100
      : null;

  return {
    eventId: `evt_supply_${input.locationSlug}_${Date.now()}`,
    type: "location.supply.spike",
    occurredAt: new Date().toISOString(),
    locationId: input.locationId,
    locationSlug: input.locationSlug,
    metricKey: "property_market.active_listings_count",
    segmentKey: input.segmentKey,
    previousValue: input.previousListings,
    currentValue: input.currentListings,
    changePct,
    period: input.period,
    sampleCount: input.currentListings,
    confidence: 0.8,
    methodologyVersion: "location-metrics.v2026.07",
    source: "internal:location-engine",
  };
}
