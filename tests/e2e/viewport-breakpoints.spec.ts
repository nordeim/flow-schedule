import { expect, test } from "@playwright/test";

// Viewport-band pins (session 17, VP-1).
//
// The session-17 multi-viewport live diff (reference + clone, bands
// 390/768/1024/1440) confirmed parity — but the e2e suite only pinned
// 390×844 (mobile-navigation.spec.ts), 1280×800 (its desktop describe),
// 1440×900 (the dashboard full-bleed describe), and the default
// 1280×720. NOTHING pinned the tablet band (768/1024) or the
// no-horizontal-overflow invariant at ANY band.
//
// What these pins lock (all live-measured on BOTH apps, session 17):
//   - The md BREAKPOINT contract: at exactly 768px (Tailwind md is
//     min-width: 768px) the desktop nav (hidden md:flex) is visible
//     and the mobile trigger container (div.md:hidden) is display:none
//     — one pixel below is the mobile band. Pinning the EDGE catches
//     both a breakpoint bump (to lg:) and a drop (to sm:).
//   - The OVERFLOW invariant: document.documentElement never scrolls
//     horizontally (scrollWidth === clientWidth) at any band — the
//     Tailwind v4 responsive-class regression guard (a responsive
//     padding/width edit that introduces overflow fails here).
//
// Measurement notes (see the remediation plan §3 design decisions):
//   - Visibility via getComputedStyle().display, not toBeHidden():
//     display:"none" is the exact Tailwind contract under test; a
//     toBeHidden pass has other causes (zero size, visibility
//     collapse) and would not specifically pin the breakpoint.
//   - The overflow metric sits on documentElement, not body: the
//     AppShell root is min-h-screen overflow-hidden (clips VISUAL
//     overflow), so the body never scrolls — the document element's
//     scrollWidth is the honest metric.

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
}

async function assertHeaderBandState(
  page: import("@playwright/test").Page,
  expected: { desktopNavVisible: boolean },
) {
  const state = await page.evaluate(() => {
    const desktopNav = document.querySelector("nav.hidden");
    const mobileContainer = document.querySelector("div.md\\:hidden");
    return {
      desktopNavDisplay: desktopNav ? getComputedStyle(desktopNav).display : null,
      mobileContainerDisplay: mobileContainer
        ? getComputedStyle(mobileContainer).display
        : null,
    };
  });
  // Both elements must exist (the header renders them at every band —
  // the CSS decides which one shows).
  expect(state.desktopNavDisplay).not.toBeNull();
  expect(state.mobileContainerDisplay).not.toBeNull();
  if (expected.desktopNavVisible) {
    // The md band: hidden md:flex → flex; div.md:hidden → none.
    expect(state.desktopNavDisplay).not.toBe("none");
    expect(state.mobileContainerDisplay).toBe("none");
  } else {
    // The mobile band: hidden md:flex → none; div.md:hidden → flex.
    expect(state.desktopNavDisplay).toBe("none");
    expect(state.mobileContainerDisplay).not.toBe("none");
  }
}

test.describe("viewport bands (the md breakpoint + overflow invariants)", () => {
  test.describe("tablet band — 768 (the md edge)", () => {
    test.use({ viewport: { width: 768, height: 900 } });

    test.beforeEach(async ({ page }) => {
      await page.goto("/Dashboard");
      await page.getByRole("heading", { name: "Weekly Schedule" }).waitFor();
    });

    test("desktop nav visible + mobile trigger hidden at the md edge", async ({ page }) => {
      await assertHeaderBandState(page, { desktopNavVisible: true });
    });

    test("no horizontal overflow at 768", async ({ page }) => {
      await assertNoHorizontalOverflow(page);
    });
  });

  test.describe("tablet band — 1024", () => {
    test.use({ viewport: { width: 1024, height: 900 } });

    test.beforeEach(async ({ page }) => {
      await page.goto("/Dashboard");
      await page.getByRole("heading", { name: "Weekly Schedule" }).waitFor();
    });

    test("desktop nav visible + mobile trigger hidden at 1024", async ({ page }) => {
      await assertHeaderBandState(page, { desktopNavVisible: true });
    });

    test("no horizontal overflow at 1024", async ({ page }) => {
      await assertNoHorizontalOverflow(page);
    });
  });

  test.describe("mobile band — 390 (the overflow bookend)", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test.beforeEach(async ({ page }) => {
      await page.goto("/Dashboard");
      await page.getByRole("heading", { name: "Weekly Schedule" }).waitFor();
    });

    test("mobile trigger visible + desktop nav hidden at 390", async ({ page }) => {
      await assertHeaderBandState(page, { desktopNavVisible: false });
    });

    test("no horizontal overflow at 390", async ({ page }) => {
      await assertNoHorizontalOverflow(page);
    });
  });

  test.describe("wide band — 1440 (the overflow bookend)", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test.beforeEach(async ({ page }) => {
      await page.goto("/Dashboard");
      await page.getByRole("heading", { name: "Weekly Schedule" }).waitFor();
    });

    test("desktop nav visible + mobile trigger hidden at 1440", async ({ page }) => {
      await assertHeaderBandState(page, { desktopNavVisible: true });
    });

    test("no horizontal overflow at 1440 (full-bleed, no overflow)", async ({ page }) => {
      await assertNoHorizontalOverflow(page);
    });
  });

  test.describe("document shell (the reference's classless body)", () => {
    test("the reference renders <body> with no class — the clone must not add rendering-hint utilities", async ({ page }) => {
      await page.goto("/Dashboard");
      await page.getByRole("heading", { name: "Weekly Schedule" }).waitFor();
      // Session-17 BD-1 (the live T-4 field-diff finding): the reference's
      // document.body.className is "" on every band; the clone shipped
      // className="antialiased" (a macOS-only font-smoothing hint the
      // reference does not use — the RootLayout body must stay classless).
      // Pinned at the default viewport: the contract is viewport-independent.
      const bodyClass = await page.evaluate(() => document.body.className);
      expect(bodyClass).toBe("");
    });
  });
});
