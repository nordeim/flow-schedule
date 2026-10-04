import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// SQLite URL resolution (v2.3, extracted from db.ts into a tested seam)
//
// Contract (pinned by tests/db-path.test.ts and documented in .env.example):
// a RELATIVE `file:` URL resolves against the first "anchor" directory that
// contains prisma/schema.prisma — exactly like the Prisma CLI, which anchors
// relative `file:` URLs against the schema file. `file:../db/custom.db`
// therefore points at <repo>/db/custom.db for `next dev`, `next build` and
// the standalone server alike, regardless of the process working directory.
//
// Anchor order (candidateRoots):
//   1. this module's own repo root (src/lib → ../../) — covers next dev
//      and next build, which execute modules from source. Guarded: bundlers
//      may rewrite or drop import.meta (the standalone build), in which
//      case this anchor is simply skipped.
//   2. the standalone build's repo root — Next's standalone server.js runs
//      `process.chdir(__dirname)` into <repo>/.next/standalone BEFORE any
//      module executes, and the file tracer copies prisma/schema.prisma
//      into that folder, so the plain CWD rule would resolve a relative
//      `file:` URL against the BUILD OUTPUT. When the CWD is that in-repo
//      standalone dir (detected by standaloneRepoRoot below), the real repo
//      two levels up takes precedence.
//   3. process.cwd() — the pre-v2.3 rule, kept as the fallback (a standalone
//      copy deployed elsewhere owns its own CWD; DEPLOYMENT.md §4 tells
//      production to use an absolute file: URL anyway).
//
// Absolute file: URLs (POSIX or Windows drive letters) and non-SQLite URLs
// (e.g. PostgreSQL in a hosted deploy) pass through untouched.
// ---------------------------------------------------------------------------

/** The documented fresh-checkout default: <repo>/db/custom.db. */
const DEFAULT_RELATIVE_DB = "../db/custom.db";

/**
 * Pure resolution rule. `anchors` are candidate repo roots, searched in
 * order for one that contains prisma/schema.prisma; the first hit wins, and
 * when none matches the LAST anchor is used (CWD-compatibility fallback).
 */
export function resolveDatabaseUrl(envUrl: string | undefined, anchors: string[]): string {
  const url = envUrl?.trim();
  const schemaRoot = findSchemaRoot(anchors);

  if (!url) {
    return `file:${path.resolve(schemaRoot, "prisma", DEFAULT_RELATIVE_DB)}`;
  }
  if (/^file:/i.test(url)) {
    const raw = url.replace(/^file:/i, "");
    // Windows drive letters (file:C:\...) are absolute too.
    if (path.isAbsolute(raw) || /^[A-Za-z]:[\\/]/.test(raw)) return `file:${raw}`;
    return `file:${path.resolve(schemaRoot, "prisma", raw)}`;
  }
  return url;
}

/**
 * Detect "the CWD is a Next standalone build folder inside its repo" and
 * return the repo root (two levels up). Pure + fixture-testable: takes the
 * directory to inspect, uses real existence checks only.
 *
 * Signals: the dir is literally named "standalone", carries the standalone
 * server.js, AND the grandparent owns prisma/schema.prisma — a standalone
 * copy deployed elsewhere (no repo above it) does NOT match and keeps the
 * plain CWD rule.
 */
export function standaloneRepoRoot(dir: string): string | null {
  if (path.basename(dir) !== "standalone") return null;
  if (!existsSync(path.join(dir, "server.js"))) return null;
  if (!existsSync(path.join(dir, "..", "..", "prisma", "schema.prisma"))) return null;
  return path.resolve(dir, "..", "..");
}

/** Candidate repo roots for the running process (see module comment). */
export function candidateRoots(): string[] {
  const roots: string[] = [];
  // 1. The standalone repo root comes FIRST: the bundled module's
  //    import.meta.url is rewritten into <standalone>/src/lib/db-path.ts —
  //    a virtual path that exists only in the chunk map — so the module
  //    anchor cannot be trusted in that context and must not outrank the
  //    detector.
  const standaloneRoot = standaloneRepoRoot(process.cwd());
  if (standaloneRoot) roots.push(standaloneRoot);
  try {
    // 2. This module's own repo root (src/lib → ../../) — covers next dev
    //    and next build, which execute modules from source. Validated by
    //    the source file existing on disk: the standalone runtime's virtual
    //    mapping fails this check and is skipped.
    const self = new URL(import.meta.url).pathname;
    const here = path.dirname(self);
    if (here && existsSync(self)) roots.push(path.resolve(here, "..", ".."));
  } catch {
    // import.meta unavailable in this context — remaining anchors apply.
  }
  // 3. The process CWD — the pre-v2.3 rule, kept as the fallback.
  roots.push(process.cwd());
  return roots;
}

// ---------------------------------------------------------------------------
// v3 (session 9, F-1): the repo's own .env is authoritative for DATABASE_URL.
//
// The environment a repo runs in can carry a DATABASE_URL the repo never
// asked for: Bun auto-loads .env files from PARENT directories (a workspace
// parent .env with an absolute URL wins over this repo's relative one — the
// session-1 quirk), and CI/sandbox harnesses can export DATABASE_URL
// directly into the shell. Both were reproduced in session 9: `db:push`,
// `db:seed` and `next dev` all resolved to a database OUTSIDE the repo
// (a file lost on every workspace reset, and a dev server whose queries
// fail outright once the parent file is removed).
//
// The v3 rule (chooseEnvSource below):
//   1. A repo .env DATABASE_URL beats an ambient SQLite file: URL that
//      resolves OUTSIDE the schema-owning repo (the hijack protection).
//   2. An ambient SQLite file: URL that resolves INSIDE the repo still
//      wins — a deliberate isolation override (the e2e suite's
//      file:../db/e2e.db).
//   3. A non-SQLite ambient URL (PostgreSQL in production) always wins —
//      a deliberate provider override, never a parent-workspace artifact.
//   4. No repo .env value → the ambient value wins (the production
//      env-var flow, DEPLOYMENT.md).
// The prisma CLI gets the same rule via scripts/prisma-cli.ts (its own
// dotenv never overrides an existing process-env value).
// ---------------------------------------------------------------------------

/** True when a URL string is a SQLite file: URL (case-insensitive). */
function isSqliteUrl(url: string): boolean {
  return /^file:/i.test(url);
}

/**
 * Resolve a SQLite file: URL to an ABSOLUTE PATH using the same anchoring
 * rule as resolveDatabaseUrl (schema-relative). Non-SQLite URLs → null.
 */
function sqliteUrlAbsolutePath(url: string, schemaRoot: string): string | null {
  if (!isSqliteUrl(url)) return null;
  const raw = url.trim().replace(/^file:/i, "");
  if (path.isAbsolute(raw) || /^[A-Za-z]:[\\/]/.test(raw)) return path.resolve(raw);
  return path.resolve(schemaRoot, "prisma", raw);
}

/** True when `p` sits strictly inside `root` (not the root itself). */
function isStrictlyInside(p: string, root: string): boolean {
  const rel = path.relative(path.resolve(root), path.resolve(p));
  return rel !== "" && !rel.startsWith(`..${path.sep}`) && rel !== ".." && !path.isAbsolute(rel);
}

/**
 * The v3 priority rule (pure). `ambientUrl` is the process-env DATABASE_URL;
 * `repoEnvUrl` is the value read from the schema-owning repo's own .env
 * (repoEnvDatabaseUrl, undefined when absent/blank); `schemaRoot` is the
 * anchor directory that owns prisma/schema.prisma. Returns the URL that
 * should be resolved (may be undefined → the documented default applies).
 */
export function chooseEnvSource(
  ambientUrl: string | undefined,
  repoEnvUrl: string | undefined,
  schemaRoot: string,
): string | undefined {
  const ambient = ambientUrl?.trim() || undefined;
  const repoEnv = repoEnvUrl?.trim() || undefined;
  if (!repoEnv) return ambient; // no repo .env → ambient (or undefined)
  if (!ambient) return repoEnv; // only the repo .env → it wins
  // Non-SQLite ambient URLs are deliberate production provider overrides.
  if (!isSqliteUrl(ambient)) return ambient;
  // A SQLite ambient URL resolving INSIDE the schema repo is a deliberate
  // isolation override (the e2e suite's db/e2e.db) — it wins.
  const ambientPath = sqliteUrlAbsolutePath(ambient, schemaRoot);
  if (ambientPath && isStrictlyInside(ambientPath, schemaRoot)) return ambient;
  // The ambient SQLite URL points outside the repo (the parent-workspace
  // hijack) — the repo's own .env is authoritative.
  return repoEnv;
}

/**
 * Read DATABASE_URL from a repo's own .env file (if any). A tiny,
 * dependency-free dotenv subset: KEY=VALUE lines, `#` comments, matching
 * quotes stripped, blank/absent values → undefined. The repo's .env is the
 * repo's own contract — it is read from DISK, not from process.env (which
 * may be polluted by a parent workspace or a harness shell).
 */
export function repoEnvDatabaseUrl(repoRoot: string | undefined): string | undefined {
  if (!repoRoot) return undefined;
  try {
    const envPath = path.join(repoRoot, ".env");
    if (!existsSync(envPath)) return undefined;
    const text = readFileSync(envPath, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const match = /^DATABASE_URL\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      let value = match[1].trim();
      // Strip a same-line trailing comment (only outside quotes — a `#`
      // directly after a space; quoted values containing " #" are exotic
      // and out of scope for this subset).
      const commentAt = value.indexOf(" #");
      if (commentAt !== -1) value = value.slice(0, commentAt).trim();
      if (
        (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
        (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
      ) {
        value = value.slice(1, -1).trim();
      }
      return value || undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/** The schema-owning anchor for a set of candidate roots (first hit wins). */
export function findSchemaRoot(anchors: string[]): string {
  return (
    anchors.find((root) => existsSync(path.join(root, "prisma", "schema.prisma"))) ??
    anchors[anchors.length - 1] ??
    process.cwd()
  );
}

/** Resolve DATABASE_URL for the running process (the db.ts entry point). */
export function resolveProcessDatabaseUrl(): string {
  const anchors = candidateRoots();
  const schemaRoot = findSchemaRoot(anchors);
  const chosen = chooseEnvSource(
    process.env.DATABASE_URL,
    repoEnvDatabaseUrl(schemaRoot),
    schemaRoot,
  );
  return resolveDatabaseUrl(chosen, anchors);
}
