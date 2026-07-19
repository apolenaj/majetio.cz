/**
 * Time decay for comparable prices (Prompt 10 Part 2).
 * Older observations get lower weight; never invent dates.
 */

const DEFAULT_HALF_LIFE_DAYS = 365;
const MIN_DECAY_WEIGHT = 0.15;

export function daysBetween(
  fromIso: string,
  to: Date = new Date(),
): number | null {
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime())) return null;
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Exponential decay: weight = 0.5^(ageDays / halfLifeDays), floored.
 */
export function timeDecayWeight(
  observedAt: string,
  options?: {
    asOf?: Date;
    halfLifeDays?: number;
    minWeight?: number;
  },
): number {
  const age = daysBetween(observedAt, options?.asOf ?? new Date());
  if (age == null) return MIN_DECAY_WEIGHT;
  const halfLife = options?.halfLifeDays ?? DEFAULT_HALF_LIFE_DAYS;
  const minW = options?.minWeight ?? MIN_DECAY_WEIGHT;
  if (halfLife <= 0) return 1;
  const w = Math.pow(0.5, age / halfLife);
  return Math.max(minW, Math.min(1, w));
}
