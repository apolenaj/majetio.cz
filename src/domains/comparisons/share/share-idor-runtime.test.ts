import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * IDOR contracts for /porovnani/[id], favourites mutations, comparison share.
 * Session userId scopes every privileged read/write — never body userId.
 */
describe("Comparison /porovnani/[id] IDOR", () => {
  const actions = readFileSync(
    join(process.cwd(), "src/domains/comparisons/server/actions.ts"),
    "utf8",
  );
  const page = readFileSync(
    join(process.cwd(), "src/app/(discovery)/porovnani/[id]/page.tsx"),
    "utf8",
  );

  it("page requires auth redirect and loads by id", () => {
    expect(page).toMatch(/redirect|buildLoginUrl|auth\(/);
    expect(page).toMatch(/params/);
  });

  it("getComparisonViewModelAction scopes comparison by session userId", () => {
    expect(actions).toMatch(/requireUserId|auth\(/);
    expect(actions).toMatch(
      /where: \{ id: input\.comparisonId, userId \}/,
    );
    expect(actions).not.toMatch(/z\.object\(\{[^}]*userId:\s*z\.string/);
  });

  it("deleteComparisonAction uses deleteMany with userId ownership", () => {
    expect(actions).toMatch(
      /deleteMany\(\{[\s\S]*where: \{ id: input\.comparisonId, userId \}/,
    );
  });

  it("create/delete mutations are rate-limited", () => {
    expect(actions).toMatch(/assertWorkspaceMutationAllowed/);
    expect(actions).toMatch(/"comparison"/);
  });
});

describe("Favourites /ucet/oblibene mutation IDOR + rate limit", () => {
  const actions = readFileSync(
    join(process.cwd(), "src/domains/favourites/server/actions.ts"),
    "utf8",
  );

  it("mutations resolve user from session only", () => {
    expect(actions).toMatch(/requireUserId|auth\(/);
    expect(actions).not.toMatch(/z\.object\(\{[^}]*userId:\s*z\.string/);
  });

  it("save / remove / note / status are rate-limited", () => {
    expect(actions).toMatch(/assertFavouriteMutationAllowed\(userId, "save"\)/);
    expect(actions).toMatch(/assertFavouriteMutationAllowed\(userId, "remove"\)/);
    expect(actions).toMatch(/assertFavouriteMutationAllowed\(userId, "note"\)/);
    expect(actions).toMatch(/assertFavouriteMutationAllowed\(userId, "status"\)/);
  });
});

describe("Notes mutations rate limit + owner scope", () => {
  const actions = readFileSync(
    join(process.cwd(), "src/domains/decision-workspace/server/actions.ts"),
    "utf8",
  );
  const notes = readFileSync(
    join(process.cwd(), "src/domains/decision-workspace/notes/note-service.ts"),
    "utf8",
  );

  it("note actions use session userId and rate limit", () => {
    expect(actions).toMatch(/assertWorkspaceMutationAllowed\(userId, "note"/);
    expect(actions).toMatch(/upsertNoteForUser\(\{[\s\S]*userId/);
  });

  it("note service scopes by userId", () => {
    expect(notes).toMatch(/userId: input\.userId/);
  });
});

describe("Account deletion retention cascade", () => {
  it("User delete cascades favourites, comparisons, notes, shares", () => {
    const schema = readFileSync(
      join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    // Favourites / comparisons / notes owned by user cascade on account delete
    expect(schema).toMatch(/model Favourite \{[\s\S]*onDelete: Cascade/);
    expect(schema).toMatch(/model Comparison \{[\s\S]*onDelete: Cascade/);
    expect(schema).toMatch(/model PropertyUserNote \{[\s\S]*onDelete: Cascade/);
    expect(schema).toMatch(/model ComparisonShare \{[\s\S]*createdBy[\s\S]*onDelete: Cascade/);
  });

  it("deleteAccount hard-deletes user after password confirm", () => {
    const settings = readFileSync(
      join(process.cwd(), "src/lib/account/settings-actions.ts"),
      "utf8",
    );
    expect(settings).toMatch(/prisma\.user\.delete/);
    expect(settings).toMatch(/confirmEmail/);
    expect(settings).toMatch(/account\.delete/);
  });
});
