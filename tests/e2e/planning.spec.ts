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

  test("day cards are the reference's clickable divs, not buttons (session 9, F-2)", async ({ page }) => {
    // Live-measured on the reference (2026-10-05, agent-browser outerHTML):
    //   <div class="p-4 rounded-2xl border cursor-pointer transition-all
    //    duration-200 bg-white/50 border-slate-200 hover:bg-slate-50">
    // …onclick, NO role/tabindex/aria, cursor:pointer, text-align:start.
    // The clone had rendered a <button … text-left …> (the last remaining
    // class-tree divergence, sessions 7–8) — this spec pins the div form.
    await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();

    // Seven day cards, in the reference's div shape.
    const dayCards = page.locator("main div.p-4.cursor-pointer.rounded-2xl");
    await expect(dayCards).toHaveCount(7);

    // ZERO button day-cards remain (the converted form must not regress).
    await expect(page.locator("main button.p-4")).toHaveCount(0);

    // The card class list matches the reference's EXACT shape: the base
    // string, no text-left compensation, the hover + transition utilities.
    const mon = dayCards.filter({ hasText: "Mon" }).first();
    await expect(mon).toHaveClass(/^p-4 rounded-2xl border cursor-pointer transition-all duration-200 /);
    await expect(mon).not.toHaveClass(/text-left/);
    await expect(mon).toHaveClass(/hover:bg-slate-50|bg-sky-50 border-sky-200/);

    // A11y-tree parity: the reference's day card is a generic (no button
    // role, not focusable) — the div conversion must not add a role.
    await expect(mon).not.toHaveAttribute("role");
    await expect(mon).not.toHaveAttribute("tabindex");
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

    // Session 12 (W-3/W-4) request-contract interception: the reference's
    // dialog submits end_time CLIENT-COMPUTED (its decompiled f function:
    // end = start + duration*60000) and description VERBATIM ("" stays "",
    // captured on the live wire). The POST body is pinned here.
    const posts: Record<string, unknown>[] = [];
    await page.route("/api/tasks", async (route) => {
      if (route.request().method() === "POST") {
        posts.push(route.request().postDataJSON() as Record<string, unknown>);
      }
      await route.continue();
    });

    await page.getByRole("button", { name: "Add Task" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Task Title").fill("E2E planned task");
    // Description left EMPTY on purpose — the W-4 pin: it must ship "".
    await dialog.locator("#start_time").fill(isoLocal);
    await dialog.locator("#duration").fill("45");
    // The reference's submit label is "Create Task" (decompiled r?"Update":
    // "Create" + " Task" — session 6, P-2), with a Save icon (P-3).
    const submit = dialog.getByRole("button", { name: "Create Task", exact: true });
    await expect(submit).toBeVisible();
    await expect(submit.locator("svg")).toHaveClass(/mr-2/);
    await submit.click();
    await expect(dialog).toBeHidden();

    // W-3/W-4: the intercepted request ships end_time (start + 45 min) and
    // the description verbatim as "".
    expect(posts.length).toBeGreaterThanOrEqual(1);
    const body = posts[posts.length - 1];
    expect(body.description).toBe("");
    expect(typeof body.end_time).toBe("string");
    expect(new Date(body.end_time as string).getTime()).toBe(
      new Date(isoLocal).getTime() + 45 * 60_000,
    );

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
    await page.locator("div.p-4.cursor-pointer", { hasText: "Wed" }).first().locator("div.text-center").first().click();
    await expect(page.locator(DAY_TITLE).filter({ hasText: /Wednesday/ })).toBeVisible();
  });

  test("day statistics shows the reference's static placeholder", async ({ page }) => {
    // Reference decompile: the Day Statistics card's ONLY content is the
    // static placeholder — there is no data branch (P-7). Select Monday
    // explicitly (Monday carries 3 seeded tasks — the strongest
    // temptation for a data branch to appear).
    await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();
    const mondayCard = page.locator("div.p-4.cursor-pointer", { hasText: "Mon" }).first();
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
    await page.locator("div.p-4.cursor-pointer", { hasText: "Mon" }).first().click();
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
    await page.locator("div.p-4.cursor-pointer", { hasText: "Wed" }).first().click();
    const wed = page.locator("div.p-4.cursor-pointer", { hasText: "Wed" }).first();
    await expect(wed).toHaveClass(/bg-sky-50/);
    await expect(wed).toHaveClass(/border-sky-200/);
    const mon = page.locator("div.p-4.cursor-pointer", { hasText: "Mon" }).first();
    await expect(mon).not.toHaveClass(/bg-sky-50/);
  });

  test("chip clicks select the day and never open the edit dialog", async ({ page }) => {
    // Reference chips are display-only divs: a chip click bubbles to the
    // day card and selects that day (P-5) — the session-1 FS-7
    // chip-interception class of flake is now structurally impossible.
    await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();
    await page.locator("div.p-4.cursor-pointer", { hasText: "Mon" }).first().getByText("Team standup").click();
    await expect(page.locator(DAY_TITLE).filter({ hasText: /Monday/ })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("selected-day task items are display-only (no action buttons)", async ({ page }) => {
    // Reference task items: title, priority, description, category badge,
    // HH:mm — no Mark-done/Edit buttons, no duration text (P-6). Editing
    // happens exclusively from the Dashboard calendar task blocks.
    await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();
    await page.locator("div.p-4.cursor-pointer", { hasText: "Mon" }).first().click();
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

  test("chips and selected-day list follow the reference's createdAt-desc order (G-1)", async ({ page }) => {
    // The reference's default fn.Task.list() returns tasks createdAt DESC
    // (newest first — live-verified on the reference: creating tasks in
    // order Alpha→Beta→Gamma→Delta yields [Delta, Gamma, Beta, Alpha]).
    // The clone's API must match, because the day-card chips (slice(0,3))
    // and the selected-day task list render the array AS RETURNED.
    // alpha: created FIRST, starts EARLIER (09:00); beta: created LAST,
    // starts LATER (15:00) — startTime-asc would order [alpha, beta],
    // createdAt-desc orders [beta, alpha].
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const d = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const dayName = today.toLocaleDateString("en-US", { weekday: "short" });
    // Converging cleanup FIRST: a RED-phase run of this very spec fails
    // before its own tail cleanup, leaving residue that would duplicate
    // the h4 titles below (the suite's FS-9 discipline).
    const residue0 = await (await page.request.get("/api/tasks")).json();
    for (const t of (residue0?.data?.tasks ?? []) as { id: string; title: string }[]) {
      if (t.title.startsWith("E2E order")) await page.request.delete(`/api/tasks/${t.id}`);
    }
    for (const t of [
      { title: "E2E order alpha", start: "09:00", category: "work", priority: "low" },
      { title: "E2E order beta", start: "15:00", category: "personal", priority: "high" },
    ]) {
      await page.request.post("/api/tasks", {
        data: {
          title: t.title,
          start_time: `${d}T${t.start}`,
          duration_minutes: 30,
          category: t.category,
          priority: t.priority,
        },
      });
    }
    await page.goto("/Planning");

    // Day-card chips: beta (created last) renders BEFORE alpha. Wait for
    // the store's fetch to land first (allTextContents has no auto-wait —
    // reading before the chips render is a real race).
    const dayCard = page.locator("div.p-4.cursor-pointer", { hasText: dayName }).first();
    await expect(dayCard).toBeVisible();
    await expect(dayCard.getByText("E2E order beta")).toBeVisible();
    const chips = await dayCard.locator("div.font-medium").allTextContents();
    expect(chips.indexOf("E2E order beta")).toBeGreaterThanOrEqual(0);
    expect(chips.indexOf("E2E order alpha")).toBeGreaterThanOrEqual(0);
    expect(chips.indexOf("E2E order beta")).toBeLessThan(chips.indexOf("E2E order alpha"));

    // Selected-day task list: same order (the h4 titles inside the
    // selected-day Card's space-y-3 list).
    await dayCard.click();
    await expect(page.locator("main div.space-y-3 h4", { hasText: "E2E order beta" })).toBeVisible();
    const titles = await page.locator("main div.space-y-3 h4").allTextContents();
    const list = titles.filter((t) => t === "E2E order alpha" || t === "E2E order beta");
    expect(list).toEqual(["E2E order beta", "E2E order alpha"]);

    // Cleanup: delete EVERY match (crashed-run residue converges).
    const list2 = await (await page.request.get("/api/tasks")).json();
    const residue = (list2?.data?.tasks ?? []).filter((t: { title: string }) =>
      t.title.startsWith("E2E order"),
    );
    for (const t of residue) await page.request.delete(`/api/tasks/${t.id}`);
  });

  test("category badges are the reference's classic div badge (G-4)", async ({ page }) => {
    // The reference's Badge (Z1e/W$ in its bundle) is the CLASSIC shadcn
    // form: a <div> with focus:ring-2 focus:ring-ring focus:ring-offset-2
    // in the base; the secondary variant carries hover:bg-secondary/80
    // (day-card chips) and the default variant carries shadow
    // hover:bg-primary/80 (selected-day task items). The modern shadcn
    // span form the clone shipped renders SPAN without those classes.
    await expect(page.locator("div", { hasText: "Team standup" }).first()).toBeVisible();
    const mon = page.locator("div.p-4.cursor-pointer", { hasText: "Mon" }).first();
    await mon.click();

    // Day-card chip badge (variant="secondary").
    const chipBadge = mon.locator("[class*=inline-flex][class*=rounded-md]").first();
    const chipInfo = await chipBadge.evaluate((el) => ({ tag: el.tagName, cls: el.className }));
    expect(chipInfo.tag).toBe("DIV");
    expect(chipInfo.cls).toContain("focus:ring-2");
    expect(chipInfo.cls).toContain("focus:ring-ring");
    expect(chipInfo.cls).toContain("focus:ring-offset-2");
    expect(chipInfo.cls).toContain("hover:bg-secondary/80");

    // Selected-day task-item badge (default variant). The task items are
    // DIVs like the day cards now (session 9, F-2 converted the day cards
    // from buttons to the reference's divs) — the discriminator is the
    // day-cards' cursor-pointer class (task items are display-only and
    // carry none).
    const itemBadge = page
      .locator(
        'main div[class*="bg-white/50"][class*="rounded-2xl"]:not([class*="cursor-pointer"])',
      )
      .first()
      .locator("[class*=inline-flex][class*=rounded-md]")
      .first();
    const itemInfo = await itemBadge.evaluate((el) => ({ tag: el.tagName, cls: el.className }));
    expect(itemInfo.tag).toBe("DIV");
    expect(itemInfo.cls).toContain("focus:ring-2");
    expect(itemInfo.cls).toContain("focus:ring-ring");
    expect(itemInfo.cls).toContain("focus:ring-offset-2");
    expect(itemInfo.cls).toContain("shadow");
    expect(itemInfo.cls).toContain("hover:bg-primary/80");
  });
});
