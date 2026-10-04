import { expect, test } from "@playwright/test";

// Planning surface (authenticated), pinned to the reference's DECOMPILED
// behavior (session 2, P-1…P-7 remediation; session 6, card-structure parity):
//   - week card with 7 day columns; chips are display-only — a click
//     anywhere on a card (chips included) selects the day (bubbles);
//   - the selected-day section (task list + Day Statistics) renders ONLY
//     after a day card is clicked — selectedDay starts null in the
//     reference and there is no today-highlight;
//   - the selected-day sections are ALWAYS-VISIBLE CARDS (CardHeader/
//     CardTitle/CardContent), NOT accordions — the reference's CardTitle
//     is a div with no heading role and no collapse trigger (session 6, P-1);
//   - Day Statistics is the reference's static placeholder (no data
//     branch exists in the reference bundle);
//   - the Filter button is decorative (label "Filter", no handler) and its
//     icon carries mr-2 like the reference's (session 6, P-5);
//   - there is NO Unscheduled section anywhere in the reference;
//   - selected-day task items are display-only (edit happens exclusively
//     from the Dashboard calendar task blocks);
//   - the dialog submit reads "Create Task"/"Update Task" (session 6, P-2).
// The Add Task dialog flow (create → chip renders) is unchanged.

const LONG_DATE = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), /;
// The reference's CardTitle (a DIV, no heading role) — tracking-tight is the
// stable discriminator for the selected-day title on this page.
const DAY_TITLE = "div.tracking-tight";

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

  test("no selected-day section renders before a day is clicked", async ({ page }) => {
    // Hydration gate: wait for a seeded chip so the store has fetched.
    await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();
    // Reference: selectedDay starts null — the entire 2-col section (task
    // list + Day Statistics) is absent, and the reference has no
    // "Unscheduled" section at all (the string is not in its bundle).
    // The reference's day title is a div (CardTitle) — not a heading — so
    // BOTH the old heading pin and the text pin must be absent (P-1).
    await expect(page.getByText(LONG_DATE)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: LONG_DATE })).toHaveCount(0);
    await expect(page.getByText("Day Statistics")).toHaveCount(0);
    await expect(page.getByText(/Unscheduled/)).toHaveCount(0);
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
    // The reference's submit label is "Create Task" (decompiled r?"Update":
    // "Create" + " Task" — session 6, P-2), with a Save icon (P-3).
    const submit = dialog.getByRole("button", { name: "Create Task", exact: true });
    await expect(submit).toBeVisible();
    await expect(submit.locator("svg")).toHaveClass(/mr-2/);
    await submit.click();
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

  test("day-card click selects the day and its section updates", async ({ page }) => {
    // Hydration gate: a pre-hydration click on a day card is a no-op (no
    // React handler yet). Wait for a seeded chip first: it only renders
    // once the store has fetched.
    await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();
    // Before the click there is no panel at all (reference: selectedDay
    // starts null — P-1).
    await expect(page.getByText(LONG_DATE)).toHaveCount(0);
    // Chips are display-only (P-5), so any click position selects the day —
    // the header-block click is kept as the maximally robust variant.
    await page.locator("button.p-4", { hasText: "Wed" }).first().locator("div.text-center").first().click();
    await expect(page.locator(DAY_TITLE).filter({ hasText: /Wednesday/ })).toBeVisible();
  });

  test("day statistics shows the reference's static placeholder", async ({ page }) => {
    // Reference decompile: the Day Statistics card's ONLY content is the
    // static placeholder — there is no data branch (P-7). Select Monday
    // explicitly (Monday carries 3 seeded tasks — the strongest
    // temptation for a data branch to appear).
    await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();
    const mondayCard = page.locator("button.p-4", { hasText: "Mon" }).first();
    await mondayCard.click();
    await expect(page.locator(DAY_TITLE).filter({ hasText: /Monday/ })).toBeVisible();
    await expect(page.getByText("Day Statistics")).toBeVisible();
    await expect(page.getByText("Statistics for selected day")).toBeVisible();
    await expect(page.getByText("3.5h")).toHaveCount(0);
    await expect(page.getByText("scheduled", { exact: true })).toHaveCount(0);
  });

  test("selected-day sections are always-visible cards, not accordions (P-1)", async ({ page }) => {
    // Reference (decompiled tE/nE/rE/iE + live DOM): the task list and Day
    // Statistics are plain Card/CardHeader/CardTitle/CardContent — always
    // visible, no collapse button, no chevron, no heading role, and the
    // Card's tailwind-merged signature carries text-card-foreground shadow.
    await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();
    await page.locator("button.p-4", { hasText: "Mon" }).first().click();
    const title = page.locator(DAY_TITLE).filter({ hasText: /Monday/ });
    await expect(title).toBeVisible();
    // No accordion trigger: the day title must NOT be a button, and no
    // chevron-down icon exists in the section (scoped to main — the
    // HEADER's desktop avatar also ships a chevron-down, outside main).
    await expect(page.getByRole("button", { name: LONG_DATE })).toHaveCount(0);
    await expect(page.locator("main svg.lucide-chevron-down")).toHaveCount(0);
    // Day Statistics is visible WITHOUT a second click (always-visible).
    await expect(page.getByText("Day Statistics")).toBeVisible();
    await expect(page.getByText("Statistics for selected day")).toBeVisible();
    // The Card merge signature (Card base + glass className via cn/twMerge —
    // byte-identical to the reference's live DOM).
    const statsCard = page
      .locator("div.rounded-3xl")
      .filter({ has: page.getByText("Statistics for selected day") });
    await expect(statsCard).toHaveCount(1);
    await expect(statsCard).toHaveClass(/text-card-foreground/);
    await expect(statsCard).toHaveClass(/shadow/);
    await expect(statsCard).not.toHaveClass(/bg-card/);
    await expect(statsCard).not.toHaveClass(/rounded-xl/);
  });

  test("selected day card is highlighted (not today)", async ({ page }) => {
    // Reference: the card highlight follows the SELECTED day
    // (bg-sky-50 border-sky-200) — there is no today highlight (P-2).
    // Monday is never the clicked day here, so it must stay unhighlighted
    // on every run date (pre-fix, Monday-as-today or Sunday-as-today was
    // highlighted instead of the selection).
    await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();
    await page.locator("button.p-4", { hasText: "Wed" }).first().click();
    const wed = page.locator("button.p-4", { hasText: "Wed" }).first();
    await expect(wed).toHaveClass(/bg-sky-50/);
    await expect(wed).toHaveClass(/border-sky-200/);
    const mon = page.locator("button.p-4", { hasText: "Mon" }).first();
    await expect(mon).not.toHaveClass(/bg-sky-50/);
  });

  test("chip clicks select the day and never open the edit dialog", async ({ page }) => {
    // Reference chips are display-only divs: a chip click bubbles to the
    // day card and selects that day (P-5) — the session-1 FS-7
    // chip-interception class of flake is now structurally impossible.
    await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();
    await page.locator("button.p-4", { hasText: "Mon" }).first().getByText("Team standup").click();
    await expect(page.locator(DAY_TITLE).filter({ hasText: /Monday/ })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("selected-day task items are display-only (no action buttons)", async ({ page }) => {
    // Reference task items: title, priority, description, category badge,
    // HH:mm — no Mark-done/Edit buttons, no duration text (P-6). Editing
    // happens exclusively from the Dashboard calendar task blocks.
    await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();
    await page.locator("button.p-4", { hasText: "Mon" }).first().click();
    await expect(page.locator(DAY_TITLE).filter({ hasText: /Monday/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark done" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Edit", exact: true })).toHaveCount(0);
  });

  test("Filter button is decorative", async ({ page }) => {
    // Reference: an outline button labeled "Filter" with NO onClick (P-4)
    // — no filter cycling, no label change.
    await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();
    const filter = page.getByRole("button", { name: "Filter", exact: true });
    await expect(filter).toBeVisible();
    // The reference's icon carries mr-2 on top of the button's gap-2 (P-5,
    // session 6: measured 100.7px vs the clone's 89.1px without it).
    await expect(filter.locator("svg")).toHaveClass(/mr-2/);
    await filter.click();
    await expect(page.getByText(/Filter: (all|scheduled|unscheduled)/)).toHaveCount(0);
    // Nothing filtered away — the seeded chips are all still there.
    await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();
    await expect(page.locator("div", { hasText: "Gym session" }).first()).toBeVisible();
  });

  test("header buttons match the reference's icon margins and hover classes (P-5/P-6)", async ({ page }) => {
    // Reference (decompiled): both header icons carry w-4 h-4 mr-2, and the
    // Add Task button ships NO gradient hover shift and NO text-white (the
    // default variant's text-primary-foreground styles it).
    await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();
    const add = page.getByRole("button", { name: "Add Task", exact: true }).first();
    await expect(add).toBeVisible();
    await expect(add.locator("svg")).toHaveClass(/mr-2/);
    await expect(add).not.toHaveClass(/hover:from-sky-600/);
    await expect(add).not.toHaveClass(/text-white/);
    await expect(add).toHaveClass(/text-primary-foreground/);
  });
});
