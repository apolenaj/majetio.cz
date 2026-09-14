import { describe, expect, it } from "vitest";

import {
  buildExternalPropertyReference,
  parseLeadSourceAttribution,
} from "@/domains/leads/service/attribution";
import {
  generateMortgageLeadCorrelationId,
  isMortgageLeadCorrelationId,
} from "@/domains/leads/service/correlation-id";
import {
  buildMortgageLeadIdempotencyKey,
  isActiveMortgageLeadStatus,
  isWithinDedupeWindow,
} from "@/domains/leads/service/idempotency";
import { buildPartnerPayload } from "@/domains/leads/service/mortgage-lead-service";
import {
  assertMortgageLeadTransition,
  mortgageLeadStatusLabel,
} from "@/domains/leads/service/workflow";

describe("Mortgage lead orchestration (Prompt 13/5)", () => {
  it("generates external-safe correlation ids", () => {
    const id = generateMortgageLeadCorrelationId();
    expect(id.startsWith("ml_")).toBe(true);
    expect(isMortgageLeadCorrelationId(id)).toBe(true);
    expect(isMortgageLeadCorrelationId("cuid_internal_123")).toBe(false);
  });

  it("parses lead source attribution channels", () => {
    expect(parseLeadSourceAttribution("kalkulacky/financovani").channel).toBe(
      "calculator",
    );
    expect(
      parseLeadSourceAttribution("nemovitosti/demo-byt/financovani").channel,
    ).toBe("property_detail");
    expect(
      parseLeadSourceAttribution("analyza/abc123/financovani").channel,
    ).toBe("analysis");
  });

  it("builds property references without full internal ids", () => {
    expect(
      buildExternalPropertyReference({
        propertySlug: "demo-byt-vinohrady",
      }),
    ).toBe("Nemovitost demo-byt-vinohrady");
    expect(
      buildExternalPropertyReference({
        propertyId: "clxxxxxxxxxxxxxxxx",
      }),
    ).toMatch(/^Nemovitost \(ref\./);
  });

  it("builds stable idempotency keys", () => {
    const key = buildMortgageLeadIdempotencyKey({
      userId: "user-1",
      propertyId: "prop-1",
    });
    expect(key).toBe("mortgage-lead:user-1:prop-1:_");
  });

  it("detects dedupe window", () => {
    const recent = new Date(Date.now() - 60 * 60 * 1000);
    expect(isWithinDedupeWindow(recent)).toBe(true);
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    expect(isWithinDedupeWindow(old)).toBe(false);
  });

  it("enforces strict workflow transitions", () => {
    expect(() =>
      assertMortgageLeadTransition("CREATED", "SUBMISSION_PENDING"),
    ).not.toThrow();
    expect(() =>
      assertMortgageLeadTransition("SUBMISSION_PENDING", "SUBMITTED"),
    ).not.toThrow();
    expect(() =>
      assertMortgageLeadTransition("CREATED", "APPROVED"),
    ).toThrow();
    expect(mortgageLeadStatusLabel("APPROVED")).toBe("Schváleno bankou");
  });

  it("maps partner payload strictly without internal lead ids", () => {
    const payload = buildPartnerPayload({
      correlationId: "ml_test_payload",
      email: "user@example.com",
      source: "nemovitosti/demo/financovani",
      consentVersion: "v1",
      sharedFields: ["email", "purchasePriceCzk", "propertyReference"],
      propertyReference: "Nemovitost demo",
      purchasePriceCzk: 5_000_000,
    });

    expect(payload.schemaVersion).toBeDefined();
    expect(payload.correlationId).toBe("ml_test_payload");
    expect(payload.purchasePriceCzk).toBe(5_000_000);
    expect(payload.attribution.channel).toBe("property_detail");
    expect(payload).not.toHaveProperty("leadId");
    expect(payload).not.toHaveProperty("propertyId");
  });

  it("treats post-submit statuses as active for dedupe", () => {
    expect(isActiveMortgageLeadStatus("QUALIFICATION_IN_PROGRESS")).toBe(true);
    expect(isActiveMortgageLeadStatus("CLOSED")).toBe(false);
  });
});
