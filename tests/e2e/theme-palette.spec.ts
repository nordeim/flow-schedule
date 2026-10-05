import { expect, test } from "@playwright/test";

// Theme-palette pins (session 20, F-1 / C-1 / PIN-1).
//
// The session-20 default-theme drift audit found that Tailwind v4.3.3
// (the locked version since session 0) ships DEFAULT theme values that
// differ from the reference's v4.0-era build in two namespaces:
//
//   F-1 (the font stack): v4.3.3's default --font-sans is the v3-compat
//   list (-apple-system, BlinkMacSystemFont, ...); the reference renders
//   the v4.0-era stack "ui-sans-serif, system-ui, sans-serif, ..." —
//   measured live on both apps AND byte-extracted from the reference's
//   own stylesheet preflight rule. On fontconfig systems the two stacks
//   resolve DIFFERENT physical fonts (~15% glyph-width drift measured on
//   content-sized text). The globals.css @theme pin restores the
//   reference's stack; this pin asserts the COMPUTED font-family on the
//   documentElement — deterministic (a serialized string, no raster, no
//   timing).
//
//   C-1 (the palette): 11 of the 13 color tokens the app uses that were
//   never pinned in @theme render v4.3.3's oklch→sRGB conversions — up
//   to 34 units off the reference's authored v3 hexes per channel (the
//   reference's stylesheet emits e.g. .text-purple-900 { color:
//   rgb(88 28 135) }). The pins below assert the computed colors on the
//   live surfaces: the AI Summary card's mood ramp + chips, and the
//   Planning page's CATEGORY_BADGES chips. Asserting the rgb(...)
//   SERIALIZED form pins the AUTHORED form too — a hex-pinned token
//   serializes as rgb(...) (the reference's form); an oklch default
//   serializes as lab(...)/oklch(...) and fails, which is exactly the
//   RED this family showed at base.
//
// The login-alert tokens (red-700/red-200/green-200) are pinned at the
// SOURCE level only (tests/tailwind-theme-pins.test.ts) — the auth
// endpoints are rate-limited 10/IP/15min and this family performs ZERO
// logins (auth.spec already pins the alert's class strings).
//
// These pins are content-independent: the AI cards render the same
// class contract under the LLM path and the fallback path (session 13/14
// pins), so the computed-color surfaces are stable whatever the LLM
// returns.

// The reference's measured stack (its stylesheet's preflight rule,
// byte-exact, with the serializer's quoted form):
const REF_FONT_STACK =
  'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';

test.describe("theme palette (the default-theme drift family, session 20)", () => {
  test("the html font stack is the reference's v4.0-era ui-sans stack", async ({ page }) => {
    await page.goto("/Dashboard");
    await page.getByRole("heading", { name: "Weekly Schedule" }).waitFor();

    const htmlFont = await page.evaluate(
      () => getComputedStyle(document.documentElement).fontFamily,
    );
    const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(htmlFont).toBe(REF_FONT_STACK);
    expect(bodyFont).toBe(REF_FONT_STACK);
  });

  test("the AI Summary mood ramp renders the reference's v3 purple hexes", async ({ page }) => {
    await page.goto("/Dashboard");
    // The mood gradient box only renders with data (the loaded state —
    // the dashboard.spec wait pattern). The box's discriminator is
    // from-purple-50 — the calendar's learning-task tooltip also carries
    // from-purple-400 and precedes it in document order.
    await page.locator('div[class*="from-purple-50"]').first().waitFor();

    const colors = await page.evaluate(() => {
      const moodBox = document.querySelector('div[class*="from-purple-50"]')!;
      const label = moodBox.querySelector("span")!;
      const body = moodBox.querySelector("p")!;
      return {
        label: getComputedStyle(label).color,
        body: getComputedStyle(body).color,
      };
    });
    // text-purple-900 / text-purple-800 — the reference's v3 values
    // (rgb(88 28 135) / rgb(107 33 168), measured live on its card).
    expect(colors.label).toBe("rgb(88, 28, 135)");
    expect(colors.body).toBe("rgb(107, 33, 168)");
  });

  test("the AI Summary chips render the reference's blue-100 / green-100", async ({ page }) => {
    await page.goto("/Dashboard");
    await page.locator('div[class*="from-purple-50"]').first().waitFor();
    await page.locator("span[class*=bg-blue-100]").first().waitFor();

    const chips = await page.evaluate(() => {
      const read = (sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const cs = getComputedStyle(el);
        return { bg: cs.backgroundColor, color: cs.color };
      };
      return {
        focus: read("span[class*=bg-blue-100]"),
        activities: read("span[class*=bg-green-100]"),
      };
    });
    // blue-100 #dbeafe / blue-700 #1d4ed8; green-100 #dcfce7 / green-700
    // #15803d — the reference's v3 values, measured live.
    expect(chips.focus?.bg).toBe("rgb(219, 234, 254)");
    expect(chips.focus?.color).toBe("rgb(29, 78, 216)");
    expect(chips.activities?.bg).toBe("rgb(220, 252, 231)");
    expect(chips.activities?.color).toBe("rgb(21, 128, 61)");
  });

  test("the Planning badges render the reference's v3 text ramps", async ({ page }) => {
    await page.goto("/Planning");
    await page.getByRole("heading", { name: "Weekly Planning" }).waitFor();
    // The CATEGORY_BADGES chips on the day cards (the seed anchors all 7
    // categories into the current week — E-1).
    await page.locator('[class*="bg-purple-100"]').first().waitFor();

    const badges = await page.evaluate(() => {
      const read = (bg: string, tx: string) => {
        const el = [...document.querySelectorAll("span, div")].find((e) => {
          const c = e.getAttribute("class") ?? "";
          return c.includes(bg) && c.includes(tx);
        });
        return el ? getComputedStyle(el).color : null;
      };
      return {
        learning: read("bg-purple-100", "text-purple-700"),
        creative: read("bg-pink-100", "text-pink-700"),
        social: read("bg-yellow-100", "text-yellow-700"),
        planning: read("bg-indigo-100", "text-indigo-700"),
      };
    });
    // purple-700 #7e22ce / pink-700 #be185c / yellow-700 #a16207 /
    // indigo-700 #4338ca — the reference's v3 values (extracted from its
    // own stylesheet's utility rules).
    expect(badges.learning).toBe("rgb(126, 34, 206)");
    expect(badges.creative).toBe("rgb(190, 24, 93)");
    expect(badges.social).toBe("rgb(161, 98, 7)");
    expect(badges.planning).toBe("rgb(67, 56, 202)");
  });
});
