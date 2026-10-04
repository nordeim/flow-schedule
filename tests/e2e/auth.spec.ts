import { expect, test } from "@playwright/test";

// Logged-out surface: the login page renders for anonymous visitors, signs
// in the demo user, and rejects bad credentials. This file opts out of the
// shared storageState (it tests the unauthenticated state).

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders the auth card", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Welcome to FlowSchedule" })).toBeVisible();
    await expect(page.getByText("Sign in to continue")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("Google button explains the self-hosted limit instead of dead-ending", async ({ page }) => {
    await page.getByRole("button", { name: "Continue with Google" }).click();
    await expect(page.getByRole("status")).toContainText(/self-hosted/i);
  });

  test("signs in with valid credentials and lands on the dashboard", async ({ page }) => {
    await page.getByLabel("Email").fill("demo@flowschedule.app");
    await page.getByLabel("Password").fill("demo1234");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/Dashboard$/);
    await expect(page.getByRole("heading", { name: "Weekly Schedule" })).toBeVisible();
  });

  test("rejects wrong credentials with an inline error", async ({ page }) => {
    await page.getByLabel("Email").fill("demo@flowschedule.app");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("register toggle creates a new account", async ({ page }) => {
    await page.getByRole("button", { name: "Need an account? Sign up" }).click();
    await expect(page.getByText("Create your account")).toBeVisible();

    const email = `pw-${Date.now()}@example.com`;
    await page.getByLabel("Name").fill("Playwright User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("SuperSecret123");
    await page.getByRole("button", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/Dashboard$/);
  });
});
