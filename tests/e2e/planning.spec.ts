import { expect, test } from "@playwright/test";

// Planning surface (authenticated): week card, 7 day columns, selected-day
// accordions, and the Add Task dialog flow (create → chip renders →
// complete → delete).

test.describe("planning page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/Planning");
  });

  test("renders the week card and seven day columns", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Weekly Planning" })).toBeVisible();
    await expect(page.getByText("Organize and review your upcoming week")).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Week of/ })).toBeVisible();
    for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
      await expect(page.locator("div.font-semibold", { hasText: day }).first()).toBeVisible();
    }
  });

  test("seeded tasks show as chips on their day columns", async ({ page }) => {
    await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();
  });

  test("Add Task dialog creates a scheduled task", async ({ page }) => {
    // Schedule for TODAY at 15:00 — today is inside the displayed week.
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const isoLocal = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T15:00`;

    await page.getByRole("button", { name: "Add Task" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Task Title").fill("E2E planned task");
    await dialog.locator("#start_time").fill(isoLocal);
    await dialog.locator("#duration").fill("45");
    await dialog.getByRole("button", { name: "Add Task", exact: true }).click();
    await expect(dialog).toBeHidden();

    // The chip appears on today's day column.
    await expect(page.locator("div", { hasText: "E2E planned task" }).first()).toBeVisible();

    // Cleanup: delete the task(s) via the API so repeated runs don't drift
    // the seeded day totals (global-setup deliberately does NOT reset the db
    // file — see its header comment). GET /api/tasks → { ok, data: { tasks } }.
    // Delete EVERY match — a crashed earlier run can leave residue that a
    // single `.find()`-then-delete would never converge on.
    const list = await (await page.request.get("/api/tasks")).json();
    const residue = (list?.data?.tasks ?? []).filter(
      (t: { title: string }) => t.title === "E2E planned task",
    );
    for (const t of residue) await page.request.delete(`/api/tasks/${t.id}`);
  });

  test("day-card click selects the day and its accordion updates", async ({ page }) => {
    // Click the Wednesday column's HEADER block (EEE + date): a center
    // click on the card can land on a task chip (div[role=button] with
    // stopPropagation) and open the Edit dialog instead.
    await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();
    await page.locator("button.p-4", { hasText: "Wed" }).first().locator("div.text-center").first().click();
    await expect(page.getByRole("heading", { name: /Wednesday/ })).toBeVisible();
  });

  test("day statistics accordion shows totals for the selected day", async ({ page }) => {
    // Hydration gate: a pre-hydration click on a day card is a no-op (no
    // React handler yet) and leaves "today" selected — today varies by run
    // date, so the Monday total would never appear. Wait for a seeded chip
    // first: it only renders once the store has fetched.
    await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();
    // Select Monday explicitly (the default is today, which varies by run
    // date); Monday carries 3 seeded tasks (30 + 120 + 60 = 3.5h). Click the
    // header block, never the card center — the center can be covered by a
    // task chip whose stopPropagation opens the Edit dialog instead.
    const mondayCard = page.locator("button.p-4", { hasText: "Mon" }).first();
    await mondayCard.locator("div.text-center").first().click();
    await expect(page.getByText("3.5h").first()).toBeVisible();
    await expect(page.getByText("scheduled", { exact: true })).toBeVisible();
  });
});
