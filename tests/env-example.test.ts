import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// .env.example contract (Session 1, R-1)
//
// `.env.example` is the committed environment documentation. It must name
// this project (FlowSchedule — not the ORBITAL scaffold predecessor), pin
// the documented database default (`db/` folder at the repo root), and list
// every variable the app actually reads (src/lib/auth.ts AUTH_SECRET,
// src/lib/db-path.ts DATABASE_URL) plus NEXT_PUBLIC_SITE_URL (src/lib/site.ts).
// ----------------------------------------------------------------------------

const repoRoot = path.resolve(import.meta.dirname, "..");
const envExample = readFileSync(path.join(repoRoot, ".env.example"), "utf8");

describe(".env.example contract", () => {
  it("is branded for FlowSchedule, not the ORBITAL predecessor", () => {
    expect(envExample).toMatch(/FlowSchedule/i);
    expect(envExample).not.toMatch(/ORBITAL/i);
  });

  it("documents the repo-root database default exactly", () => {
    expect(envExample).toContain('DATABASE_URL="file:../db/custom.db"');
  });

  it("documents every variable the app reads", () => {
    expect(envExample).toMatch(/^DATABASE_URL=/m);
    expect(envExample).toMatch(/^AUTH_SECRET=/m);
    expect(envExample).toMatch(/^NEXT_PUBLIC_SITE_URL=/m);
  });

  it("carries no stale predecessor examples", () => {
    // The ORBITAL scaffold shipped a project_management PostgreSQL URL.
    expect(envExample).not.toContain("project_management");
  });
});
