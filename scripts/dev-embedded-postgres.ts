/**
 * Start an isolated embedded PostgreSQL for local verification.
 * Mirrors CI credentials (synthetic). Does not touch production.
 *
 * Usage:
 *   npx tsx scripts/dev-embedded-postgres.ts
 *   npx tsx scripts/dev-embedded-postgres.ts --migrate
 *   npx tsx scripts/dev-embedded-postgres.ts --migrate --seed
 *
 * Keep the process running while you use `npm run dev` / vitest against localhost:5432.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

import EmbeddedPostgres from "embedded-postgres";

const DATA_DIR = path.join(process.cwd(), ".data", "embedded-pg");
const PORT = Number(process.env.EMBEDDED_PG_PORT || 5432);
const USER = process.env.EMBEDDED_PG_USER || "majetio";
const PASSWORD = process.env.EMBEDDED_PG_PASSWORD || "majetio";
const DATABASE = process.env.EMBEDDED_PG_DATABASE || "majetio";

const wantMigrate = process.argv.includes("--migrate");
const wantSeed = process.argv.includes("--seed");

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
    // Windows default locale is often WIN1252 — migrations contain UTF-8 Czech text.
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
  });

  console.log(`[embedded-pg] initialise ${DATA_DIR} on :${PORT}`);
  try {
    await pg.initialise();
  } catch (err) {
    // Cluster may already exist from a previous run
    console.log(
      `[embedded-pg] initialise skipped/partial: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  console.log("[embedded-pg] starting…");
  await pg.start();
  console.log("[embedded-pg] started");

  try {
    await pg.createDatabase(DATABASE);
    console.log(`[embedded-pg] database ${DATABASE} ready`);
  } catch {
    console.log(`[embedded-pg] database ${DATABASE} already exists`);
  }

  const url = `postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DATABASE}?schema=public`;
  process.env.DATABASE_URL = url;
  console.log(
    `[embedded-pg] DATABASE_URL set for child processes (host=127.0.0.1:${PORT}/${DATABASE})`,
  );

  if (wantMigrate) {
    console.log("[embedded-pg] prisma migrate deploy…");
    const migrate = spawnSync("npx", ["prisma", "migrate", "deploy"], {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: url },
      shell: true,
    });
    if (migrate.status !== 0) {
      console.warn(
        "[embedded-pg] migrate deploy failed — falling back to prisma db push (fresh local cluster).",
      );
      const push = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: url },
        shell: true,
      });
      if (push.status !== 0) {
        throw new Error("prisma migrate deploy and db push both failed");
      }
      console.log(
        "[embedded-pg] schema applied via db push. Historical migrate fix is tracked separately.",
      );
    }
  }

  if (wantSeed) {
    console.log("[embedded-pg] seed-test-user…");
    const seed = spawnSync("npx", ["tsx", "scripts/seed-test-user.ts"], {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: url, NODE_ENV: "development" },
      shell: true,
    });
    if (seed.status !== 0) {
      console.warn("[embedded-pg] seed-test-user exited non-zero");
    }
  }

  console.log(
    "[embedded-pg] ready. Leave this process running. Ctrl+C to stop.",
  );
  console.log(
    "[embedded-pg] Point app .env DATABASE_URL at the same host/port/db/user as CI.",
  );

  const stop = async () => {
    console.log("\n[embedded-pg] stopping…");
    try {
      await pg.stop();
    } catch {
      // ignore
    }
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  // Keep alive
  await new Promise(() => undefined);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
