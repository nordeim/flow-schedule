import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { floatFormatDurations } from "@/lib/serialize";

// The duration float-format wire contract (session 14, session-12 P-1
// closed) — pinned against the reference app's OWN raw entity wire
// (the SDK-auth XHR fetch of entities/Task, token-extracted):
//
//   "duration_minutes":60.0   "duration_minutes":30.0   "duration_minutes":null
//
// The reference's Python backend serializes floats; the clone's JS
// JSON.stringify(60) emits 60. Every JSON parser reads both as 60
// (semantically null — session 12's ruling), but this session's
// raw-token extraction IS the byte-diff tool P-1 said would be needed,
// and the parity discipline (FS-23/FS-24: the wire is the contract,
// byte for byte) extends to number formatting. The fix: the task
// routes' response text float-formats the integer duration tokens.

const repo = path.resolve(import.meta.dirname, "..");

describe("floatFormatDurations (the pure text transform)", () => {
  it("formats integer duration tokens as floats", () => {
    expect(
      floatFormatDurations('{"duration_minutes":60,"id":"x"}'),
    ).toBe('{"duration_minutes":60.0,"id":"x"}');
    expect(
      floatFormatDurations('{"a":1,"duration_minutes":30}'),
    ).toBe('{"a":1,"duration_minutes":30.0}');
  });

  it("leaves null durations untouched (the quick-added-task wire)", () => {
    // Probed live: quick-added (unscheduled) tasks carry
    // "duration_minutes":null on the reference's wire — null is not a
    // number token and must pass through.
    expect(
      floatFormatDurations('{"duration_minutes":null,"id":"x"}'),
    ).toBe('{"duration_minutes":null,"id":"x"}');
  });

  it("leaves already-fractional values untouched", () => {
    expect(
      floatFormatDurations('{"duration_minutes":90.5,"id":"x"}'),
    ).toBe('{"duration_minutes":90.5,"id":"x"}');
  });

  it("never touches escaped string content (a description quoting the token)", () => {
    // A description containing the literal text "duration_minutes":30
    // JSON-escapes to \"duration_minutes\":30 — the backslash-separated
    // token differs from the property's unescaped form, so the regex
    // cannot match it. Safety pin.
    const raw = JSON.stringify({
      description: 'say "duration_minutes":30 now',
      duration_minutes: 30,
    });
    const out = floatFormatDurations(raw);
    expect(out).toContain('"duration_minutes":30.0');
    expect(out).toContain('say \\"duration_minutes\\":30 now');
    // The escaped copy was NOT float-formatted.
    expect(out).not.toContain('\\"duration_minutes\\":30.0');
  });

  it("formats every occurrence in a list wire (the GET /api/tasks payload)", () => {
    const raw =
      '[{"duration_minutes":60},{"duration_minutes":null},{"duration_minutes":30}]';
    expect(floatFormatDurations(raw)).toBe(
      '[{"duration_minutes":60.0},{"duration_minutes":null},{"duration_minutes":30.0}]',
    );
  });

  it("leaves number fields with OTHER names untouched", () => {
    expect(floatFormatDurations('{"count":30,"n":60}')).toBe(
      '{"count":30,"n":60}',
    );
  });
});

describe("the okWire response seam (api.ts)", () => {
  it("api.ts defines okWire and routes it through floatFormatDurations", () => {
    const src = readFileSync(path.join(repo, "src", "lib", "api.ts"), "utf8");
    expect(src).toContain("export function okWire");
    // The CALL (not merely the import — M-3's lesson: a mutation that
    // drops the call but keeps the import must still fail this pin).
    expect(src).toMatch(/floatFormatDurations\(\s*JSON\.stringify/);
    // ok() keeps its plain NextResponse.json form (every other route).
    expect(src).toContain("export function ok<T>");
  });

  it("the task-serializing routes ship okWire responses (the file-read precedent)", () => {
    // The 3 responses that can carry a Task wire: GET/POST /api/tasks
    // and PATCH /api/tasks/[id]. DELETE /api/tasks/[id] returns
    // {deleted} (no duration); the Note wire has no number fields;
    // auth/AI routes carry no task payloads — all stay on ok().
    for (const rel of [
      path.join("src", "app", "api", "tasks", "route.ts"),
      path.join("src", "app", "api", "tasks", "[id]", "route.ts"),
    ]) {
      const src = readFileSync(path.join(repo, rel), "utf8");
      expect(src).toContain("okWire");
      // The Task-serializing call sites no longer use plain ok().
      expect(src).not.toMatch(/return ok\(\s*\{\s*tasks?\s*:/);
      expect(src).not.toMatch(/return ok\(\s*201\s*\)/);
    }
  });
});
