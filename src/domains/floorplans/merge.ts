/**
 * Merge AI / analysis proposals into drafts without clobbering manual work
 * or overwriting a newer published revision with a stale job.
 */

import {
  disclaimerForKind,
  emptyFloorPlanDocument,
  type FloorPlanDocument,
  type FloorPlanFloor,
} from "./types";

export type AnalysisProposal = {
  floors?: FloorPlanFloor[];
  photoGroups?: FloorPlanDocument["photoGroups"];
  issues?: FloorPlanDocument["issues"];
  outputKind?: FloorPlanDocument["outputKind"];
  scaleState?: FloorPlanDocument["scaleState"];
  /** Expected draft revision id / version when the job started. */
  expectedDraftVersion?: number | null;
  jobId?: string;
};

/**
 * Returns true when the document has seller-driven geometry that must be
 * preserved unless the user explicitly replaces it.
 */
export function documentHasManualEdits(doc: FloorPlanDocument): boolean {
  if (doc.hasManualEdits === true) return true;
  return doc.floors.some((f) =>
    f.rooms.some(
      (r) =>
        r.areaSource === "informant" ||
        (r.notes != null && r.notes.length > 0) ||
        r.openings.length > 0 ||
        (r.lengthM != null && r.lengthM > 0) ||
        (r.widthM != null && r.widthM > 0),
    ),
  );
}

/**
 * Apply a structured analysis proposal. Never treats raster images as truth.
 * If manual edits exist and `forceReplace` is false, keeps current floors and
 * only attaches proposed rooms as disconnected schemas in issues + photoGroups.
 */
export function mergeAnalysisProposal(
  current: FloorPlanDocument,
  proposal: AnalysisProposal,
  options?: { forceReplace?: boolean; currentDraftVersion?: number | null },
): { document: FloorPlanDocument; applied: boolean; reasonCs?: string } {
  if (
    proposal.expectedDraftVersion != null &&
    options?.currentDraftVersion != null &&
    proposal.expectedDraftVersion !== options.currentDraftVersion
  ) {
    return {
      document: current,
      applied: false,
      reasonCs:
        "Výsledek starší analýzy byl odmítnut — mezitím vznikla novější verze konceptu.",
    };
  }

  const hasManual = documentHasManualEdits(current);
  if (hasManual && !options?.forceReplace) {
    const proposedRoomCount =
      proposal.floors?.reduce((n, f) => n + f.rooms.length, 0) ?? 0;
    return {
      document: {
        ...current,
        photoGroups: proposal.photoGroups ?? current.photoGroups,
        hasManualEdits: true,
        issues: [
          ...current.issues,
          {
            code: "ai_pending_review",
            messageCs: `Analýza navrhla ${proposedRoomCount} místností, ale ruční úpravy jsou chráněny. Zkontrolujte návrh a případně nahraďte vědomě.`,
            severity: "warning" as const,
          },
          ...(proposal.issues ?? []),
        ],
        statusHint: "REVIEW_REQUIRED",
      },
      applied: false,
      reasonCs: "Ruční úpravy jsou chráněny — návrh nevypsal geometrii automaticky.",
    };
  }

  const floors = proposal.floors?.length
    ? proposal.floors
    : current.floors.length
      ? current.floors
      : emptyFloorPlanDocument().floors;

  const outputKind = proposal.outputKind ?? "ORIENTATIONAL";
  const scaleState = proposal.scaleState ?? "NONE";

  return {
    document: {
      ...current,
      floors,
      photoGroups: proposal.photoGroups ?? current.photoGroups,
      outputKind,
      scaleState,
      units: scaleState === "NONE" ? "unitless" : "m",
      issues: [
        ...(proposal.issues ?? []),
        {
          code: "ai_untrusted",
          messageCs:
            "Výstup AI je nedůvěryhodný vstup. Ověřte vazby místností a rozměry před zveřejněním.",
          severity: "warning",
        },
      ],
      disclaimerCs: disclaimerForKind(outputKind),
      hasManualEdits: false,
      statusHint: "REVIEW_REQUIRED",
    },
    applied: true,
  };
}

/** Mark document after seller edits in the editor. */
export function markManualEdit(doc: FloorPlanDocument): FloorPlanDocument {
  return { ...doc, hasManualEdits: true };
}
