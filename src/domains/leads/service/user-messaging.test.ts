import { describe, expect, it } from "vitest";

import { buildMortgageLeadSubmitConfirmation } from "@/domains/leads/service/user-messaging";
import {
  buildMortgageLeadTimeline,
  mortgageLeadNextStep,
} from "@/domains/leads/service/timeline";

describe("mortgage lead user messaging", () => {
  it("shows pending message before partner receipt", () => {
    const msg = buildMortgageLeadSubmitConfirmation({
      pending: true,
      workflowStatus: "SUBMITTED",
    });
    expect(msg.body).toContain("předáváme jej ke zpracování");
    expect(msg.body).not.toContain("schválen");
  });

  it("shows handed-off message after partner receipt", () => {
    const msg = buildMortgageLeadSubmitConfirmation({
      pending: false,
      workflowStatus: "RECEIVED",
    });
    expect(msg.body).toContain("Požadavek na posouzení financování byl předán");
  });
});

describe("mortgage lead timeline", () => {
  it("marks received as current after partner receipt", () => {
    const steps = buildMortgageLeadTimeline("RECEIVED");
    expect(steps.find((s) => s.id === "submitted")?.state).toBe("completed");
    expect(steps.find((s) => s.id === "received")?.state).toBe("current");
  });

  it("never promises approval in next step for early states", () => {
    const next = mortgageLeadNextStep("SUBMITTED");
    expect(next.toLowerCase()).not.toContain("schválen");
  });
});
