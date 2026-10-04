import { execSync } from "node:child_process";
import path from "node:path";

/**
 * Playwright global setup: guarantee the isolated e2e database exists and
 * carries the demo seed, so every spec run starts from the same state.
 *
 * The database lives at <repo>/db/e2e.db (gitignored like every db/*.db).
 * `DATABASE_URL="file:../db/e2e.db"` resolves against prisma/ for the CLI
 * and against the schema anchor at runtime — one file, both tools.
 *
 * NOTE: do NOT delete/reset the db file here. The webServer may already be
 * live when globalSetup runs (Playwright starts it early), and removing
 * the file out from under an open SQLite handle breaks every subsequent
 * write with SQLITE_READONLY_RECOVERY ("attempt to write a readonly
 * database" — reproduced in session 1). Instead, specs clean up what they
 * create (see the cleanup blocks in planning.spec.ts / dashboard.spec.ts)
 * so the database converges back to the seed state after every run.
 */
export default function globalSetup(): void {
  const repo = path.resolve(__dirname, "..", "..");
  const env = {
    ...process.env,
    DATABASE_URL: "file:../db/e2e.db",
  } as NodeJS.ProcessEnv;

  // Prefer bun (the documented runtime); fall back to npx tsx for npm users.
  const run = (cmd: string) =>
    execSync(cmd, { cwd: repo, env, stdio: "pipe" }).toString();

  try {
    run("bunx prisma db push --skip-generate");
  } catch {
    run("npx prisma db push --skip-generate");
  }
  try {
    run("bun prisma/seed.ts");
  } catch {
    run("npx tsx prisma/seed.ts");
  }
}
