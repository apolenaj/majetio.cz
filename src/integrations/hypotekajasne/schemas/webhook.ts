import { z } from "zod";

import { HYPOTEKAJASNE_WEBHOOK_SCHEMA_VERSION } from "../version";

export const HYPOTEKA_WEBHOOK_EVENT_TYPES = [
  "lead.received",
  "lead.status_changed",
  "lead.completed",
] as const;

export type HypotekaWebhookEventType =
  (typeof HYPOTEKA_WEBHOOK_EVENT_TYPES)[number];

export const hypotekajasneWebhookPayloadSchema = z.object({
  eventId: z.string().min(8).max(128),
  eventType: z.enum(HYPOTEKA_WEBHOOK_EVENT_TYPES),
  timestamp: z.string().datetime(),
  schemaVersion: z.string().max(64),
  data: z.object({
    correlationId: z.string().min(8).max(64),
    externalLeadId: z.string().max(128).optional(),
    status: z.string().max(64).optional(),
    previousStatus: z.string().max(64).optional(),
    message: z.string().max(500).optional(),
  }),
});

export type HypotekaJasneWebhookPayload = z.infer<
  typeof hypotekajasneWebhookPayloadSchema
>;

export function isSupportedWebhookSchemaVersion(version: string): boolean {
  return version === HYPOTEKAJASNE_WEBHOOK_SCHEMA_VERSION;
}
