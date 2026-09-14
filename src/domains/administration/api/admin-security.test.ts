import {
  assertActorIsSessionUser,
  AdminApiError,
  rejectUniversalDbEditor,
} from "@/domains/administration/api/admin-api-guards";
import {
  createNoteBodySchema,
  toAdminUserCardDto,
  adminSearchQuerySchema,
} from "@/domains/administration/api/admin-dtos";
import {
  maskEmail,
  maskPhone,
  maskIban,
  omitSensitiveKeys,
} from "@/domains/administration/security/masking";
import { roleHasPermission } from "@/domains/administration/rbac/roles";
import { z } from "zod";
import { describe, expect, it } from "vitest";

describe("PII masking (190–192)", () => {
  it("masks email and phone", () => {
    expect(maskEmail("jan.novak@example.com")).toBe("ja***@example.com");
    expect(maskPhone("+420777123456")).toMatch(/^\+420\*\*\*\d{2}$/);
    expect(maskIban("CZ6508000000192000145399")).toMatch(/^CZ65\*{4}\d{4}$/);
  });

  it("omits secret keys from objects", () => {
    const cleaned = omitSensitiveKeys({
      id: "1",
      passwordHash: "x",
      email: "a@b.cz",
    });
    expect(cleaned.passwordHash).toBeUndefined();
    expect(cleaned.email).toBe("a@b.cz");
  });

  it("admin user card never exposes raw email", () => {
    const dto = toAdminUserCardDto({
      id: "u1",
      email: "secret@majetio.cz",
      name: "Ada",
      role: "USER",
      phone: "+420777000111",
    });
    expect(dto.emailMasked).not.toContain("secret@");
    expect(dto.phoneMasked).not.toContain("777000111");
  });
});

describe("Admin DTO validation / IDOR", () => {
  it("rejects client-supplied authorUserId on notes", () => {
    const parsed = createNoteBodySchema.safeParse({
      entityKind: "USER",
      entityId: "u1",
      body: "note",
      authorUserId: "attacker",
    });
    expect(parsed.success).toBe(false);
  });

  it("blocks mismatched actor userId (IDOR)", () => {
    expect(() => assertActorIsSessionUser("real", "other")).toThrow(
      AdminApiError,
    );
  });

  it("bans universal DB editor", () => {
    expect(() => rejectUniversalDbEditor()).toThrow(/DB editor/i);
  });

  it("parses search query", () => {
    const q = adminSearchQuerySchema.parse({
      q: "praha",
      types: "PROPERTY,USER",
      limit: "5",
    });
    expect(q.q).toBe("praha");
    expect(q.limit).toBe(5);
    expect(q.types).toEqual(["PROPERTY", "USER"]);
  });
});

describe("Search permission keys", () => {
  it("PROPERTY_REVIEWER can search but not read users", () => {
    expect(roleHasPermission("PROPERTY_REVIEWER", "ops.search.read")).toBe(
      true,
    );
    expect(roleHasPermission("PROPERTY_REVIEWER", "users.read")).toBe(false);
    expect(roleHasPermission("PROPERTY_REVIEWER", "property.read")).toBe(true);
  });

  it("SALES can search users/leads/orgs", () => {
    expect(roleHasPermission("SALES", "ops.search.read")).toBe(true);
    expect(roleHasPermission("SALES", "users.read")).toBe(true);
    expect(roleHasPermission("SALES", "leads.read")).toBe(true);
  });
});

describe("withAdminMutation schema contract", () => {
  it("zod schema example for mutation body", () => {
    const schema = z
      .object({
        entityId: z.string().min(1),
        assignedByUserId: z.undefined().optional(),
      })
      .strict();
    expect(
      schema.safeParse({ entityId: "x", assignedByUserId: "y" }).success,
    ).toBe(false);
    expect(schema.safeParse({ entityId: "x" }).success).toBe(true);
  });
});
