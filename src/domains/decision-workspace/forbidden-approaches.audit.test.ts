import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Forbidden-approach audit contracts (BOD 182).
 * Complements unit tests — guards against regressions in copy / privacy / spam.
 */
describe("Decision Workspace — forbidden approaches audit", () => {
  it("comparison advice never tells user to buy outright", () => {
    const advice = readFileSync(
      join(process.cwd(), "src/domains/comparisons/decision/advice.ts"),
      "utf8",
    );
    expect(advice).toMatch(/never decides|Nikdy|Kupte tuto/i);
    expect(advice).not.toMatch(/return\s+["']Kupte tuto/);
  });

  it("share-safe forbids notes, passport, rejection reasons", () => {
    const safe = readFileSync(
      join(process.cwd(), "src/domains/comparisons/share/share-safe.ts"),
      "utf8",
    );
    for (const key of [
      "privateNotes",
      "financialPassport",
      "rejectionReason",
      "income",
      "personalFinancing",
    ]) {
      expect(safe).toContain(key);
    }
  });

  it("analytics forbids note body props", () => {
    const events = readFileSync(
      join(process.cwd(), "src/lib/analytics/events.ts"),
      "utf8",
    );
    expect(events).toMatch(/"note"/);
    expect(events).toMatch(/"content"/);
    expect(events).toMatch(/assertAnalyticsSafe/);
  });

  it("corrected prices do not alert; digests suppress spam", () => {
    const config = readFileSync(
      join(process.cwd(), "src/config/property-alerts.ts"),
      "utf8",
    );
    expect(config).toMatch(/CORRECTED/);
    expect(config).toMatch(/maxPerUserPerDay/);
    const events = readFileSync(
      join(process.cwd(), "src/domains/notifications/events/property-events.ts"),
      "utf8",
    );
    expect(events).toMatch(/corrected_price/);
  });

  it("favourites list uses slim sort then hydrate (batched findMany)", () => {
    const service = readFileSync(
      join(process.cwd(), "src/domains/favourites/service/favourite-service.ts"),
      "utf8",
    );
    expect(service).toMatch(/slimRows/);
    expect(service).toMatch(/hydrated/);
    expect(service).toMatch(/findMany/);
  });

  it("comparison view model documents missing ≠ 0", () => {
    const vm = readFileSync(
      join(process.cwd(), "src/domains/comparisons/service/build-view-model.ts"),
      "utf8",
    );
    expect(vm).toMatch(/Není k dispozici|null|missing/i);
  });

  it("notes are owner-scoped services", () => {
    const notes = readFileSync(
      join(
        process.cwd(),
        "src/domains/decision-workspace/notes/note-service.ts",
      ),
      "utf8",
    );
    expect(notes).toMatch(/userId: input\.userId/);
  });
});
