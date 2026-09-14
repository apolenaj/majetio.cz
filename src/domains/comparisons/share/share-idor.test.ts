import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * IDOR / privacy contracts for comparison sharing (BOD 131, 182).
 */
describe("Comparison share IDOR & privacy contracts", () => {
  const service = readFileSync(
    join(process.cwd(), "src/domains/comparisons/share/share-service.ts"),
    "utf8",
  );
  const actions = readFileSync(
    join(process.cwd(), "src/domains/comparisons/share/actions.ts"),
    "utf8",
  );
  const schema = readFileSync(
    join(process.cwd(), "prisma/schema.prisma"),
    "utf8",
  );

  it("actions resolve user from session, never body userId as owner override", () => {
    expect(actions).toMatch(/auth\(\)|requireUserId\(/);
    expect(actions).not.toMatch(/z\.object\(\{[^}]*userId:\s*z\.string/);
  });

  it("create share asserts comparison ownership by userId", () => {
    expect(service).toMatch(/assertOwnsComparison/);
    expect(service).toMatch(/where: \{ id: comparisonId, userId \}/);
  });

  it("stores token hash, not raw token in DB create", () => {
    expect(service).toMatch(/tokenHash: token\?\.hash/);
    expect(schema).toMatch(/tokenHash\s+String\?\s+@unique/);
  });

  it("secret link requires expiry and share-safe payload", () => {
    expect(service).toMatch(/expiresAt/);
    expect(service).toMatch(/assertShareSafePayload/);
    expect(service).toMatch(/SECRET_LINK/);
  });

  it("share create/revoke are rate-limited; list is owner-scoped", () => {
    expect(actions).toMatch(/assertWorkspaceMutationAllowed/);
    expect(actions).toMatch(/listComparisonShares/);
  });

  it("invited mode requires invitees and scopes by invite row", () => {
    expect(service).toMatch(/INVITED_USERS/);
    expect(service).toMatch(/invites: \{ some: \{ userId/);
  });
});
