import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { floatFormatDurations, formatWireDates } from "@/lib/serialize";

// The entity date-token wire contract (session 15, DW-1) — pinned against
// the reference app's OWN entity traffic (full-body XHR capture + direct
// API probes with the captured auth, six surfaces):
//
//   POST create (Task + Note):
//     "created_date":"2026-10-05T02:11:34.297127Z"   (6-digit µs, WITH Z)
//   GET list / PUT-update (Task + Note):
//     "created_date":"2026-10-04T21:28:23.793000"    (6-digit µs, NO Z)
//
// The reference's Python backend serializes its SERVER-GENERATED
// datetimes at microsecond precision with a per-route Z asymmetry; the
// clone's toISOString() emits 3-digit ms + Z. The fix mirrors the
// session-14 duration-float ruling (session-12 P-1): the byte-form is a
// documented parity surface, reproduced at the okWire text seam — pad
// the ms token to 6 digits, keep Z on create responses, strip it on
// read responses. The digits beyond ms are ".000" (the clone's clock
// and SQLite store milliseconds) — form parity, storage-precision
// residual, the same class as "duration_minutes":60.0.
//
// start_time/end_time (CLIENT-supplied dates) are ms+Z on the reference
// too — already byte-matching, NEVER touched by the transform.

const repo = path.resolve(import.meta.dirname, "..");

describe("formatWireDates (the pure text transform)", () => {
  it("read mode: pads ms to 6 digits and strips the Z (the GET/PUT wire)", () => {
    expect(
      formatWireDates('{"created_date":"2026-10-05T02:11:34.297Z"}', "read"),
    ).toBe('{"created_date":"2026-10-05T02:11:34.297000"}');
    expect(
      formatWireDates('{"updated_date":"2026-10-04T21:28:23.793Z"}', "read"),
    ).toBe('{"updated_date":"2026-10-04T21:28:23.793000"}');
  });

  it("create mode: pads ms to 6 digits and keeps the Z (the POST wire)", () => {
    expect(
      formatWireDates('{"created_date":"2026-10-05T02:11:34.297Z"}', "create"),
    ).toBe('{"created_date":"2026-10-05T02:11:34.297000Z"}');
    expect(
      formatWireDates('{"updated_date":"2026-10-05T02:11:34.297Z"}', "create"),
    ).toBe('{"updated_date":"2026-10-05T02:11:34.297000Z"}');
  });

  it("never touches start_time/end_time (client-supplied dates stay ms+Z)", () => {
    const raw =
      '{"start_time":"2026-10-04T09:30:00.000Z","end_time":"2026-10-04T10:15:00.000Z","created_date":"2026-10-04T09:00:00.123Z"}';
    expect(formatWireDates(raw, "read")).toBe(
      '{"start_time":"2026-10-04T09:30:00.000Z","end_time":"2026-10-04T10:15:00.000Z","created_date":"2026-10-04T09:00:00.123000"}',
    );
    expect(formatWireDates(raw, "create")).toBe(
      '{"start_time":"2026-10-04T09:30:00.000Z","end_time":"2026-10-04T10:15:00.000Z","created_date":"2026-10-04T09:00:00.123000Z"}',
    );
  });

  it("never touches escaped string content (a description quoting the token)", () => {
    // A description containing the literal text "created_date":"…Z"
    // JSON-escapes to \"created_date\":\"…Z\" — the backslash before the
    // closing quote breaks the property-token regex (the same safety
    // mechanism as floatFormatDurations). Safety pin.
    const raw = JSON.stringify({
      description: 'say "created_date":"2026-10-04T09:30:00.000Z" now',
      created_date: "2026-10-04T09:00:00.123Z",
    });
    const out = formatWireDates(raw, "read");
    // The real property was transformed.
    expect(out).toContain('"created_date":"2026-10-04T09:00:00.123000"');
    // The escaped copy was NOT transformed (still ends .000Z inside the
    // escaped string) and was not corrupted.
    expect(out).toContain('say \\"created_date\\":\\"2026-10-04T09:30:00.000Z\\" now');
    expect(out).not.toContain('\\"created_date\\":\\"2026-10-04T09:30:00.000\\"');
  });

  it("formats every occurrence in a list wire (the GET /api/tasks payload)", () => {
    const raw =
      '[{"created_date":"2026-10-05T02:11:34.297Z","updated_date":"2026-10-05T02:11:34.297Z"},{"created_date":"2026-10-04T21:28:23.793Z","updated_date":"2026-10-04T21:28:23.793Z"}]';
    expect(formatWireDates(raw, "read")).toBe(
      '[{"created_date":"2026-10-05T02:11:34.297000","updated_date":"2026-10-05T02:11:34.297000"},{"created_date":"2026-10-04T21:28:23.793000","updated_date":"2026-10-04T21:28:23.793000"}]',
    );
  });

  it("is idempotent (re-running on its own output changes nothing)", () => {
    // The output forms carry 6 fractional digits, which the 3-digit
    // pattern can no longer match — double-formatting is structurally
    // impossible, and null/unset values pass through untouched.
    const once = formatWireDates(
      '{"created_date":"2026-10-05T02:11:34.297Z"}',
      "read",
    );
    expect(formatWireDates(once, "read")).toBe(once);
    const onceC = formatWireDates(
      '{"created_date":"2026-10-05T02:11:34.297Z"}',
      "create",
    );
    expect(formatWireDates(onceC, "create")).toBe(onceC);
    expect(formatWireDates('{"created_date":null}', "read")).toBe(
      '{"created_date":null}',
    );
  });

  it("composes with floatFormatDurations (the okWire order, disjoint tokens)", () => {
    const raw = JSON.stringify({
      task: {
        start_time: "2026-10-04T09:30:00.000Z",
        duration_minutes: 60,
        created_date: "2026-10-04T09:00:00.123Z",
      },
    });
    const out = formatWireDates(floatFormatDurations(raw), "read");
    expect(out).toContain('"duration_minutes":60.0');
    expect(out).toContain('"start_time":"2026-10-04T09:30:00.000Z"');
    expect(out).toContain('"created_date":"2026-10-04T09:00:00.123000"');
  });
});

describe("the okWire/okWireCreate response seams (api.ts)", () => {
  it("okWire routes the float + read-mode date transforms (the CALL forms)", () => {
    const src = readFileSync(path.join(repo, "src", "lib", "api.ts"), "utf8");
    expect(src).toContain("export function okWire");
    // The CALL (not merely the import — M-3's lesson: a mutation that
    // drops the call but keeps the import must still fail this pin).
    // The session-14 float pin keeps matching:
    expect(src).toMatch(/floatFormatDurations\(\s*JSON\.stringify/);
    // The date transform is CALLED inside okWire with the read mode:
    expect(src).toMatch(
      /export function okWire[\s\S]{0,400}?formatWireDates\(\s*floatFormatDurations/,
    );
    expect(src).toMatch(
      /export function okWire[\s\S]{0,500}?,\s*"read"\s*,?\s*\)/,
    );
  });

  it("okWireCreate exists and routes the create-mode date transform", () => {
    const src = readFileSync(path.join(repo, "src", "lib", "api.ts"), "utf8");
    expect(src).toContain("export function okWireCreate");
    // The create-mode CALL inside okWireCreate (the call, not the import):
    expect(src).toMatch(
      /export function okWireCreate[\s\S]{0,400}?formatWireDates\(\s*floatFormatDurations/,
    );
    expect(src).toMatch(
      /export function okWireCreate[\s\S]{0,500}?,\s*"create"\s*,?\s*\)/,
    );
  });
});

describe("the route call sites (the file-read precedent)", () => {
  it("POST /api/tasks and POST /api/notes use okWireCreate (the create wire)", () => {
    for (const rel of [
      path.join("src", "app", "api", "tasks", "route.ts"),
      path.join("src", "app", "api", "notes", "route.ts"),
    ]) {
      const src = readFileSync(path.join(repo, rel), "utf8");
      expect(src).toMatch(/return okWireCreate\(/);
      // No create response still returns through plain ok() or the
      // okWire-with-201 form (the pre-session-15 shapes).
      expect(src).not.toMatch(/return ok\(/);
      expect(src).not.toMatch(/okWire\([\s\S]{0,120}?,\s*201\s*\)/);
    }
  });

  it("GET/PATCH /api/notes ship the wire form too (their wires carry the same date tokens)", () => {
    // Session 14 left the notes routes on ok() ("no number fields") —
    // with the date tokens in scope they join okWire (read mode).
    for (const rel of [
      path.join("src", "app", "api", "notes", "route.ts"),
      path.join("src", "app", "api", "notes", "[id]", "route.ts"),
    ]) {
      const src = readFileSync(path.join(repo, rel), "utf8");
      expect(src).toMatch(/return okWire\(/);
      // No entity payload still returns through plain ok().
      expect(src).not.toMatch(/return ok\(\s*\n?\s*\{\s*notes?\s*:/);
    }
  });

  it("the task GET/PATCH routes stay on okWire (read mode, unchanged)", () => {
    for (const rel of [
      path.join("src", "app", "api", "tasks", "route.ts"),
      path.join("src", "app", "api", "tasks", "[id]", "route.ts"),
    ]) {
      const src = readFileSync(path.join(repo, rel), "utf8");
      expect(src).toContain("okWire");
      expect(src).not.toMatch(/return ok\(\s*\n?\s*\{\s*tasks?\s*:/);
    }
  });
});
