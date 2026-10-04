import { expect, test } from "@playwright/test";

// Dashboard surface (authenticated): the weekly calendar, quick actions,
// skills map, status card, and the AI-backed sidebar cards. The seed
// guarantees ≥ 8 sample tasks in the current week, so the calendar rows
// and the skills pie are exercised with real data.
//
// The Quick Action specs pin the reference's DECOMPILED open-panel behavior
// (session 3, Q-1…Q-7: container gradient morph + header replacement,
// placeholder-only quick-add with a slate-700 submit, minutes input hidden
// while the timer runs, read-only Log Activity history, and the
// create/edit/confirm-delete Brainstorm note flow).

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

  test("quick actions render the four tiles with the reference geometry", async ({ page }) => {
    for (const label of ["Add New Task", "Start Focus Timer", "Log Activity", "Quick Brainstorm"]) {
      await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
    }
    // Reference tile/grid geometry (decompiled G1e buttons-view, Q-3).
    const tile = await page
      .getByRole("button", { name: "Start Focus Timer", exact: true })
      .evaluate((el) => ({
        tile: el.className,
        grid: el.parentElement?.className ?? "",
        span: el.querySelector("span")?.className ?? "",
        svg: el.querySelector("svg")?.getAttribute("class") ?? "",
        h3: el.closest("div")?.parentElement?.querySelector("h3")?.className ?? "",
      }));
    expect(tile.tile).toContain("h-24");
    expect(tile.tile).toContain("rounded-2xl");
    expect(tile.tile).toContain("p-3");
    expect(tile.tile).toContain("shadow-lg");
    expect(tile.grid).toContain("gap-3");
    expect(tile.span).toContain("text-[11px]");
    expect(tile.svg).toContain("w-5 h-5 mb-1.5");
    expect(tile.h3).toContain("mb-3");
  });

  test("opening a quick action panel replaces the tiles view", async ({ page }) => {
    await page.getByRole("button", { name: "Log Activity", exact: true }).click();
    // The "Quick Actions" heading exists only in the tiles view (Q-2).
    await expect(page.getByRole("heading", { name: "Quick Actions" })).toBeHidden();
    await expect(page.getByRole("heading", { name: "Log Activity", exact: true })).toBeVisible();
    // The card itself becomes the action's gradient (container morph, Q-1).
    const bg = await page.evaluate(() => {
      const h = [...document.querySelectorAll("h3")].find(
        (x) => x.textContent === "Log Activity",
      );
      const card = h?.closest(".backdrop-blur-xl");
      return card ? getComputedStyle(card).backgroundImage : "none";
    });
    expect(bg).toContain("linear-gradient");
    expect(bg).toContain("rgb(139, 92, 246)"); // #8b5cf6 (logActivity)
    expect(bg).toContain("rgb(99, 102, 241)"); // #6366f1
    // The back button returns to the tiles view with the heading restored.
    await page.getByRole("button", { name: "Back to Quick Actions" }).click();
    await expect(page.getByRole("heading", { name: "Quick Actions" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Log Activity", exact: true })).toBeVisible();
  });

  test("Add New Task panel creates a task", async ({ page }) => {
    await page.getByRole("button", { name: "Add New Task", exact: true }).click();
    const input = page.getByPlaceholder("Task Title...");
    await expect(input).toBeVisible();
    // Reference: placeholder-only input — there is no visible label (Q-4).
    await expect(page.getByText("Task Title", { exact: true })).toHaveCount(0);
    // Reference submit style: bg-slate-700, not a blue gradient (Q-4).
    const addClass = await page
      .getByRole("button", { name: "Add", exact: true })
      .getAttribute("class");
    expect(addClass).toContain("bg-slate-700");
    expect(addClass).not.toContain("from-sky-500");
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
    await expect(page.getByPlaceholder("Task Title...")).toBeHidden();
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
    const minutes = page.getByLabel("Timer minutes");
    await expect(minutes).toBeVisible();
    await page.getByRole("button", { name: "Start timer" }).click();
    await expect(page.getByText("24:5", { exact: false }).first()).toBeVisible({ timeout: 15_000 });
    // The reference hides the minutes input while the timer runs (Q-5).
    await expect(minutes).toBeHidden();
    // The running toggle shows the PAUSE icon (Q-5 — Play stopped / Pause running).
    const runningIcon = await page
      .getByRole("button", { name: "Pause timer" })
      .locator("svg")
      .getAttribute("class");
    expect(runningIcon).toContain("lucide-pause");
    // The reset button is the reference's neutral outline variant (Q-5).
    const resetClass = await page
      .getByRole("button", { name: "Reset timer" })
      .getAttribute("class");
    expect(resetClass).toContain("border-slate-300");
    expect(resetClass).toContain("text-slate-600");
    const closeClass = await page
      .getByRole("button", { name: "Close Timer" })
      .getAttribute("class");
    expect(closeClass).toContain("mt-2");
    await page.getByRole("button", { name: "Close Timer" }).click();
    await expect(page.getByRole("heading", { name: "Start Focus Timer" })).toBeHidden();
  });

  test("Focus Timer disables the start control at zero minutes", async ({ page }) => {
    await page.getByRole("button", { name: "Start Focus Timer", exact: true }).click();
    // Emptying the minutes field sets 0 (the reference's parse rule).
    await page.getByLabel("Timer minutes").fill("");
    await expect(page.getByText("00:00")).toBeVisible();
    // The reference disables the toggle at minutes=0 (W1e's
    // disabled:minutes<=0&&!running — its "Please set a valid duration."
    // alert guard is unreachable dead code, mirrored faithfully). The
    // disabled control is the visible contract.
    await expect(page.getByRole("button", { name: "Start timer" })).toBeDisabled();
    // The completion alert itself ("Focus session complete!") was verified
    // by a one-off Playwright run (session-3 evidence; too slow for the
    // suite at ~65s).
  });

  test("Log Activity shows the reference's read-only history", async ({ page }) => {
    // Converging cleanup: crashed earlier runs leave residue (FS-9).
    const residue = await (await page.request.get("/api/tasks")).json();
    for (const t of (residue?.data?.tasks ?? []) as { id: string; title: string }[]) {
      if (t.title === "E2E log activity task") await page.request.delete(`/api/tasks/${t.id}`);
    }
    // Seed a completed task with a recent end_time via the API so the
    // panel's top-5 (end_time desc) list shows it deterministically.
    const start = new Date(Date.now() - 5 * 60_000).toISOString();
    const created = await (
      await page.request.post("/api/tasks", {
        data: {
          title: "E2E log activity task",
          start_time: start,
          duration_minutes: 2,
          status: "completed",
        },
      })
    ).json();
    const id = created?.data?.task?.id;
    expect(id).toBeTruthy();

    await page.getByRole("button", { name: "Log Activity", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Recently Completed / Past" })).toBeVisible();
    // The panel items are paragraphs (the same text also lands on today's
    // calendar as a task block — scope to the paragraph).
    const item = page.getByRole("paragraph").filter({ hasText: "E2E log activity task" });
    await expect(item).toBeVisible();
    // Item meta: "Completed"/"Ended" + relative end_time (Q-6).
    await expect(page.getByText(/Completed|Ended/).first()).toBeVisible();
    // Read-only history — the reference has no per-item Done button (Q-6).
    await expect(page.getByRole("button", { name: "Done", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Log Activity", exact: true })).toBeHidden();
    await page.request.delete(`/api/tasks/${id}`);
  });

  test("Brainstorm panel supports create, edit, and confirm-delete", async ({ page }) => {
    // Converging cleanup: remove residue from crashed earlier runs.
    const residue = await (await page.request.get("/api/notes")).json();
    for (const n of (residue?.data?.notes ?? []) as { id: string; content: string }[]) {
      if (n.content.startsWith("E2E QA note")) await page.request.delete(`/api/notes/${n.id}`);
    }

    await page.getByRole("button", { name: "Quick Brainstorm", exact: true }).click();
    await expect(page.getByRole("heading", { name: "My Notes" })).toBeVisible();

    // Create (content > 30 chars so the list truncates it, Q-7).
    // NOTE: match the list PARAGRAPH, not getByText — the still-mounted
    // create-view textarea carries the full text as its default-value text
    // node and would match first (suite-load timing made this real).
    await page.getByRole("button", { name: "New Note" }).click();
    await page.getByPlaceholder("Your note...").fill("E2E QA note: first draft that is long");
    await page.getByRole("button", { name: "Save Note" }).click();
    const preview = page.getByRole("paragraph").filter({ hasText: /E2E QA note: first/ });
    await expect(preview).toBeVisible();
    // The preview is TRUNCATED: it starts with the note but never shows the
    // full tail, and carries an ellipsis (the reference's 30-char preview).
    const previewText = (await preview.textContent()) ?? "";
    expect(previewText.startsWith("E2E QA note: first")).toBe(true);
    expect(previewText).not.toContain("is long");
    expect(previewText).toContain("...");

    // Open the truncated preview → the textarea is prefilled → edit → Update.
    await preview.click();
    const area = page.getByPlaceholder("Your note...");
    await expect(area).toHaveValue("E2E QA note: first draft that is long");
    await area.fill("E2E QA note: second draft that is long");
    await page.getByRole("button", { name: "Update Note" }).click();
    const updated = page.getByRole("paragraph").filter({ hasText: /E2E QA note: second/ });
    await expect(updated).toBeVisible();

    // Delete via the trash icon behind a confirm dialog (Q-7).
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete note" }).first().click();
    await expect(
      page.getByRole("paragraph").filter({ hasText: /E2E QA note: second/ }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Close Notes" }).click();
    await expect(page.getByRole("heading", { name: "Quick Brainstorm", exact: true })).toBeHidden();

    // Final converging cleanup.
    const final = await (await page.request.get("/api/notes")).json();
    for (const n of (final?.data?.notes ?? []) as { id: string; content: string }[]) {
      if (n.content.startsWith("E2E QA note")) await page.request.delete(`/api/notes/${n.id}`);
    }
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
