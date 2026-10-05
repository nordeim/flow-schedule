import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Session 22, S22-F1/S22-F2 — the space-y v3-compat source pins.
//
// Tailwind v4 rewrote the space-y selector semantics: the inter-child
// margin moved from the FOLLOWING sibling (v3: margin-top on
// `:not([hidden]) ~ :not([hidden])`) to the PRECEDING one
// (margin-block-end on `:where(... > :not(:last-child))`). Two live
// failure modes on the reference's own class strings:
//   Trap 4b (S22-F1): the margin lands on the INLINE <label> of the
//     classic-shadcn field pattern — CSS ignores vertical margins on
//     inline boxes, so every label→field gap collapsed (login 10px→4px,
//     TaskDialog 12px→4px).
//   Trap 4c (S22-F2): the BackToSignIn link's own -mb-2 (the
//     reference's class) beats the :where() zero-specificity margin;
//     v3's margin-top on the FOLLOWING h2 margin-collapsed with the
//     -mb-2 (16-8 / 24-8 = 8 / 16px effective), so the views' headings
//     rose 16/24px into the link's band.
//
// The fix restores v3's margin side for exactly these patterns via four
// rules in globals.css (the DOM stays byte-identical to the reference's
// captured class strings — the repo's pinned-cursor/-shadow-sm
// precedent). These source pins guard the rules themselves; the
// auth.spec + dashboard.spec geometry pins guard the rendered result.

const css = readFileSync(
  join(import.meta.dirname, "..", "src", "app", "globals.css"),
  "utf8",
);

describe("space-y v3-compat rules (S22-F1/S22-F2 source pins)", () => {
  it("login fields: .space-y-1.5 > label + * restores the 6px margin", () => {
    expect(css).toContain(".space-y-1\\.5 > label + *");
    expect(css).toMatch(
      /\.space-y-1\\\.5 > label \+ \*\s*\{\s*margin-block-start:\s*0\.375rem;?\s*\}/,
    );
  });

  it("dialog fields: .space-y-2 > label + * restores the 8px margin", () => {
    expect(css).toContain(".space-y-2 > label + *");
    expect(css).toMatch(
      /\.space-y-2 > label \+ \*\s*\{\s*margin-block-start:\s*0\.5rem;?\s*\}/,
    );
  });

  it("Select pairs: the trigger's v4 margin-block-end is zeroed (the hidden native select makes it :not(:last-child))", () => {
    // The reference (v3) gave the SelectTrigger margin-top ONLY (mt 8 /
    // mb 0, live-measured); v4 adds margin-block-end 8 because Radix
    // appends a visually-hidden <select> after the trigger — each Select
    // field rendered 8px tall. The text fields' inputs are last children
    // (untouched). The create-mode dialog's height is 526 on the
    // reference — the mb rule brings the clone back to it.
    expect(css).toMatch(
      /\.space-y-2 > label \+ \*:not\(:last-child\)\s*\{\s*margin-block-end:\s*0;?\s*\}/,
    );
  });

  it("back-link headers: .space-y-4 > .-mb-2 + * restores the 16px margin", () => {
    expect(css).toContain(".space-y-4 > .-mb-2 + *");
    expect(css).toMatch(
      /\.space-y-4 > \.-mb-2 \+ \*\s*\{\s*margin-block-start:\s*1rem;?\s*\}/,
    );
  });

  it("forgot header at >=sm: the sm:space-y-6 variant carries 24px (1.5rem)", () => {
    // The media query must FOLLOW the base rule in source order (equal
    // specificity at >=40rem — source order decides).
    const media = /@media \(min-width: 40rem\)\s*\{\s*\.sm\\:space-y-6 > \.-mb-2 \+ \*\s*\{\s*margin-block-start:\s*1\.5rem;?\s*\}\s*\}/;
    expect(css).toMatch(media);
    const mediaIdx = css.search(media);
    const baseIdx = css.search(/\.space-y-4 > \.-mb-2 \+ \*/);
    expect(mediaIdx).toBeGreaterThan(baseIdx);
  });

  it("the compat rules document the trap (Trap 4b/4c comments)", () => {
    expect(css).toContain("S22-F1");
    expect(css).toContain("S22-F2");
  });
});
