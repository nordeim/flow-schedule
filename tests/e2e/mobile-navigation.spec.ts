import { expect, test } from "@playwright/test";

// Mobile navigation (390×844 — the reference app's mobile chrome).
//
// The reference FlowSchedule app has NO bottom tab bar (its mobile nav
// items array is empty — verified against the deployed reference bundle).
// The ONLY mobile navigation is the account menu: a ghost icon Button
// (user glyph) in the header that opens a Radix DropdownMenu aligned to
// the END — the menu's right edge anchors to the trigger's right edge.
//
// Geometry parity (measured on the live reference, 390px viewport):
//   menu right = 374 = trigger right = 374, menu top = 54 (trigger bottom
//   50 + 4px sideOffset), menu width 192, height 164.
//
// Tailwind v4 trap coverage (docs/Tailwind-V4-Validation-Report.md):
//   Trap 4 — v4's `:where(.space-y-* > :not(:last-child))` selector rewrite
//   gives space-y containers ZERO specificity, letting a child's own
//   mt/mb utilities win where v3 overrode them. This menu renders with
//   p-1 + per-item margins (NO space-y container with mt/mb children), so
//   its geometry cannot drift between engines. The computed box below pins
//   that: if a future edit reintroduces the space-y + mt pattern (or any
//   v3→v4 margin-side swap changes this menu), these measurements fail.
//   Trap 5 — the menu's shadow token is pinned in globals.css @theme
//   (--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)); the navbar shadow asserts
//   the v3 value, not v4's default (one notch heavier).

test.use({ viewport: { width: 390, height: 844 } });

test.describe("mobile account menu (the mobile navigation)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/Dashboard");
  });

  test("mobile trigger renders and desktop trigger is hidden", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Open account menu" });
    await expect(trigger).toBeVisible();

    // The desktop avatar trigger (avatar initial + chevron) stays hidden
    // below md (768px).
    const desktopNav = page.locator("nav.hidden");
    await expect(desktopNav).toBeHidden();
  });

  test("menu opens anchored to the trigger's right edge (reference parity)", async ({
    page,
  }) => {
    const trigger = page.getByRole("button", { name: "Open account menu" });
    // Measure the trigger BEFORE opening: while the Radix menu is open it
    // applies aria-hidden to the app root (hide-others), which removes the
    // trigger from the accessibility tree — role queries would time out.
    // (The reference app has the same behavior; its geometry was measured
    // through direct DOM queries.)
    const triggerBox = await trigger.boundingBox();
    expect(triggerBox).not.toBeNull();

    await trigger.click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();

    const menuBox = await menu.boundingBox();
    expect(menuBox).not.toBeNull();

    // Reference measurements at 390px: menu right 374, trigger right 374,
    // width 192. Tolerance absorbs subpixel rounding only.
    const menuRight = menuBox!.x + menuBox!.width;
    const triggerRight = triggerBox!.x + triggerBox!.width;
    expect(Math.abs(menuRight - triggerRight)).toBeLessThanOrEqual(1);
    expect(Math.abs(menuBox!.width - 192)).toBeLessThanOrEqual(2);
    // Opens BELOW the trigger (4px sideOffset), never overlapping it.
    expect(menuBox!.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height);
    expect(Math.abs(menuBox!.y - 54)).toBeLessThanOrEqual(6);
  });

  test("menu items: My Account, Profile, Settings, Logout", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Open account menu" });
    await trigger.click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();

    await expect(menu.getByText("My Account")).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Profile" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Settings" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Logout" })).toHaveCSS(
      "color",
      "rgb(220, 38, 38)",
    );
  });

  test("menu navigates to Profile and back", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Open account menu" });
    await trigger.click();
    await page.getByRole("menuitem", { name: "Profile" }).click();
    await expect(page).toHaveURL(/\/Profile$/);
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    // Returning to the dashboard, the menu still works (state is not stuck).
    await page.goto("/Dashboard");
    await trigger.click();
    await page.getByRole("menuitem", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/Settings$/);
  });

  test("menu closes on Escape and focus returns to the trigger", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Open account menu" });
    await trigger.click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("Logout signs out and lands on /login", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Open account menu" });
    await trigger.click();
    await page.getByRole("menuitem", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Welcome to FlowSchedule" }),
    ).toBeVisible();
  });

  test("header renders the brand and calendar controls (mobile chrome)", async ({ page }) => {
    const header = page.getByRole("banner");
    await expect(header).toBeVisible();
    await expect(header.getByRole("link", { name: "FlowSchedule" })).toBeVisible();

    // Calendar controls stay reachable on mobile.
    await expect(page.getByRole("button", { name: "← Previous" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Next →" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Full Planning" })).toBeVisible();
  });

  test("navbar shadow is the pinned v3 token, not v4's heavier default (Trap 5)", async ({
    page,
  }) => {
    const header = page.getByRole("banner");
    // shadow-sm pinned in @theme: 0 1px 2px 0 rgb(0 0 0 / 0.05) → the first
    // shadow color component must be 0.05 alpha, not v4's 0.1 default.
    const shadow = await header.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).toContain("rgba(0, 0, 0, 0.05)");
    expect(shadow).not.toContain("rgba(0, 0, 0, 0.1)");
  });
});

test.describe("desktop account menu (md+)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("desktop avatar dropdown opens with My Account items", async ({ page }) => {
    await page.goto("/Dashboard");
    const desktopTrigger = page.locator("nav.hidden").getByRole("button");
    await expect(desktopTrigger).toBeVisible();
    await desktopTrigger.click();

    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByText("My Account")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Profile" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Settings" })).toBeVisible();
  });
});
