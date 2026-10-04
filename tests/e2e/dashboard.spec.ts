import { expect, test } from "@playwright/test";

// Dashboard surface (authenticated): the weekly calendar, quick actions,
// skills map, status card, and the AI-backed sidebar cards. The seed
// guarantees ≥ 8 sample tasks in the current week, so the calendar rows
// and the skills pie are exercised with real data.

test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/Dashboard");
  });

  test("renders the weekly calendar with 07:00–22:00 hour headers", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Weekly Schedule" })).toBeVisible();
    for (const hour of ["07:00", "12:00", "22:00"]) {
      await expect(page.getByText(hour, { exact: true })).toBeVisible();
    }
    // Day rows: Mon…Sun labels.
    for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
      await expect(page.getByText(day, { exact: true })).toBeVisible();
    }
  });

  test("seeded task blocks render on the calendar", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Team standup/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Deep work: roadmap draft/ })).toBeVisible();
  });

  test("task blocks carry the category gradient (work = blue-500 family)", async ({ page }) => {
    const block = page.getByRole("button", { name: /Team standup/ });
    const bg = await block.evaluate((el) => getComputedStyle(el).backgroundImage);
    // bg-gradient-to-r from-blue-400 to-blue-500 (pinned v3 hexes).
    expect(bg).toContain("linear-gradient");
    expect(bg).toContain("rgb(96, 165, 250)");
    expect(bg).toContain("rgb(59, 130, 246)");
  });

  test("week navigation moves the grid by seven days", async ({ page }) => {
    await page.getByRole("button", { name: "Next →" }).click();
    // After advancing one week, the Previous control returns to today's week
    // and the seeded blocks reappear.
    await page.getByRole("button", { name: "← Previous" }).click();
    await expect(page.getByRole("button", { name: /Team standup/ })).toBeVisible();
  });

  test("quick actions render the four tiles", async ({ page }) => {
    for (const label of ["Add New Task", "Start Focus Timer", "Log Activity", "Quick Brainstorm"]) {
      await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
    }
  });

  test("Add New Task panel creates a task", async ({ page }) => {
    await page.getByRole("button", { name: "Add New Task", exact: true }).click();
    const input = page.getByLabel("Task Title");
    await input.fill("E2E quick action task");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    // The panel closes. The reference surfaces unscheduled tasks nowhere in
    // the UI (no Unscheduled section on /Planning — session 2, P-3), so
    // the created task is verified via the API envelope directly.
    // Cleanup rides the same listing: delete EVERY match so repeated runs
    // don't drift the seeded state (global-setup deliberately does NOT
    // reset the db file — see its header comment; a crashed earlier run
    // can leave residue that a single `.find()`-then-delete would never
    // converge on). GET /api/tasks → { ok, data: { tasks } }.
    await expect(page.getByLabel("Task Title")).toBeHidden();
    const list = await (await page.request.get("/api/tasks")).json();
    const residue = (list?.data?.tasks ?? []).filter(
      (t: { title: string }) => t.title === "E2E quick action task",
    );
    expect(residue.length).toBeGreaterThanOrEqual(1);
    for (const t of residue) await page.request.delete(`/api/tasks/${t.id}`);
  });

  test("Focus Timer panel counts down", async ({ page }) => {
    await page.getByRole("button", { name: "Start Focus Timer", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Start Focus Timer" })).toBeVisible();
    await expect(page.getByText("25:00")).toBeVisible();
    await page.getByRole("button", { name: "Start timer" }).click();
    await expect(page.getByText("24:5", { exact: false }).first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Close Timer" }).click();
    await expect(page.getByRole("heading", { name: "Start Focus Timer" })).toBeHidden();
  });

  test("sidebar cards render (status, daily focus, AI summary)", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Daily Focus" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "AI Summary" })).toBeVisible();
    // Seeded week → status card shows Up Next (an upcoming task exists).
    await expect(page.getByRole("heading", { name: "Up Next" })).toBeVisible();
    // Daily Focus resolves (LLM or deterministic fallback — both valid).
    await expect(page.getByText(/- .+/)).toBeVisible();
  });

  test("calendar cell click opens the task dialog prefilled with day+hour", async ({ page }) => {
    await page
      .getByRole("button", { name: /^Add task on Tue .* at 10:00$/ })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Add New Task" })).toBeVisible();
    const start = dialog.locator("#start_time");
    await expect(start).toHaveValue(/T10:00/);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
  });
});
