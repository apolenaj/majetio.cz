/**
 * CRM pipeline — routing, status transitions, XSS notes, RBAC shapes.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  LEAD_STATUS_TRANSITIONS,
  canTransitionLeadStatus,
  resolveCrmLeadRouting,
  sanitizeCrmPlainText,
  escapeHtmlForDisplay,
} from "@/domains/crm";

describe("lead status pipeline", () => {
  it("allows NEW → CONTACTED → QUALIFIED → WON", () => {
    expect(canTransitionLeadStatus("NEW", "CONTACTED")).toBe(true);
    expect(canTransitionLeadStatus("CONTACTED", "QUALIFIED")).toBe(true);
    expect(canTransitionLeadStatus("QUALIFIED", "WON")).toBe(true);
    expect(canTransitionLeadStatus("WON", "NEW")).toBe(false);
    expect(LEAD_STATUS_TRANSITIONS.LOST).toEqual([]);
  });

  it("includes IN_PROGRESS and HANDED_OFF paths", () => {
    expect(canTransitionLeadStatus("NEW", "IN_PROGRESS")).toBe(true);
    expect(canTransitionLeadStatus("IN_PROGRESS", "HANDED_OFF")).toBe(true);
  });
});

describe("lead routing", () => {
  it("routes financing to HypotekaJasne mortgage partner", () => {
    const d = resolveCrmLeadRouting({ leadType: "FINANCING", marketCountry: "CZ" });
    expect(d.target).toBe("MORTGAGE_PARTNER");
    expect(d.partner).toBe("hypotekajasne");
    expect(d.integrationRef).toMatch(/HypotekaJasne/);
    expect(d.routingRuleKey).toMatch(/hypotekajasne/);
  });

  it("routes property inquiry to listing agent", () => {
    const d = resolveCrmLeadRouting({
      leadType: "PROPERTY_INQUIRY",
      listingAgentUserId: "agent_1",
      organizationId: "org_1",
    });
    expect(d.target).toBe("LISTING_AGENT");
    expect(d.assignToUserId).toBe("agent_1");
    expect(d.organizationId).toBe("org_1");
  });

  it("routes audits to internal analysts", () => {
    const d = resolveCrmLeadRouting({
      leadType: "PROPERTY_AUDIT",
      analystUserId: "analyst_1",
    });
    expect(d.target).toBe("INTERNAL_ANALYST");
    expect(d.assignToUserId).toBe("analyst_1");
  });
});

describe("XSS-safe notes", () => {
  it("strips script tags; HTML escape is for display layer", () => {
    const raw = `<script>alert("x")</script><b onclick="evil()">Hello & welcome</b>`;
    const safe = sanitizeCrmPlainText(raw);
    expect(safe).not.toMatch(/<script/i);
    expect(safe).not.toMatch(/onclick/i);
    expect(safe).toMatch(/Hello/);
    expect(safe).toContain("Hello & welcome");
    expect(escapeHtmlForDisplay(safe)).toContain("&amp;");
    expect(sanitizeCrmPlainText(`<img src=x onerror=alert(1)>`)).not.toMatch(
      /onerror|img/i,
    );
  });
});

describe("schema entities", () => {
  it("defines LeadAssignment and pipeline fields", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).toMatch(/model LeadAssignment/);
    expect(schema).toMatch(/model LeadActivity/);
    expect(schema).toMatch(/nextActionType/);
    expect(schema).toMatch(/LeadRoutingTarget/);
    expect(schema).toMatch(/INTERNAL_ANALYST/);
    expect(schema).toMatch(/LeadActivityVisibility/);
    expect(schema).toMatch(/PROPERTY_INQUIRY/);
    expect(schema).toMatch(/IN_PROGRESS/);
  });
});
