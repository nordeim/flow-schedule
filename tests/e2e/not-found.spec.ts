import { expect, test } from "@playwright/test";

// The 404 surface (session 5, N-1): the reference renders a custom
// not-found page — text-7xl slate-300 "404", a slate divider, "Page Not
// Found", the requested path echoed, and a "Go Home" button that navigates
// to "/" (the dashboard root). See docs/remediation-plan-session5.md.

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("404 page", () => {
  test("unknown path renders the reference's not-found page", async ({ page }) => {
    const res = await page.goto("/definitely-not-a-route");
    expect(res?.status()).toBe(404);

    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Page Not Found" })).toBeVisible();
    await expect(
      page.getByText('could not be found in this application'),
    ).toBeVisible();
    // The path is echoed with emphasis.
    await expect(page.getByText("definitely-not-a-route")).toBeVisible();

    // Reference chrome: the huge light 404 numeral + the short divider.
    const h1Class = await page.getByRole("heading", { name: "404" }).getAttribute("class");
    expect(h1Class).toContain("text-7xl");
    expect(h1Class).toContain("text-slate-300");
    const hasDivider = await page.evaluate(
      () => !!document.querySelector("div.h-0\\.5"),
    );
    expect(hasDivider).toBe(true);

    // Go Home navigates to the root dashboard route.
    await page.getByRole("button", { name: "Go Home" }).click();
    await expect(page).toHaveURL(/\/login$|\/$/);
  });
});
