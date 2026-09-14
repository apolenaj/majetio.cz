/**
 * Favourite status / relist alerts.
 * Do NOT alert on freshness STALE alone (source outage ≠ lifecycle change).
 */

import type { PropertyStatus } from "@prisma/client";

import { propertyAlertConfig } from "@/config/property-alerts";
import { prisma } from "@/lib/db";
import { buildRelistedCopy, buildStatusChangeCopy } from "./alert-copy";
import { relistedAlertDedupeKey, statusAlertDedupeKey } from "./alert-dedupe";
import { deliverPropertyAlert } from "./deliver-alert";

export type StatusChangeInput = {
  propertyId: string;
  previousStatus: PropertyStatus | string | null;
  newStatus: PropertyStatus | string;
  changedAt?: Date;
  /** If true, change came only from freshness/source silence — never alert. */
  freshnessOnly?: boolean;
};

export function classifyStatusAlert(
  input: StatusChangeInput,
): "STATUS_CHANGED" | "RELISTED" | null {
  if (input.freshnessOnly) return null;
  if (input.previousStatus === input.newStatus) return null;

  const noteworthy = propertyAlertConfig.status.noteworthy as readonly string[];
  const relistFrom = propertyAlertConfig.status.relistFrom as readonly string[];

  if (
    input.newStatus === "ACTIVE" &&
    input.previousStatus &&
    relistFrom.includes(String(input.previousStatus))
  ) {
    return "RELISTED";
  }

  if (noteworthy.includes(String(input.newStatus))) {
    // UNAVAILABLE from freshness pipeline without explicit status history → blocked via freshnessOnly
    return "STATUS_CHANGED";
  }

  return null;
}

export async function processFavouriteStatusChange(
  input: StatusChangeInput,
): Promise<{ notified: number; skipped: string }> {
  const kind = classifyStatusAlert(input);
  if (!kind) {
    return {
      notified: 0,
      skipped: input.freshnessOnly ? "freshness_only" : "not_noteworthy",
    };
  }

  const changedAt = input.changedAt ?? new Date();
  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: { id: true, slug: true, title: true },
  });
  if (!property) return { notified: 0, skipped: "property_missing" };

  const favourites = await prisma.favourite.findMany({
    where: {
      propertyId: input.propertyId,
      status: { not: "REJECTED" },
    },
    select: { userId: true },
  });
  if (favourites.length === 0) return { notified: 0, skipped: "no_favourites" };

  const copy =
    kind === "RELISTED"
      ? buildRelistedCopy({ propertyTitle: property.title })
      : buildStatusChangeCopy({
          propertyTitle: property.title,
          newStatus: String(input.newStatus),
          previousStatus: input.previousStatus
            ? String(input.previousStatus)
            : null,
        });

  const dedupeBase =
    kind === "RELISTED"
      ? relistedAlertDedupeKey({
          propertyId: property.id,
          changedAt,
        })
      : statusAlertDedupeKey({
          propertyId: property.id,
          newStatus: String(input.newStatus),
          changedAt,
        });

  let notified = 0;
  for (const fav of favourites) {
    const result = await deliverPropertyAlert({
      userId: fav.userId,
      propertyId: property.id,
      type: kind,
      title: copy.title,
      body: copy.body,
      href: `/nemovitosti/${property.slug}`,
      dedupeKey: dedupeBase,
      preferEmail: true,
      meta: {
        previousStatus: input.previousStatus,
        newStatus: input.newStatus,
      },
    });
    if (result.ok && (result.status === "SENT" || result.status === "PENDING")) {
      notified += 1;
    }
  }

  return { notified, skipped: notified === 0 ? "all_deduped_or_suppressed" : "" };
}
