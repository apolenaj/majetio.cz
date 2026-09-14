import type { MortgageDataTier, MortgageFreshness } from "../schemas";

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function formatCsDate(d: Date): string {
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

export function resolveMortgageFreshness(input: {
  dataTier: MortgageDataTier;
  retrievedAt: Date;
  verifiedAt: Date | null;
  now?: Date;
  staleAfterHours?: number;
}): MortgageFreshness {
  const now = input.now ?? new Date();
  const staleAfterMs = (input.staleAfterHours ?? 48) * 60 * 60 * 1000;
  const ageMs = now.getTime() - input.retrievedAt.getTime();
  const isStale = ageMs > staleAfterMs;

  let label: string;
  if (input.dataTier === "live" && isSameDay(input.retrievedAt, now)) {
    label = "Aktualizováno dnes";
  } else if (
    input.verifiedAt &&
    isSameDay(input.verifiedAt, now)
  ) {
    label = "Ověřeno dnes";
  } else if (input.verifiedAt) {
    label = `Poslední ověřená sazba (${formatCsDate(input.verifiedAt)})`;
  } else if (isSameDay(input.retrievedAt, now)) {
    label = "Aktualizováno dnes";
  } else {
    label = `Poslední známá sazba (${formatCsDate(input.retrievedAt)})`;
  }

  return {
    dataTier: input.dataTier,
    retrievedAt: input.retrievedAt,
    verifiedAt: input.verifiedAt,
    label,
    isStale,
  };
}

export function dataTierForFetch(input: {
  isLive: boolean;
  sourceStatus: "ok" | "degraded" | "unavailable";
}): MortgageDataTier {
  if (input.isLive && input.sourceStatus === "ok") {
    return "live";
  }
  if (input.sourceStatus === "degraded") {
    return "cached";
  }
  return "cached";
}
