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

test.describe("the semantic token family (S23-F2 — the shadcn theme variant)", () => {
  // Session 23: the clone's :root shipped the shadcn SLATE variant; the
  // reference's OWN app stylesheet (/assets/index-CcElM1Qx.css — the CSS
  // the AUTHENTICATED shell loads; its login screen is a different
  // platform build) ships the shadcn DEFAULT (neutral) variant:
  //   --foreground: 0 0% 3.9% (rgb(10,10,10)) vs the clone's slate
  //   222.2 84% 4.9% (rgb(2,8,23)) — live-measured on BOTH apps (the
  //   body default, the TaskDialog field labels/inputs/select-triggers,
  //   the Planning CardTitles);
  //   --muted-foreground: 0 0% 45.1% (rgb(115,115,115)) vs the clone's
  //   slate-500 rgb(100,116,139) — measured on the dialog title
  //   placeholder;
  //   --radius: .5rem vs the clone's 0.625rem — the var-based corners
  //   drift 2px everywhere (the week-nav rounded-lg 8 vs 10 px, the
  //   dialog sm:rounded-lg 8 vs 10, the dropdown rounded-xl 12 vs 14).
  // 22 sessions of class-tree diffs missed it because every EXPLICIT
  // utility color was pinned (session 20) — the semantic family never
  // was; the glyph-edge/corner-arc raster residue at mobile (0.481%)
  // is what surfaced it. These computed pins close the family.
  //
  // NOT pinned here (documented acceptance): --border/--input — the
  // reference's nominal neutral-200 never renders (its bare `border`
  // surfaces take the v3 preflight #e5e7eb; the clone's slate-200 is
  // the closest rendered match at 1–3 units; its explicitly-colored
  // border surfaces match byte-for-byte).

  test("the body's default text color is the reference's neutral-950", async ({ page }) => {
    await page.goto("/Dashboard");
    await page.getByRole("heading", { name: "Weekly Schedule" }).waitFor();
    const color = await page.evaluate(() => getComputedStyle(document.body).color);
    expect(color).toBe("rgb(10, 10, 10)");
  });

  test("the week-nav buttons render the reference's 8px rounded-lg band", async ({ page }) => {
    await page.goto("/Dashboard");
    await page.getByRole("heading", { name: "Weekly Schedule" }).waitFor();
    const radius = await page.evaluate(() => {
      const card = [...document.querySelectorAll("main div.rounded-3xl")].find((c) =>
        c.querySelector("h2")?.textContent?.includes("Weekly Schedule"),
      );
      const btn = [...(card?.querySelectorAll("button") ?? [])].find((b) =>
        b.textContent?.includes("Previous"),
      );
      return btn ? getComputedStyle(btn).borderRadius : null;
    });
    expect(radius).toBe("8px");
  });

  test("the Planning CardTitles render the reference's neutral-950 card-foreground", async ({ page }) => {
    await page.goto("/Planning");
    await page.getByRole("heading", { name: "Weekly Planning" }).waitFor();
    // click a day card to reveal the selected-day Card (its CardTitle
    // inherits text-card-foreground — the classic Card form).
    await page.locator("div.cursor-pointer").first().click();
    const color = await page.evaluate(() => {
      const title = [...document.querySelectorAll("main .font-semibold.tracking-tight")].find(
        (t) => (t.textContent ?? "").match(/day|, Oct|, \w{3} \d+/i),
      );
      return title ? getComputedStyle(title).color : null;
    });
    expect(color).toBe("rgb(10, 10, 10)");
  });

  test("the TaskDialog's semantic surfaces: label color, placeholder, panel radius", async ({ page }) => {
    await page.goto("/Dashboard");
    await page.getByRole("heading", { name: "Weekly Schedule" }).waitFor();
    await page
      .getByRole("button", { name: /^Add task on Thu .* at 14:00$/ })
      .first()
      .click();
    await page.getByRole("dialog").waitFor();
    await page.waitForTimeout(400); // settle the enter animation
    const data = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      const label = d?.querySelector("label");
      const input = d?.querySelector("input");
      // the dialog panel: the sm:rounded-lg element (DialogContent's
      // own div — the dialog role sits on it)
      const panel = d?.querySelector("div.sm\\:rounded-lg") ?? d;
      return {
        labelColor: label ? getComputedStyle(label).color : null,
        placeholderColor: input ? getComputedStyle(input, "::placeholder").color : null,
        panelRadius: panel ? getComputedStyle(panel).borderRadius : null,
      };
    });
    // The reference: --foreground 0 0% 3.9% = rgb(10,10,10);
    // --muted-foreground 0 0% 45.1% = rgb(115,115,115);
    // sm:rounded-lg at --radius .5rem = 8px.
    expect(data.labelColor).toBe("rgb(10, 10, 10)");
    expect(data.placeholderColor).toBe("rgb(115, 115, 115)");
    expect(data.panelRadius).toBe("8px");
  });

  test("the day-label date line inherits the reference's LENGTH line-height (S23-F3)", async ({ page }) => {
    // Session 23 (found mid-T-4): v4's named text-* utilities emit
    // UNIT-LESS line-heights (e.g. .text-xs → calc(1/.75) = 1.3333), so a
    // smaller-font child re-scales it — the calendar's day-label date
    // line (text-[10px] inside a text-xs parent) rendered 13.33px where
    // the reference's v3 LENGTH (1rem) inherits as a fixed 16px. The
    // 2.67px shorter line shifted the centered two-line label stack
    // 1.33px down — the mobile raster's last residue (794 px, all in
    // the day-label column). The @theme line-height pins restore v3's
    // length semantics; this pin guards the rendered contract.
    await page.goto("/Dashboard");
    await page.getByRole("heading", { name: "Weekly Schedule" }).waitFor();
    const data = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("main div.rounded-3xl")];
      const cal = cards.find((c) => c.querySelector("h2")?.textContent?.includes("Weekly Schedule"));
      const rows = [...(cal?.querySelectorAll("div.grid.items-center") ?? [])].filter(
        (g) => g.getBoundingClientRect().width > 900,
      );
      const label = rows[0]?.firstElementChild;
      const eee = label?.querySelector("div.font-bold");
      const date = label?.querySelector("div.text-\\[10px\\]");
      if (!label || !eee || !date) return null;
      const lr = label.getBoundingClientRect();
      const er = eee.getBoundingClientRect();
      const dr = date.getBoundingClientRect();
      return {
        eeeLineHeight: getComputedStyle(eee).lineHeight,
        dateLineHeight: getComputedStyle(date).lineHeight,
        // the centered stack: the EEE line's top sits 9px below the
        // 50px label box's top on the reference (16+16 = 32 content,
        // (50-32)/2 = 9).
        eeeOffsetInLabel: +(er.y - lr.y).toFixed(2),
      };
    });
    expect(data).not.toBeNull();
    expect(data!.eeeLineHeight).toBe("16px");
    expect(data!.dateLineHeight).toBe("16px");
    expect(Math.abs(data!.eeeOffsetInLabel - 9)).toBeLessThanOrEqual(0.5);
  });
});
