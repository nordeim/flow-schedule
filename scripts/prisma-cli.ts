// Prisma-CLI seam (session 9, F-1): resolve DATABASE_URL with the db-path
// v3 priority, then spawn `prisma <args>` with the corrected environment.
//
// Why this exists: `bun run db:push` used to invoke the prisma CLI
// directly, and prisma's own dotenv loading NEVER overrides a value that
// is already in the process environment. In a workspace whose shell (or a
// parent .env — Bun auto-loads those) exports an absolute DATABASE_URL
// pointing OUTSIDE the repo, the CLI would push/migrate the WRONG file
// (reproduced: /home/z/my-project/db/custom.db instead of
// <repo>/db/custom.db). The wrapper applies the same authority rule as the
// runtime (src/lib/db-path.ts v3: the schema-owning repo's own .env beats
// an ambient SQLite URL that resolves outside the repo) and injects the
// resolved URL into the child prisma process.
//
// Usage (package.json):
//   "db:push":    "bun scripts/prisma-cli.ts db push --accept-data-loss"
//   "db:migrate": "bun scripts/prisma-cli.ts migrate dev"
//   "db:reset":   "bun scripts/prisma-cli.ts migrate reset"
// db:seed is exempt — prisma/seed.ts imports resolveProcessDatabaseUrl()
// itself and sets process.env.DATABASE_URL before constructing the client.

import { spawnSync } from "node:child_process";
import { resolveProcessDatabaseUrl } from "../src/lib/db-path";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: bun scripts/prisma-cli.ts <prisma args…>");
  process.exit(1);
}

const resolved = resolveProcessDatabaseUrl();
const runner = process.env.PRUNNER ?? "bunx";
const result = spawnSync(runner, ["prisma", ...args], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: resolved },
});

if (result.error) {
  console.error(`[prisma-cli] failed to spawn ${runner} prisma:`, result.error);
  process.exit(1);
}
process.exit(result.status ?? 1);
