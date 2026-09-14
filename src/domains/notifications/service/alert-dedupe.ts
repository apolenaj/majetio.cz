import type { PropertyAlertType } from "@prisma/client";

/** Stable dedupe keys — unique per user via PropertyAlert.dedupeKey. */
export function priceAlertDedupeKey(input: {
  propertyId: string;
  direction: "down" | "up";
  amountCzk: number;
  observedAt: Date;
}): string {
  const day = input.observedAt.toISOString().slice(0, 10);
  return `price:${input.propertyId}:${input.direction}:${input.amountCzk}:${day}`;
}

export function statusAlertDedupeKey(input: {
  propertyId: string;
  newStatus: string;
  changedAt: Date;
}): string {
  const day = input.changedAt.toISOString().slice(0, 10);
  return `status:${input.propertyId}:${input.newStatus}:${day}`;
}

export function relistedAlertDedupeKey(input: {
  propertyId: string;
  changedAt: Date;
}): string {
  const day = input.changedAt.toISOString().slice(0, 10);
  return `relisted:${input.propertyId}:${day}`;
}

export function savedSearchMatchDedupeKey(input: {
  savedSearchId: string;
  propertyId: string;
  day: string;
}): string {
  return `ssm:${input.savedSearchId}:${input.propertyId}:${input.day}`;
}

export function savedSearchBatchKey(input: {
  savedSearchId: string;
  day: string;
}): string {
  return `ssm-batch:${input.savedSearchId}:${input.day}`;
}

export function analysisAlertDedupeKey(input: {
  propertyId: string;
  analysisId: string;
}): string {
  return `analysis:${input.propertyId}:${input.analysisId}`;
}

export function financingAlertDedupeKey(input: {
  propertyId: string;
  eventToken: string;
}): string {
  return `financing:${input.propertyId}:${input.eventToken}`;
}

export function isTransactionalAlertType(type: PropertyAlertType): boolean {
  return type !== "LOCATION_WATCH_CREATED"; // location watch confirmations still transactional-ish
}
