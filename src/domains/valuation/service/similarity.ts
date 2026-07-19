/**
 * Similarity score for valuation comps (Prompt 10 Part 2).
 * Explainable weighted blend of area, layout, condition.
 */

import type { ComparableCandidate, ValuationSubject } from "./types";

const CONDITION_RANK: Record<string, number> = {
  NEW: 6,
  EXCELLENT: 5,
  GOOD: 4,
  AVERAGE: 3,
  NEEDS_RENOVATION: 2,
  SHELL: 1,
  UNKNOWN: 3,
};

function fold(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

/** Normalize Czech dispositions like 3+kk / 3kk / 3+1 loosely. */
export function normalizeLayout(layout: string | null | undefined): string {
  const f = fold(layout);
  if (!f) return "";
  const m = f.match(/(\d+)\s*\+?\s*(kk|1)?/);
  if (!m) return f;
  const rooms = m[1]!;
  const suffix = m[2] === "1" ? "1" : m[2] === "kk" ? "kk" : "";
  return `${rooms}+${suffix || "kk"}`;
}

export function areaSimilarity(
  subjectArea: number | null,
  candidateArea: number | null,
): number {
  if (
    subjectArea == null ||
    candidateArea == null ||
    subjectArea <= 0 ||
    candidateArea <= 0
  ) {
    return 0.4; // unknown — neutral-low, not zero (avoid killing weight)
  }
  const ratio =
    Math.min(subjectArea, candidateArea) / Math.max(subjectArea, candidateArea);
  // Soften: map ratio 0.7→~0.55, 0.9→~0.85, 1→1
  return Math.max(0, Math.min(1, ratio ** 1.2));
}

export function layoutSimilarity(
  subjectLayout: string | null,
  candidateLayout: string | null,
): number {
  const a = normalizeLayout(subjectLayout);
  const b = normalizeLayout(candidateLayout);
  if (!a || !b) return 0.5;
  if (a === b) return 1;
  const ra = Number.parseInt(a, 10);
  const rb = Number.parseInt(b, 10);
  if (Number.isFinite(ra) && Number.isFinite(rb)) {
    const diff = Math.abs(ra - rb);
    if (diff === 0) return 0.85; // same rooms, different suffix
    if (diff === 1) return 0.55;
    if (diff === 2) return 0.3;
    return 0.1;
  }
  return 0.25;
}

export function conditionSimilarity(
  subjectCondition: string | null,
  candidateCondition: string | null,
): number {
  const a = CONDITION_RANK[(subjectCondition ?? "UNKNOWN").toUpperCase()] ?? 3;
  const b = CONDITION_RANK[(candidateCondition ?? "UNKNOWN").toUpperCase()] ?? 3;
  const diff = Math.abs(a - b);
  if (diff === 0) return 1;
  if (diff === 1) return 0.75;
  if (diff === 2) return 0.5;
  if (diff === 3) return 0.3;
  return 0.15;
}

/**
 * Similarity in [0, 1]: area 45 %, layout 35 %, condition 20 %.
 */
export function computeSimilarityScore(
  subject: ValuationSubject,
  candidate: ComparableCandidate,
): number {
  const area = areaSimilarity(subject.usableArea, candidate.usableArea);
  const layout = layoutSimilarity(subject.layout, candidate.layout);
  const condition = conditionSimilarity(subject.condition, candidate.condition);
  const score = 0.45 * area + 0.35 * layout + 0.2 * condition;
  return Math.round(score * 1000) / 1000;
}
