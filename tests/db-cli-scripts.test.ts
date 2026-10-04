import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// The Prisma-CLI seam contract (session 9, F-1): the CLI-facing db scripts
// run through scripts/prisma-cli.ts, which resolves DATABASE_URL with the
// db-path v3 priority (the schema-owning repo's own .env is authoritative
// against parent-workspace ambient URLs) and spawns prisma with the
// corrected environment. Without the wrapper, `bun run db:push` in a
// workspace whose shell (or a parent .env, Bun auto-loads both) carries an
// absolute DATABASE_URL pointing OUTSIDE the repo would push the schema to
// the WRONG file (reproduced this session: /home/z/my-project/db/custom.db
// instead of <repo>/db/custom.db) — prisma's own dotenv never overrides an
// existing process-env value.
//
// db:seed is exempt: prisma/seed.ts imports resolveProcessDatabaseUrl()
// itself and sets process.env.DATABASE_URL before constructing the client.

const repo = path.resolve(import.meta.dirname, "..");

describe("the prisma CLI wrapper contract (db-path v3, F-1)", () => {
  const pkg = JSON.parse(readFileSync(path.join(repo, "package.json"), "utf8")) as {
    scripts: Record<string, string>;
  };

  it("db:push routes through scripts/prisma-cli.ts", () => {
    expect(pkg.scripts["db:push"]).toMatch(/bun scripts\/prisma-cli\.ts db push/);
    expect(pkg.scripts["db:push"]).toMatch(/--accept-data-loss/);
  });

  it("db:migrate routes through scripts/prisma-cli.ts", () => {
    expect(pkg.scripts["db:migrate"]).toMatch(/bun scripts\/prisma-cli\.ts migrate dev/);
  });

  it("db:reset routes through scripts/prisma-cli.ts", () => {
    expect(pkg.scripts["db:reset"]).toMatch(/bun scripts\/prisma-cli\.ts migrate reset/);
  });

  it("scripts/prisma-cli.ts exists and resolves the URL through db-path", () => {
    const cli = path.join(repo, "scripts", "prisma-cli.ts");
    expect(existsSync(cli)).toBe(true);
    const body = readFileSync(cli, "utf8");
    // The wrapper must resolve with the v3 rule (repo .env authoritative)
    // and inject the result into the child prisma process's env.
    expect(body).toContain("resolveProcessDatabaseUrl");
    expect(body).toMatch(/DATABASE_URL[:=]/);
  });

  it("db:seed keeps its direct bun invocation (it self-resolves via db-path)", () => {
    expect(pkg.scripts["db:seed"]).toBe("bun prisma/seed.ts");
  });
});
