import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// The Tailwind default-theme pin contract (session 20, F-1 / C-1 / PIN-1).
//
// The session-20 drift audit established that tailwindcss@4.3.3 (locked
// since session 0) ships default theme values that diverge from the
// reference's v4.0-era build in two namespaces:
//
//   F-1 — the font stack: v4.3.3's default --font-sans is the v3-compat
//   -apple-system list; the reference renders the v4.0-era ui-sans
//   stack (measured live AND byte-extracted from its stylesheet's
//   preflight rule). Pinned in globals.css @theme.
//
//   C-1 — the palette: the 13 color tokens the app uses that had NO
//   @theme pin render v4.3.3's oklch→sRGB conversions — up to 34
//   units per channel off the reference's v3 hexes (its stylesheet
//   emits the v3 values, e.g. .text-red-700 { color: rgb(185 28 28) }).
//   All 13 are now pinned to the reference's measured hexes.
//
// PIN-1 — the completeness invariant: every color-class token the
// sources use must carry a @theme pin in globals.css. The 13-token gap
// accumulated silently across 19 sessions of new components precisely
// because nothing enforced used ⊆ pinned. The invariant below scans
// src/ for color-class tokens and asserts each is pinned — a future
// component using an unpinned token fails HERE, at authoring time,
// before the next minor-version bump can drift it.
//
// These are SOURCE pins (the wire-order / ai-prompt pattern): they read
// globals.css directly and assert the exact pin lines. A "cleanup" that
// drops a pin, reflows a hex, or swaps the font stack fails here BEFORE
// the e2e family's computed-value pins are the last line of defense.

const repo = path.resolve(import.meta.dirname, "..");
const globals = readFileSync(path.join(repo, "src/app/globals.css"), "utf8");

// The reference's measured stack — its stylesheet's preflight rule:
// font-family:ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,
// Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji
// (the pin's authored form quotes the multi-word names — the parsed and
// computed values are identical either way).
const REF_FONT_SANS =
  '--font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
const REF_FONT_MONO =
  '--font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

// The 13 session-20 color pins — the reference's measured hexes.
// (pink-700 is #be185d — the reference's own value, one B-unit off the
// v3 hex #be185c; measured live and in its stylesheet's rule.)
const PINS: Record<string, string> = {
  "blue-100": "#dbeafe",
  "gray-400": "#9ca3af",
  "gray-500": "#6b7280",
  "green-200": "#bbf7d0",
  "indigo-700": "#4338ca",
  "pink-50": "#fdf2f8",
  "pink-700": "#be185d",
  "purple-700": "#7e22ce",
  "purple-800": "#6b21a8",
  "purple-900": "#581c87",
  "red-200": "#fecaca",
  "red-700": "#b91c1c",
  "yellow-700": "#a16207",
};

describe("the theme pins in globals.css (session 20, F-1/C-1)", () => {
  it("pins --font-sans to the reference's v4.0-era ui-sans stack", () => {
    // F-1: v4.3.3's default is the v3-compat -apple-system list — the
    // reference (a v4.0-era build) renders the ui-sans stack.
    expect(globals).toContain(REF_FONT_SANS);
    // The v3-compat stack must NOT appear as the --font-sans pin.
    expect(globals).not.toContain("--font-sans: -apple-system");
  });

  it("pins --font-mono to the v4.0 form (the guard — identical in both eras, used by the timer display)", () => {
    expect(globals).toContain(REF_FONT_MONO);
  });

  it("pins the AI Summary mood ramp (purple-700/800/900 + the purple-50 gradient stop)", () => {
    expect(globals).toContain(`--color-purple-700: ${PINS["purple-700"]}`);
    expect(globals).toContain(`--color-purple-800: ${PINS["purple-800"]}`);
    expect(globals).toContain(`--color-purple-900: ${PINS["purple-900"]}`);
    expect(globals).toContain(`--color-purple-50: #faf5ff`);
  });

  it("pins the login-alert tokens (red-700, red-200, green-200)", () => {
    // The alert's e2e assertions live in auth.spec as class-string pins;
    // the VALUES are pinned here (the rate-limited surface is not probed
    // by the e2e family).
    expect(globals).toContain(`--color-red-700: ${PINS["red-700"]}`);
    expect(globals).toContain(`--color-red-200: ${PINS["red-200"]}`);
    expect(globals).toContain(`--color-green-200: ${PINS["green-200"]}`);
  });

  it("pins the badge/bar/chip tokens (indigo/pink/yellow 700s, gray 400/500, blue-100, pink-50)", () => {
    expect(globals).toContain(`--color-indigo-700: ${PINS["indigo-700"]}`);
    expect(globals).toContain(`--color-pink-700: ${PINS["pink-700"]}`);
    expect(globals).toContain(`--color-yellow-700: ${PINS["yellow-700"]}`);
    expect(globals).toContain(`--color-gray-400: ${PINS["gray-400"]}`);
    expect(globals).toContain(`--color-gray-500: ${PINS["gray-500"]}`);
    expect(globals).toContain(`--color-blue-100: ${PINS["blue-100"]}`);
    expect(globals).toContain(`--color-pink-50: ${PINS["pink-50"]}`);
  });

  it("PIN-1: every color-class token used in src/ carries a @theme pin (the completeness invariant)", () => {
    // Scan the sources for color-class tokens (the audit's own method,
    // re-implemented here — not imported — so a domain-map change can't
    // hide behind a shared helper).
    const srcDir = path.join(repo, "src");
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(tsx?|ts)$/.test(entry)) files.push(full);
      }
    };
    walk(srcDir);

    const tokenRe =
      /(?:bg|text|border|from|to|via|ring|fill|stroke|divide|accent|placeholder)-(slate|sky|indigo|blue|green|red|purple|pink|yellow|orange|teal|cyan|gray|amber|emerald|rose|violet)-(\d+)/g;
    const used = new Set<string>();
    for (const f of files) {
      const text = readFileSync(f, "utf8");
      for (const m of text.matchAll(tokenRe)) {
        used.add(`${m[1]}-${m[2]}`);
      }
    }

    // The pinned set: --color-<scale>-<step>: declarations in globals.css.
    const pinRe = /--color-([a-z]+)-(\d+):/g;
    const pinned = new Set<string>();
    for (const m of globals.matchAll(pinRe)) {
      pinned.add(`${m[1]}-${m[2]}`);
    }

    expect(used.size).toBeGreaterThan(60); // the scan itself is sane
    const missing = [...used].filter((t) => !pinned.has(t));
    expect(missing).toEqual([]); // every used token is pinned
  });
});
