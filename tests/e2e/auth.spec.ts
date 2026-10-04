import { expect, test, type Page } from "@playwright/test";

// Next.js's route announcer also carries role=alert (always empty) — the
// reference (a Vite SPA) has no such node. Scope every alert query to the
// card's alert.
const cardAlert = (page: Page) => page.locator('div[role="alert"]:not(#__next-route-announcer__)');

// Logged-out surface: the login page renders for anonymous visitors, signs
// in the demo user, and rejects bad credentials. This file opts out of the
// shared storageState (it tests the unauthenticated state).
//
// Session 5: every view state here is the LIVE reference's measured design
// (the base44 platform screen at /login) — the card chrome (rounded-2xl +
// top gradient bar), the real logo <img>, the slate-900 solid submit, the
// bg-slate-50/50 rounded-xl inputs, the separate sign-up / forgot-password
// VIEWS (not inline toggles), and the shadcn-style [role=alert] error card.
// See docs/remediation-plan-session5.md (L-1…L-22).

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("login page — sign-in view (reference chrome)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders the reference's auth card chrome", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Welcome to FlowSchedule" })).toBeVisible();
    await expect(page.getByText("Sign in to continue")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();

    // The real logo image (L-4) — not the clone's old Activity-icon box.
    const logo = page.getByAltText("FlowSchedule logo");
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("src", /logo\.png$/);

    // Card chrome (L-2/L-3): rounded-2xl + the top gradient bar, and the
    // reference's responsive padding steps.
    const cardClass = await page.evaluate(() => {
      const card = document.querySelector("main div.text-card-foreground") ??
        document.querySelector(".shadow-2xl");
      return card ? card.className : "";
    });
    expect(cardClass).toContain("rounded-2xl");
    expect(cardClass).toContain("backdrop-blur-sm");
    const padClass = await page.evaluate(() => {
      const bar = document.querySelector(".shadow-2xl + div, .text-card-foreground > div:last-child");
      return bar ? bar.className : "";
    });
    expect(padClass).toContain("sm:p-10");

    const hasTopBar = await page.evaluate(() => {
      return !!document.querySelector(".text-card-foreground > div.absolute.top-0");
    });
    expect(hasTopBar).toBe(true);

    // The submit is the reference's DARK slate button (L-13) — not the
    // clone's old sky-blue gradient.
    const submitClass = await page
      .getByRole("button", { name: "Sign in", exact: true })
      .getAttribute("class");
    expect(submitClass).toContain("bg-slate-900");
    expect(submitClass).not.toContain("from-sky-500");

    // Placeholders (L-11).
    await expect(page.getByLabel("Email")).toHaveAttribute("placeholder", "you@example.com");
    await expect(page.getByLabel("Password")).toHaveAttribute("placeholder", "••••••••");

    // Footer (L-14): the reference's responsive stack + slate links.
    const footerClass = await page.evaluate(() => {
      const forgot = [...document.querySelectorAll("button")].find((b) =>
        b.textContent?.includes("Forgot password?"),
      );
      return forgot ? forgot.parentElement!.className : "";
    });
    expect(footerClass).toContain("flex-col");
    expect(footerClass).toContain("sm:flex-row");

    // No clone-only "Back to FlowSchedule" link under the card (L-20).
    expect(await page.getByText("Back to FlowSchedule").count()).toBe(0);
  });

  test("Google button explains the self-hosted limit instead of dead-ending", async ({ page }) => {
    await page.getByRole("button", { name: "Continue with Google" }).click();
    await expect(page.getByRole("status")).toContainText(/self-hosted/i);
  });

  test("signs in with valid credentials and lands on the root dashboard", async ({ page }) => {
    await page.getByLabel("Email").fill("demo@flowschedule.app");
    await page.getByLabel("Password").fill("demo1234");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    // The reference lands at "/" (the dashboard at the root URL, R-1) —
    // not /Dashboard.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Weekly Schedule" })).toBeVisible();
  });

  test("rejects wrong credentials with the reference's alert card", async ({ page }) => {
    await page.getByLabel("Email").fill("demo@flowschedule.app");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    // The shadcn-style red Alert (L-16), text WITHOUT the trailing period.
    const alert = cardAlert(page);
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Invalid email or password");
    await expect(alert).not.toContainText("Invalid email or password.");
    const alertClass = await alert.getAttribute("class");
    expect(alertClass).toContain("bg-red-50/70");
    expect(alertClass).toContain("border-red-200");
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("login page — sign-up view (separate view, reference flow)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Need an account? Sign up" }).click();
  });

  test("swaps to the reference's sign-up view", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Back to sign in" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
    // NO Name field — the reference's sign-up form has three fields only.
    expect(await page.getByLabel("Name").count()).toBe(0);
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
    const submit = await page
      .getByRole("button", { name: "Create account" })
      .getAttribute("class");
    expect(submit).toContain("bg-slate-900");

    // Back returns to the sign-in view.
    await page.getByRole("button", { name: "Back to sign in" }).click();
    await expect(
      page.getByRole("heading", { name: "Welcome to FlowSchedule" }),
    ).toBeVisible();
  });

  test("mismatched passwords show the reference's alert", async ({ page }) => {
    await page.getByLabel("Email").fill(`mismatch-${Date.now()}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill("SuperSecret123");
    await page.getByLabel("Confirm Password").fill("Different123");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(cardAlert(page)).toContainText("Passwords do not match");
    // Still on the sign-up view — no account was created.
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  });

  test("creates an account and lands on the root dashboard", async ({ page }) => {
    const email = `pw-${Date.now()}@example.com`;
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("SuperSecret123");
    await page.getByLabel("Confirm Password").fill("SuperSecret123");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Weekly Schedule" })).toBeVisible();
  });
});

test.describe("login page — forgot-password view (separate view, reference flow)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Forgot password?" }).click();
  });

  test("swaps to the reference's reset view", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
    await expect(
      page.getByText("Enter your email and we'll send you a link to reset your password"),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Back to sign in" })).toBeVisible();
  });

  test("submitting shows the reference's check-your-email view", async ({ page }) => {
    await page.getByLabel("Email").fill("demo@flowschedule.app");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
    await expect(page.getByText("demo@flowschedule.app")).toBeVisible();
    // The green success alert (same chrome, self-hosted message).
    const alert = cardAlert(page);
    await expect(alert).toBeVisible();
    const alertClass = await alert.getAttribute("class");
    expect(alertClass).toContain("bg-green-50/70");
    expect(alertClass).toContain("border-green-200");
    // Back returns to sign-in.
    await page.getByRole("button", { name: "Back to sign in" }).click();
    await expect(
      page.getByRole("heading", { name: "Welcome to FlowSchedule" }),
    ).toBeVisible();
  });
});

test.describe("authenticated route guards (reference redirects to /login)", () => {
  test("unauthenticated /Dashboard redirects to /login", async ({ page }) => {
    await page.goto("/Dashboard");
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Welcome to FlowSchedule" }),
    ).toBeVisible();
  });

  test("unauthenticated /Planning redirects to /login", async ({ page }) => {
    await page.goto("/Planning");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("unauthenticated / redirects to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });
});
