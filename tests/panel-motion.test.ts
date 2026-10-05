import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// The panel-motion config contract (session 19, AN-1 / FS-31 + BL-1) —
// pinned against the reference app's OWN bundle (the decompiled G1e /
// W1e / A_e motion configs in index-BNgAatKl.js, byte-extracted) and
// the live WAAPI metadata probe (the overlay's native animation:
// duration 350, easing cubic-bezier(0.55, 0, 1, 0.45) — identical on
// both apps).
//
// The session-19 animation-timing pass established that the clone's
// framer-motion configs are byte-identical to the reference's at
// every seam — and that the RUNTIME is the same WAAPI-hybrid family
// (framer-motion@14.0.0's supportedWaapiEasing table matches the
// reference vendor bundle's easing table: circOut IS
// cubic-bezier(0.55, 0, 1, 0.45) in both, not the mathematical
// circular ease). These source pins lock the configs: a future edit
// to any duration/ease/delay/keyframe in QuickActions.tsx or
// BackgroundBlobs.tsx — a "cleanup" that reflows a number or swaps
// an easing name — fails here BEFORE the e2e family's behavioral
// pins are the last line of defense.
//
// BL-1 (the second background blob): the reference ships `w-100
// h-100` on its second blob — classes its Tailwind v3-scale build
// NEVER GENERATES (the 863 KB stylesheet has .w-96 but NO .w-100
// rule), so the blob collapses to 0×0 and never paints. The clone
// mirrors the RENDERED effect (0×0), NOT the class string (v4's
// dynamic spacing would generate w-100 as 400 px — copying the
// string would keep the divergence). The icon_sm dead-variant ruling
// (session 6, P-7), generalized.

const repo = path.resolve(import.meta.dirname, "..");

const quickActions = readFileSync(
  path.join(repo, "src/components/dashboard/QuickActions.tsx"),
  "utf8",
);
const blobs = readFileSync(
  path.join(repo, "src/components/layout/BackgroundBlobs.tsx"),
  "utf8",
);

describe("the Quick Actions motion config (decompiled G1e/W1e, byte-pinned)", () => {
  it("the panel bodies share the reference's panelMotion (y-offsets + circOut + delay)", () => {
    expect(quickActions).toContain("initial: { opacity: 0, y: 20 },");
    expect(quickActions).toContain("animate: { opacity: 1, y: 0 },");
    expect(quickActions).toContain("exit: { opacity: 0, y: -20 },");
    expect(quickActions).toContain(
      'transition: { duration: 0.3, ease: "circOut" as const, delay: 0.2 },',
    );
  });

  it("the card container keeps the layout morph transition", () => {
    expect(quickActions).toContain("layout\n");
    expect(quickActions).toContain('transition={{ duration: 0.4, ease: "circOut" as const }}');
  });

  it("the expanding overlay keeps both transitions + the opacity keyframes", () => {
    // entrance: .35s circOut from the tile rect, opacity .6 -> 1
    expect(quickActions).toContain("opacity: 0.6,");
    expect(quickActions).toContain('transition={{ duration: 0.35, ease: "circOut" as const }}');
    // exit: .3s circIn back to the tile rect (the exit-internal
    // transition — AnimatePresence reads it from the exit target)
    expect(quickActions).toContain('transition: { duration: 0.3, ease: "circIn" as const },');
  });

  it("the form-view fade keeps the 0.3 s duration + the last-rendered 0.15 delay", () => {
    expect(quickActions).toContain("transition={{ duration: 0.3, delay: activeId ? 0.15 : 0 }}");
  });

  it("the buttons-view fade keeps the animate-internal delay + the component duration", () => {
    expect(quickActions).toContain("animate={{ opacity: 1, transition: { delay: 0.2 } }}");
    expect(quickActions).toContain("transition={{ duration: 0.2 }}");
  });

  it("the tiles keep the reference's whileHover/whileTap gestures", () => {
    expect(quickActions).toContain(
      'whileHover={{ scale: 1.07, boxShadow: "0px 10px 20px rgba(0,0,0,0.15)" }}',
    );
    expect(quickActions).toContain("whileTap={{ scale: 0.93 }}");
  });
});

describe("the BackgroundBlobs config (decompiled A_e, byte-pinned)", () => {
  it("blob 1: the 30 s mirrored sky/blue drift", () => {
    expect(blobs).toContain("className=");
    expect(blobs).toContain("absolute w-96 h-96 bg-gradient-to-r from-sky-400/40 to-blue-500/40");
    expect(blobs).toContain(
      "animate={{ x: [100, 400, 100], y: [150, 450, 150], scale: [0.9, 1.3, 0.9] }}",
    );
    expect(blobs).toContain(
      'transition={{ duration: 30, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}',
    );
  });

  it("blob 2: the 35 s mirrored indigo drift at 0x0 (the BL-1 dead-class mirror)", () => {
    // the reference's `w-100 h-100` is dead in its v3 scale — the blob
    // collapses to 0×0. The clone mirrors the RENDERED effect: NO
    // width/height utilities on this blob (an absolutely positioned,
    // content-less div at auto width renders nothing). The animate
    // keyframes + transition stay byte-identical (a 0×0 box animating
    // is the reference's own rendered behavior).
    expect(blobs).toContain(
      "absolute bg-gradient-to-r from-indigo-400/35 to-purple-500/35 rounded-full blur-3xl",
    );
    expect(blobs).toContain("animate={{ x: [500, 900, 500], y: [100, 400, 100], scale: [1.2, 0.8, 1.2] }}");
    expect(blobs).toContain(
      'transition={{ duration: 35, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 5 }}',
    );
    // the BL-1 guard: NO size utilities may return to the second blob
    // (w-[400px] was the pre-fix divergence; w-100/w-96-style classes
    // would resolve in v4's dynamic scale and re-diverge).
    expect(blobs).not.toContain("w-[400px]");
    const second = blobs.match(
      /motion\.div[\s\S]{0,200}?absolute bg-gradient-to-r from-indigo-400\/35[^"]*/,
    );
    expect(second?.[0]).toBeTruthy();
    expect(second?.[0]).not.toMatch(/\bw-\S/);
  });

  it("blob 3: the 40 s mirrored cyan drift", () => {
    expect(blobs).toContain("absolute w-80 h-80 bg-gradient-to-r from-cyan-400/45 to-teal-400/45");
    expect(blobs).toContain(
      "animate={{ x: [150, 550, 150], y: [450, 250, 450], scale: [1, 1.4, 1] }}",
    );
    expect(blobs).toContain(
      'transition={{ duration: 40, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 10 }}',
    );
  });

  it("the host overlay keeps the reference's container classes", () => {
    expect(blobs).toContain('"fixed inset-0 pointer-events-none opacity-90"');
  });
});
