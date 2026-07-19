/**
 * Days-on-market helpers for property detail (Prompt 9 Part 4).
 */

export function daysBetweenIso(
  fromIso: string | null | undefined,
  to: Date = new Date(),
): number | null {
  if (!fromIso) return null;
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime())) return null;
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function resolveDaysOnMarket(input: {
  publishedAt: string | null | undefined;
  overrideDays: number | null | undefined;
}): number | null {
  if (input.overrideDays != null && Number.isFinite(input.overrideDays)) {
    return Math.max(0, Math.floor(input.overrideDays));
  }
  return daysBetweenIso(input.publishedAt);
}
