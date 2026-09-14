import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * IDOR contracts for Favourites / Shortlist (BOD 130, 132).
 * User A must never mutate User B's favourites via client-supplied userId.
 */
describe("Favourites IDOR hardening", () => {
  const roots = [
    "src/domains/favourites/server/actions.ts",
    "src/domains/favourites/service/favourite-service.ts",
  ];

  it("server actions resolve user from session, not request body userId", () => {
    const actions = readFileSync(
      join(process.cwd(), "src/domains/favourites/server/actions.ts"),
      "utf8",
    );
    expect(actions).toMatch(/auth\(\)|requireUserId\(/);
    expect(actions).not.toMatch(/z\.object\(\{[^}]*userId:\s*z\.string/);
    expect(actions).not.toMatch(/params\.userId|searchParams\.userId|body\.userId/);
  });

  it("service mutations always scope by userId + favouriteId ownership", () => {
    const service = readFileSync(
      join(process.cwd(), roots[1]!),
      "utf8",
    );
    expect(service).toMatch(/userId: input\.userId/);
    expect(service).toMatch(/findFirst\(\{[\s\S]*userId: input\.userId/);
    // Updates after ownership check
    expect(service).toMatch(/where: \{ id: row\.id \}/);
  });

  it("getFavouriteOwnedByUser requires both favouriteId and userId", () => {
    const service = readFileSync(
      join(process.cwd(), roots[1]!),
      "utf8",
    );
    expect(service).toMatch(/getFavouriteOwnedByUser/);
    expect(service).toMatch(
      /where: \{ id: input\.favouriteId, userId: input\.userId \}/,
    );
  });

  it("account delete cascades favourites (retention BOD 129)", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(schema).toMatch(
      /user\s+User\s+@relation\(fields: \[userId\], references: \[id\], onDelete: Cascade\)/,
    );
    // Property hard-delete must not silently wipe private favourites
    expect(schema).toMatch(/onDelete: Restrict/);
  });
});
