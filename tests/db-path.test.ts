import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  chooseEnvSource,
  repoEnvDatabaseUrl,
  resolveDatabaseUrl,
  standaloneRepoRoot,
} from "@/lib/db-path";

// The db-path contract (docs/parity-remediation-v2.3.md WS-1):
// a RELATIVE `file:` URL resolves against the first "anchor" directory that
// contains prisma/schema.prisma — exactly like the Prisma CLI resolves
// against the schema file — so `file:../db/custom.db` points at
// <anchor>/db/custom.db regardless of the process working directory.
// Absolute file: URLs (POSIX + Windows drive letters) and non-SQLite URLs
// pass through untouched; a missing/blank env value falls back to the
// documented default <anchor>/db/custom.db.

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

describe("resolveDatabaseUrl", () => {
  let repo: string;
  let other: string;

  beforeAll(() => {
    // A fake repo layout: <repo>/prisma/schema.prisma + <repo>/db/
    repo = mkdtempSync(path.join(tmpdir(), "dbpath-repo-"));
    mkdirSync(path.join(repo, "prisma"));
    writeFileSync(path.join(repo, "prisma", "schema.prisma"), "datasource db { provider = \"sqlite\" }");
    mkdirSync(path.join(repo, "db"));
    // A directory with no schema (e.g. a random CWD).
    other = mkdtempSync(path.join(tmpdir(), "dbpath-other-"));
  });

  afterAll(() => {
    rmSync(repo, { recursive: true, force: true });
    rmSync(other, { recursive: true, force: true });
  });

  it("resolves a relative file: URL against the schema anchor's prisma/ dir", () => {
    const out = resolveDatabaseUrl("file:../db/custom.db", [repo]);
    expect(toPosix(out)).toBe(`file:${toPosix(path.join(repo, "db", "custom.db"))}`);
  });

  it("picks the FIRST anchor that contains prisma/schema.prisma", () => {
    const out = resolveDatabaseUrl("file:../db/custom.db", [other, repo]);
    expect(toPosix(out)).toBe(`file:${toPosix(path.join(repo, "db", "custom.db"))}`);
  });

  it("falls back to the last anchor when no anchor carries a schema", () => {
    const out = resolveDatabaseUrl("file:../db/custom.db", [other]);
    // Behaves like today's CWD rule: resolve against <anchor>/prisma.
    expect(toPosix(out)).toBe(`file:${toPosix(path.join(other, "prisma", "..", "db", "custom.db"))}`);
  });

  it("defaults to <anchor>/db/custom.db when the env value is missing", () => {
    const out = resolveDatabaseUrl(undefined, [repo]);
    expect(toPosix(out)).toBe(`file:${toPosix(path.join(repo, "db", "custom.db"))}`);
  });

  it("defaults to <anchor>/db/custom.db when the env value is blank/whitespace", () => {
    expect(toPosix(resolveDatabaseUrl("   ", [repo]))).toBe(
      `file:${toPosix(path.join(repo, "db", "custom.db"))}`,
    );
  });

  it("passes absolute POSIX file: URLs through untouched", () => {
    expect(resolveDatabaseUrl("file:/var/data/prod.db", [repo])).toBe("file:/var/data/prod.db");
  });

  it("passes absolute Windows drive-letter file: URLs through untouched", () => {
    expect(resolveDatabaseUrl("file:C:\\data\\prod.db", [repo])).toBe("file:C:\\data\\prod.db");
  });

  it("passes non-SQLite URLs through untouched", () => {
    const pg = "postgresql://user:pass@localhost:5432/app";
    expect(resolveDatabaseUrl(pg, [repo])).toBe(pg);
  });

  it("trims surrounding whitespace from the env value", () => {
    const out = resolveDatabaseUrl("  file:../db/custom.db  ", [repo]);
    expect(toPosix(out)).toBe(`file:${toPosix(path.join(repo, "db", "custom.db"))}`);
  });

  it("treats file:./dev.db as relative to the schema anchor's prisma/ dir", () => {
    const out = resolveDatabaseUrl("file:./dev.db", [repo]);
    expect(toPosix(out)).toBe(`file:${toPosix(path.join(repo, "prisma", "dev.db"))}`);
  });
});

describe("standaloneRepoRoot (the Next standalone chdir trap)", () => {
  // The standalone server.js runs process.chdir(__dirname) into
  // <repo>/.next/standalone before any module executes, and the tracer
  // copies prisma/schema.prisma into that folder — the plain CWD rule would
  // resolve against the BUILD OUTPUT. The detector must recognize that
  // folder and return the real repo two levels up.
  let repo: string;
  let standalone: string;
  let deployed: string;

  beforeAll(() => {
    repo = mkdtempSync(path.join(tmpdir(), "dbpath-std-repo-"));
    mkdirSync(path.join(repo, "prisma"));
    writeFileSync(path.join(repo, "prisma", "schema.prisma"), "// x");
    standalone = path.join(repo, ".next", "standalone");
    mkdirSync(standalone, { recursive: true });
    writeFileSync(path.join(standalone, "server.js"), "// next standalone");
    mkdirSync(path.join(standalone, "prisma"));
    writeFileSync(path.join(standalone, "prisma", "schema.prisma"), "// traced copy");
    // A standalone copy deployed elsewhere: no repo above it.
    deployed = mkdtempSync(path.join(tmpdir(), "dbpath-deployed-"));
    mkdirSync(path.join(deployed, ".next", "standalone"), { recursive: true });
  });

  afterAll(() => {
    rmSync(repo, { recursive: true, force: true });
    rmSync(deployed, { recursive: true, force: true });
  });

  it("recognizes the in-repo standalone dir and returns the repo root", () => {
    expect(standaloneRepoRoot(standalone)).toBe(repo);
  });

  it("ignores a standalone dir with no repo above it (deployed copy)", () => {
    expect(standaloneRepoRoot(path.join(deployed, ".next", "standalone"))).toBeNull();
  });

  it("ignores plain directories that merely contain prisma/schema.prisma", () => {
    expect(standaloneRepoRoot(repo)).toBeNull();
    expect(standaloneRepoRoot("/tmp")).toBeNull();
  });

  it("resolution prefers the repo anchor over the standalone cwd copy", () => {
    // In the standalone context candidateRoots() yields the chunk-derived
    // anchor (no schema — skipped), then the detector's REPO root, then the
    // chdir'd standalone CWD. A relative URL resolved with the standalone
    // CWD would land in <standalone>/db (no such dir → SQLite error 14);
    // with this order it must land in <repo>/db.
    const out = resolveDatabaseUrl("file:../db/custom.db", [repo, standalone]);
    expect(toPosix(out)).toBe(`file:${toPosix(path.join(repo, "db", "custom.db"))}`);
  });
});

describe("anchor validation", () => {
  it("the repo anchor layout used by the tests actually exists", () => {
    // Sanity for the fixture itself — guards against a broken test setup
    // silently testing the fallback path instead.
    const repo = mkdtempSync(path.join(tmpdir(), "dbpath-check-"));
    try {
      mkdirSync(path.join(repo, "prisma"));
      writeFileSync(path.join(repo, "prisma", "schema.prisma"), "// x");
      expect(existsSync(path.join(repo, "prisma", "schema.prisma"))).toBe(true);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// v3 (session 9, F-1): the schema-owning repo's OWN .env is authoritative
// for DATABASE_URL against an ambient env URL that resolves OUTSIDE the
// repo (the parent-workspace .env hijack — Bun auto-loads parent .env files,
// and a workspace harness can also export DATABASE_URL directly; both were
// reproduced this session). An ambient URL that resolves INSIDE the repo
// still wins (the e2e suite's deliberate file:../db/e2e.db isolation
// override); a non-SQLite ambient URL (PostgreSQL in production) always
// wins (a deliberate provider override, never a parent-workspace artifact).
// ---------------------------------------------------------------------------

describe("repoEnvDatabaseUrl (the repo's own .env reader)", () => {
  let repo: string;

  beforeAll(() => {
    repo = mkdtempSync(path.join(tmpdir(), "dbpath-envrepo-"));
    mkdirSync(path.join(repo, "prisma"));
    writeFileSync(path.join(repo, "prisma", "schema.prisma"), "datasource db { provider = \"sqlite\" }");
  });
  afterAll(() => rmSync(repo, { recursive: true, force: true }));

  it("reads a double-quoted DATABASE_URL and strips the quotes", () => {
    writeFileSync(path.join(repo, ".env"), 'DATABASE_URL="file:../db/custom.db"\n');
    expect(repoEnvDatabaseUrl(repo)).toBe("file:../db/custom.db");
  });

  it("reads an unquoted DATABASE_URL", () => {
    writeFileSync(path.join(repo, ".env"), "DATABASE_URL=file:./dev.db\n");
    expect(repoEnvDatabaseUrl(repo)).toBe("file:./dev.db");
  });

  it("reads a single-quoted DATABASE_URL and strips the quotes", () => {
    writeFileSync(path.join(repo, ".env"), "DATABASE_URL='file:../db/custom.db'\nAUTH_SECRET=x\n");
    expect(repoEnvDatabaseUrl(repo)).toBe("file:../db/custom.db");
  });

  it("ignores same-line comments and unrelated keys", () => {
    writeFileSync(
      path.join(repo, ".env"),
      "# comment line\nAUTH_SECRET=abc\nDATABASE_URL=file:../db/custom.db # trailing comment\n",
    );
    expect(repoEnvDatabaseUrl(repo)).toBe("file:../db/custom.db");
  });

  it("returns undefined when the file exists but has no DATABASE_URL", () => {
    writeFileSync(path.join(repo, ".env"), "AUTH_SECRET=abc\n");
    expect(repoEnvDatabaseUrl(repo)).toBeUndefined();
  });

  it("treats an empty/blank DATABASE_URL value as absent", () => {
    writeFileSync(path.join(repo, ".env"), 'DATABASE_URL=""\n');
    expect(repoEnvDatabaseUrl(repo)).toBeUndefined();
  });

  it("returns undefined when the .env file does not exist", () => {
    expect(repoEnvDatabaseUrl(path.join(repo, "nowhere"))).toBeUndefined();
  });
});

describe("chooseEnvSource (the v3 priority rule)", () => {
  let repo: string;
  let outside: string;

  beforeAll(() => {
    repo = mkdtempSync(path.join(tmpdir(), "dbpath-prio-"));
    mkdirSync(path.join(repo, "prisma"));
    writeFileSync(path.join(repo, "prisma", "schema.prisma"), "// x");
    outside = mkdtempSync(path.join(tmpdir(), "dbpath-outside-"));
    mkdirSync(path.join(outside, "db"));
  });
  afterAll(() => {
    rmSync(repo, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  });

  it("the repo .env wins over an ambient absolute file URL that resolves OUTSIDE the repo (the hijack)", () => {
    const chosen = chooseEnvSource(
      `file:${path.join(outside, "db", "custom.db")}`, // ambient (parent workspace)
      "file:../db/custom.db", // the repo's own .env
      repo,
    );
    expect(chosen).toBe("file:../db/custom.db");
  });

  it("an ambient RELATIVE file URL that resolves INSIDE the repo still wins (the e2e isolation override)", () => {
    const chosen = chooseEnvSource(
      "file:../db/e2e.db", // resolves to <repo>/db/e2e.db — inside
      "file:../db/custom.db",
      repo,
    );
    expect(chosen).toBe("file:../db/e2e.db");
  });

  it("an ambient ABSOLUTE file URL that resolves inside the repo still wins", () => {
    const inside = `file:${path.join(repo, "db", "e2e.db")}`;
    const chosen = chooseEnvSource(inside, "file:../db/custom.db", repo);
    expect(chosen).toBe(inside);
  });

  it("a non-SQLite ambient URL always wins (the production provider override)", () => {
    const pg = "postgresql://user:pass@localhost:5432/app";
    const chosen = chooseEnvSource(pg, "file:../db/custom.db", repo);
    expect(chosen).toBe(pg);
  });

  it("no repo .env value → the ambient value wins (the production env-var flow)", () => {
    const chosen = chooseEnvSource("file:/var/data/prod.db", undefined, repo);
    expect(chosen).toBe("file:/var/data/prod.db");
  });

  it("no ambient value → the repo .env value wins (the fresh-checkout dev flow)", () => {
    const chosen = chooseEnvSource(undefined, "file:../db/custom.db", repo);
    expect(chosen).toBe("file:../db/custom.db");
  });

  it("neither source → undefined (the documented default applies downstream)", () => {
    expect(chooseEnvSource(undefined, undefined, repo)).toBeUndefined();
  });

  it("a blank ambient value is treated as absent (the repo .env wins)", () => {
    const chosen = chooseEnvSource("   ", "file:../db/custom.db", repo);
    expect(chosen).toBe("file:../db/custom.db");
  });
});

describe("the v3 end-to-end resolution (chooseEnvSource + resolveDatabaseUrl)", () => {
  let repo: string;
  let outside: string;

  beforeAll(() => {
    repo = mkdtempSync(path.join(tmpdir(), "dbpath-e2e-v3-"));
    mkdirSync(path.join(repo, "prisma"));
    writeFileSync(path.join(repo, "prisma", "schema.prisma"), "// x");
    mkdirSync(path.join(repo, "db"));
    outside = mkdtempSync(path.join(tmpdir(), "dbpath-e2e-out-"));
    mkdirSync(path.join(outside, "db"));
  });
  afterAll(() => {
    rmSync(repo, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  });

  it("the hijacked ambient URL loses; the repo .env value anchors inside the repo", () => {
    const chosen = chooseEnvSource(
      `file:${path.join(outside, "db", "custom.db")}`,
      "file:../db/custom.db",
      repo,
    );
    const out = resolveDatabaseUrl(chosen, [repo]);
    expect(toPosix(out)).toBe(`file:${toPosix(path.join(repo, "db", "custom.db"))}`);
  });

  it("the e2e isolation URL survives the repo .env (resolved inside the repo)", () => {
    const chosen = chooseEnvSource("file:../db/e2e.db", "file:../db/custom.db", repo);
    const out = resolveDatabaseUrl(chosen, [repo]);
    expect(toPosix(out)).toBe(`file:${toPosix(path.join(repo, "db", "e2e.db"))}`);
  });
});
