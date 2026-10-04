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

  test("Log Activity relative times use the reference's strict formatter (F-2)", async ({ page }) => {
    // Converging cleanup: crashed earlier runs leave residue (FS-9).
    const residue = await (await page.request.get("/api/tasks")).json();
    for (const t of (residue?.data?.tasks ?? []) as { id: string; title: string }[]) {
      if (t.title === "E2E strict time task") await page.request.delete(`/api/tasks/${t.id}`);
    }
    // A task whose end_time is exactly 3h in the past: the reference calls
    // date-fns formatDistanceToNowStrict (live bundle decompile, session 10
    // F-2) which renders "3 hours ago" — the non-strict formatDistanceToNow
    // renders "about 3 hours ago". The 3h distance is drift-stable for both
    // formatters (±seconds of test time cannot leave either band).
    const start = new Date(Date.now() - 182 * 60_000).toISOString();
    const created = await (
      await page.request.post("/api/tasks", {
        data: {
          title: "E2E strict time task",
          start_time: start,
          duration_minutes: 2,
          status: "todo",
        },
      })
    ).json();
    const id = created?.data?.task?.id;
    expect(id).toBeTruthy();

    await page.getByRole("button", { name: "Log Activity", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Recently Completed / Past" })).toBeVisible();
    const panel = page.locator("div.max-h-80");
    await expect(panel.getByText(/3 hours ago/)).toBeVisible();
    // The item meta must read "Ended 3 hours ago" — the strict form.
    await expect(panel.getByText(/Ended 3 hours ago/)).toBeVisible();
    // The strict formatter NEVER emits the non-strict "about" softener.
    await expect(panel.getByText(/about/)).toHaveCount(0);
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.request.delete(`/api/tasks/${id}`);
  });

  test("Log Activity caps the history at the top-5 by end_time desc (>5 items, G-1)", async ({ page }) => {
    // Session 11, G-1: the slice + sort only ever executed with ONE seeded
    // item in CI before this spec. Live-diffed on both apps with 7
    // qualifying items (session 11): the panel renders exactly the top-5 by
    // end_time desc and CUTS the rest — including cross-week items.
    const FAMILY = "E2E top5 slice task";
    // Converging cleanup: crashed earlier runs leave residue (FS-9).
    const residue = await (await page.request.get("/api/tasks")).json();
    for (const t of (residue?.data?.tasks ?? []) as { id: string; title: string }[]) {
      if (t.title.startsWith(FAMILY)) await page.request.delete(`/api/tasks/${t.id}`);
    }
    // Seed SEVEN qualifying tasks (status completed OR end_time past — the
    // H1e filter, decompile-verified session 11: d.status==="completed" ||
    // d.end_time && Wc(d.end_time) < now). End_times (minutes from now):
    //   1: +2400 (completed, FUTURE end — the C-class case, sorts FIRST)
    //   2:  -360 · 3: -1800 · 4: -3240 · 5: -4680   (past, spread by ~1 day)
    //   6:  -6480 (4.5 d past — must be CUT)  ·  7: -17280 (12 d, cross-week — CUT)
    // Distances are hours away from any formatter rounding boundary (P-1
    // session 11): +2400 m renders "in 2 days" (40 h → Math.round(1.67)=2;
    // the boundary sits at 1.5 d) with ±minutes of test drift.
    const offsets = [
      { n: 1, min: 2400, completed: true },
      { n: 2, min: -360, completed: false },
      { n: 3, min: -1800, completed: false },
      { n: 4, min: -3240, completed: false },
      { n: 5, min: -4680, completed: false },
      { n: 6, min: -6480, completed: false },
      { n: 7, min: -17280, completed: false },
    ];
    const createdIds: string[] = [];
    for (const o of offsets) {
      const start = new Date(Date.now() + (o.min - 30) * 60_000).toISOString();
      const res = await (
        await page.request.post("/api/tasks", {
          data: {
            title: `${FAMILY} ${o.n}`,
            start_time: start,
            duration_minutes: 30,
            status: "todo",
          },
        })
      ).json();
      const id = res?.data?.task?.id;
      expect(id).toBeTruthy();
      createdIds.push(id);
      if (o.completed) {
        await page.request.patch(`/api/tasks/${id}`, { data: { status: "completed" } });
      }
    }

    await page.getByRole("button", { name: "Log Activity", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Recently Completed / Past" })).toBeVisible();
    const panel = page.locator("div.max-h-80");
    // Wait past the panel's refresh ("Loading history..." until ready).
    await expect(panel.getByText(`${FAMILY} 1`)).toBeVisible();

    // Exactly FIVE item rows render (the reference's .slice(0,5)).
    const rows = panel.locator("div.p-2\\.5");
    await expect(rows).toHaveCount(5);

    // The DOM order IS the end_time-desc order: 1 (future completed) first,
    // then the increasingly-older past tasks.
    const titles = await panel.locator("p.text-sm.font-medium").allTextContents();
    expect(titles).toEqual([
      `${FAMILY} 1`,
      `${FAMILY} 2`,
      `${FAMILY} 3`,
      `${FAMILY} 4`,
      `${FAMILY} 5`,
    ]);

    // The 6th (4.5 d old) and 7th (12 d, cross-week) are CUT — scoped to
    // the panel: both tasks also render as calendar blocks on the page
    // (the 6th inside this week's grid), so page-level negation would
    // false-fail.
    await expect(panel.getByText(`${FAMILY} 6`)).toHaveCount(0);
    await expect(panel.getByText(`${FAMILY} 7`)).toHaveCount(0);

    // The completed-with-future-end item keeps its Completed label and the
    // band-stable strict relative time (live: "Completed in 2 days").
    await expect(panel.getByText("Completed in 2 days")).toBeVisible();

    await page.getByRole("button", { name: "Close", exact: true }).click();
    for (const id of createdIds) await page.request.delete(`/api/tasks/${id}`);
  });

  test("no data-slot attributes on the rendered surfaces (F-1)", async ({ page }) => {
    // The reference's DOM never carries data-slot (attribute-inventory
    // diff, session 10 F-1): the shadcn generator marker is invisible to
    // the class-tree diffs (they extract only class), so it is pinned by
    // attribute count instead — on the idle dashboard (6 pre-fix) AND on
    // the open TaskDialog (the heaviest surface, 24 pre-fix).
    await expect(page.locator("[data-slot]")).toHaveCount(0);
    await page
      .getByRole("button", { name: /^Add task on Tue .* at 10:00$/ })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.locator("[data-slot]")).toHaveCount(0);
    // Same evidence class, same pin: the reference's title input carries
    // NO maxlength (live-verified on its open dialog — F-3); the clone's
    // 300-char write guard lives server-side, invisible to the UI surface.
    await expect(dialog.locator("#title")).not.toHaveAttribute("maxlength");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
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

    // G-2 (session 11): the EMPTY-content save is a no-op on both apps
    // (live-verified: the create view stays mounted, nothing is created —
    // the K1e guard `if (!content.trim()) return`).
    await page.getByRole("button", { name: "New Note" }).click();
    const emptyArea = page.getByPlaceholder("Your note...");
    await expect(emptyArea).toHaveValue("");
    await page.getByRole("button", { name: "Save Note" }).click();
    // Still in the create view — a non-no-op would flip back to the list and
    // unmount the textarea.
    await expect(emptyArea).toBeVisible();
    // Back on the list, the note count is UNCHANGED (an empty save created
    // nothing). The list itself is unmounted while the create view is open,
    // so the count must be asserted from the list view.
    await page.getByRole("button", { name: "← Back to List" }).click();
    await expect(
      page.getByRole("paragraph").filter({ hasText: /E2E QA note/ }),
    ).toHaveCount(1);

    // G-3 (session 11): the multi-note list is NEWEST-FIRST on both apps
    // (live-verified: the reference's createdAt-desc list = the clone's
    // store prepend). Create a second note — the note created LAST must
    // render FIRST. The seed's own sample notes stay in the list, so the
    // order is asserted WITHIN the E2E family (DOM positions).
    await page.getByRole("button", { name: "New Note" }).click();
    await page.getByPlaceholder("Your note...").fill("E2E QA note: created second note");
    await page.getByRole("button", { name: "Save Note" }).click();
    await expect(
      page.locator("div.max-h-80 p.truncate").filter({ hasText: /E2E QA note/ }),
    ).toHaveCount(2);
    const domOrder = await page.evaluate(() =>
      [...document.querySelectorAll("div.max-h-80 p.truncate")].map((p) => p.textContent ?? ""),
    );
    const newestIdx = domOrder.findIndex((t) => t.includes("created second"));
    const olderIdx = domOrder.findIndex((t) => t.includes("second draft"));
    expect(newestIdx).toBeGreaterThanOrEqual(0);
    expect(olderIdx).toBeGreaterThan(newestIdx); // newest renders FIRST

    // Delete via the trash icon behind a confirm dialog (Q-7) — the newest
    // first, then the survivor; the E2E family ends fully cleared.
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete note" }).first().click();
    await expect(
      page.getByRole("paragraph").filter({ hasText: /E2E QA note: created second/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("paragraph").filter({ hasText: /E2E QA note: second draft/ }),
    ).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete note" }).first().click();
    await expect(page.getByRole("paragraph").filter({ hasText: /E2E QA note/ })).toHaveCount(0);

    await page.getByRole("button", { name: "Close Notes" }).click();
    await expect(page.getByRole("heading", { name: "Quick Brainstorm", exact: true })).toBeHidden();

    // Final converging cleanup.
    const final = await (await page.request.get("/api/notes")).json();
    for (const n of (final?.data?.notes ?? []) as { id: string; content: string }[]) {
      if (n.content.startsWith("E2E QA note")) await page.request.delete(`/api/notes/${n.id}`);
    }
  });

  test("sidebar cards render (status, daily focus, AI summary)", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Daily Focus", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "AI Summary", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Skills Map", exact: true })).toBeVisible();
    // The status card is in whichever state the run time dictates
    // (seeded week → Next Up or All caught up).
    await expect(page.getByRole("heading", { name: /Next Up|All caught up/ })).toBeVisible();
    // Daily Focus resolves (LLM or deterministic fallback — both valid).
    await expect(page.getByText(/- .+/)).toBeVisible();

    // --- Daily Focus structure (decompiled Y1e, session 4, F-2/F-3) ---
    // Vertical blocks: icon above, text below — quote p is text-lg italic.
    const df = await page.evaluate(() => {
      const h3 = [...document.querySelectorAll("h3")].find(
        (x) => x.textContent === "Daily Focus",
      );
      const card = h3?.closest("div[class*=bg-gradient]");
      const ps = card ? [...card.querySelectorAll("p")] : [];
      return {
        quote: ps[0]?.className ?? "",
        author: ps[1]?.className ?? "",
        affirmation: ps[2]?.className ?? "",
        affirmationIcon: ps[2]?.previousElementSibling?.getAttribute("class") ?? "",
        quoteIcon: ps[0]?.previousElementSibling?.getAttribute("class") ?? "",
      };
    });
    expect(df.quote).toContain("text-lg");
    expect(df.quote).toContain("italic");
    expect(df.author).toContain("text-sm");
    expect(df.author).toContain("opacity-80");
    expect(df.affirmation).toBe("font-medium");
    expect(df.affirmationIcon).toContain("lucide-target");
    expect(df.quoteIcon).toContain("lucide-lightbulb");

    // --- AI Summary structure (decompiled fre, session 4, A-1..A-5) ---
    // The "AI Summary" h3 exists in the skeleton too — gate on the loaded
    // state (the mood gradient block only renders with data).
    await page.waitForFunction(() => !!document.querySelector("main div[class*=from-purple-50]"));
    const ai = await page.evaluate(() => {
      const h3 = [...document.querySelectorAll("h3")].find(
        (x) => x.textContent === "AI Summary",
      );
      const card = h3?.closest("div[class*=bg-white]");
      const headerIcons = h3?.parentElement
        ? [...h3.parentElement.querySelectorAll("svg")].map((s) => s.getAttribute("class") ?? "")
        : [];
      return {
        headerIcons,
        mood: card?.querySelector("div[class*=from-purple]")?.className ?? "",
        moodP: [...(card?.querySelectorAll("p") ?? [])].map((p) => p.className),
        insights: card?.querySelector("div[class*=max-h-]")?.className ?? "",
      };
    });
    // Header: Brain icon + a Sparkles live indicator (A-1).
    expect(ai.headerIcons.join(" ")).toContain("lucide-brain");
    expect(ai.headerIcons.join(" ")).toContain("lucide-sparkles");
    expect(ai.headerIcons.join(" ")).toContain("w-3 h-3 text-yellow-500");
    // Mood block: the reference's purple→pink gradient (A-2).
    expect(ai.mood).toContain("from-purple-50");
    expect(ai.mood).toContain("to-pink-50");
    expect(ai.moodP.join(" ")).toContain("text-purple-800");
    // Insights: max-h-20 (A-5).
    expect(ai.insights).toContain("max-h-20");
    // Chips: the reference's blue-100 / green-100 (A-3/A-4).
    const chipClasses = await page.evaluate(() =>
      [...document.querySelectorAll("main span")]
        .filter((s) => s.className.includes("bg-blue-100") || s.className.includes("bg-green-100"))
        .map((s) => s.className),
    );
    expect(chipClasses.length).toBeGreaterThanOrEqual(2);
  });

  test("skills map matches the reference's data state (g0e)", async ({ page }) => {
    // Converging cleanup: wipe ALL E2E residue — a failed spec anywhere in
    // the suite leaves tasks that cascade into this one (the planning
    // top-3 chips and the Next Up selection are both residue-sensitive).
    const residue = await (await page.request.get("/api/tasks")).json();
    for (const t of (residue?.data?.tasks ?? []) as { id: string; title: string }[]) {
      if (t.title.startsWith("E2E ")) await page.request.delete(`/api/tasks/${t.id}`);
    }
    // Guarantee today's pie has data regardless of run day (the seed covers
    // all days EXCEPT Saturday — offset 5 has no tasks).
    const created = await (
      await page.request.post("/api/tasks", {
        data: {
          title: "E2E skills map task",
          start_time: new Date(Date.now() + 5 * 60_000).toISOString(),
          duration_minutes: 45,
          category: "health",
        },
      })
    ).json();
    const id = created?.data?.task?.id;
    expect(id).toBeTruthy();
    await page.reload();
    // The reload re-bootstraps the store (skeleton first) — wait for the
    // loaded data state (the Award indicator only renders there).
    await page.waitForFunction(() => !!document.querySelector("main svg.lucide-award"));

    // Header carries the Award live indicator (K-2).
    const award = await page.evaluate(() => {
      const h3 = [...document.querySelectorAll("h3")].find(
        (x) => x.textContent === "Skills Map",
      );
      return h3?.parentElement
        ? [...h3.parentElement.querySelectorAll("svg")].map((s) => s.getAttribute("class") ?? "")
        : [];
    });
    expect(award.join(" ")).toContain("lucide-award");

    // Legend rows: left = capitalized slate-700 category, right =
    // percentage ONLY (K-4 — no hours suffix).
    const legend = await page.evaluate(() => {
      const h3 = [...document.querySelectorAll("h3")].find(
        (x) => x.textContent === "Skills Map",
      );
      const card = h3?.closest("div[class*=bg-white]");
      const rows = card ? [...card.querySelectorAll("div.flex.items-center.justify-between.text-sm")] : [];
      return rows.map((r) => ({
        left: r.querySelector("span")?.className ?? "",
        leftText: r.querySelector("span")?.textContent ?? "",
        // The right span is the row's only DIRECT span child (the left one
        // sits inside an inner wrapper where it is also a :last-child).
        right: r.querySelector(":scope > span")?.className ?? "",
        rightText: r.querySelector(":scope > span")?.textContent ?? "",
      }));
    });
    expect(legend.length).toBeGreaterThanOrEqual(1);
    for (const row of legend) {
      expect(row.left).toContain("text-slate-700");
      expect(row.left).toContain("capitalize");
      expect(row.right).toContain("font-medium");
      expect(row.right).toContain("text-slate-600");
      expect(row.rightText).toMatch(/^\d+%$/);
    }
    await page.request.delete(`/api/tasks/${id}`);
  });

  test("status card marks the next task complete (ure, S-1/S-4)", async ({ page }) => {
    // Converging cleanup: wipe ALL E2E residue (see the skills map spec).
    const residue = await (await page.request.get("/api/tasks")).json();
    for (const t of (residue?.data?.tasks ?? []) as { id: string; title: string }[]) {
      if (t.title.startsWith("E2E ")) await page.request.delete(`/api/tasks/${t.id}`);
    }
    // A task 5 minutes out is the earliest upcoming task in practice (the
    // only competing window is a seeded slot starting within the next 5
    // minutes of TODAY — ≈0.3% of run times; converges on retry).
    const start = new Date(Date.now() + 5 * 60_000).toISOString();
    const created = await (
      await page.request.post("/api/tasks", {
        data: {
          title: "E2E next up task",
          start_time: start,
          duration_minutes: 30,
          priority: "high",
          category: "work",
        },
      })
    ).json();
    const id = created?.data?.task?.id;
    expect(id).toBeTruthy();
    await page.reload();

    // The reference's rich Next Up card (S-1): heading, priority badge,
    // progress row, and the functional Mark Complete button.
    // Scope to the StatusCard via its heading — the task title ALSO lands
    // on the calendar as a task block (both apps render completed tasks on
    // the grid — no status filter, decompile-verified), so a bare
    // `div.rounded-3xl` + hasText locator matches BOTH cards and strict
    // mode fails whenever now+5min is inside the 07:00–22:00 grid (FS-16,
    // the time-of-day flake this run exposed).
    const card = page
      .locator("div.rounded-3xl")
      .filter({ has: page.getByRole("heading", { name: "Next Up", exact: true }) });
    await expect(page.getByRole("heading", { name: "Next Up", exact: true })).toBeVisible();
    await expect(card).toContainText("E2E next up task");
    const cardInfo = await card.evaluate((el) => ({
      outer: el.className,
      badge: el.querySelector("div[class*=rounded-2xl]")?.textContent ?? "",
      progress: el.querySelector("div.h-2 > div")?.className ?? "",
      ready: el.querySelector("span.text-xs")?.textContent ?? "",
    }));
    expect(cardInfo.outer).toContain("relative");
    expect(cardInfo.outer).toContain("overflow-hidden");
    expect(cardInfo.badge).toBe("high");
    expect(cardInfo.progress).toContain("from-sky-400");
    expect(cardInfo.ready).toBe("Ready");

    // Mark Complete is functional (S-4): PATCH → completed → the card
    // re-renders without the task (live-verified on the reference). The
    // completed task REMAINS on the calendar (no status filter) — assert
    // the STATUSCARD drops it, not the page (FS-16 corollary).
    // The post-click card can EITHER advance to another upcoming task
    // (heading stays "Next Up") OR fall to its "All caught up!" empty
    // state (the h3 CHANGES) — scope to the card either way. A "Next Up"-
    // only filter makes the locator VANISH on the empty-state transition
    // and the negated assertion fails with "element(s) not found" (a
    // state-transition flake that only bites when no future task remains
    // — on Sundays after the 10:00 seed slot, or any run after the day's
    // last seeded task has started; sessions 4–6 passed only because
    // their runs predated the day's last seed slot).
    const statusCard = page.locator("div.rounded-3xl").filter({
      has: page.getByRole("heading", { name: /^(Next Up|All caught up!)$/ }),
    });
    await page.getByRole("button", { name: /Mark Complete/ }).click();
    await expect(statusCard).not.toContainText("E2E next up task");
    const after = await (await page.request.get("/api/tasks")).json();
    const done = (after?.data?.tasks ?? []).find(
      (t: { id: string }) => t.id === id,
    ) as { status: string } | undefined;
    expect(done?.status).toBe("completed");
    await page.request.delete(`/api/tasks/${id}`);
  });

  test("task dialog delete asks for confirmation (Xne, T-1)", async ({ page }) => {
    // Converging cleanup: wipe ALL E2E residue (see the skills map spec).
    const residue = await (await page.request.get("/api/tasks")).json();
    for (const t of (residue?.data?.tasks ?? []) as { id: string; title: string }[]) {
      if (t.title.startsWith("E2E ")) await page.request.delete(`/api/tasks/${t.id}`);
    }
    // A task on today's row at a fixed grid hour (21:00 exists on the grid
    // and stays rendered whether or not it is already past).
    const start = new Date();
    start.setHours(21, 0, 0, 0);
    const created = await (
      await page.request.post("/api/tasks", {
        data: {
          title: "E2E dialog delete task",
          start_time: start.toISOString(),
          duration_minutes: 30,
        },
      })
    ).json();
    const id = created?.data?.task?.id;
    expect(id).toBeTruthy();
    await page.reload();

    await page.getByRole("button", { name: /E2E dialog delete task/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Dismiss the confirm → the task survives.
    page.once("dialog", (d) => d.dismiss());
    await dialog.getByRole("button", { name: "Delete" }).click();
    const stillThere = await (await page.request.get("/api/tasks")).json();
    expect(
      (stillThere?.data?.tasks ?? []).some((t: { id: string }) => t.id === id),
    ).toBe(true);

    // Accept the confirm → the task is deleted and the dialog closes.
    page.once("dialog", (d) => d.accept());
    await dialog.getByRole("button", { name: "Delete" }).click();
    await expect(dialog).toBeHidden();
    const gone = await (await page.request.get("/api/tasks")).json();
    expect(
      (gone?.data?.tasks ?? []).some((t: { id: string }) => t.id === id),
    ).toBe(false);
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
    // The reference's submit: "Create Task" with a Save icon (mr-2), no
    // text-white (session 6, P-2/P-3) — and the footer container is
    // `flex gap-3 ml-auto` (P-4).
    const submit = dialog.getByRole("button", { name: "Create Task", exact: true });
    await expect(submit).toBeVisible();
    await expect(submit.locator("svg")).toHaveClass(/mr-2/);
    await expect(submit).not.toHaveClass(/text-white/);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
  });

  test("Refresh Calendar button is content-sized (icon_sm dead variant, P-7)", async ({ page }) => {
    // The reference passes size:"icon_sm" — a variant ABSENT from its size
    // map — so cva emits no size class and the button sizes from its
    // content (svg 16px + p-1.5 + border = 30px, live-measured). The clone
    // previously invented icon_sm:"h-9 w-9 rounded-lg" (36px).
    const refresh = page.locator('button[title="Refresh Calendar"]');
    await expect(refresh).toBeAttached();
    await expect(refresh).not.toHaveClass(/h-9/);
    await expect(refresh).not.toHaveClass(/w-9/);
    const box = await refresh.boundingBox();
    expect(Math.round(box?.width ?? 0)).toBe(30);
    expect(Math.round(box?.height ?? 0)).toBe(30);
  });

  test("calendar day rows carry the reference's spacing and cursor (are, W-1/W-3)", async ({ page }) => {
    const rows = await page.evaluate(() => {
      const list = [...document.querySelectorAll("main .grid.items-center")].filter(
        (r) => (r as HTMLElement).style.minHeight === "50px",
      );
      const wrapper = list[0]?.parentElement;
      const rects = list.map((r) => r.getBoundingClientRect());
      const gaps = rects
        .slice(1)
        .map((r, i) => Math.round(r.top - rects[i].bottom));
      return {
        wrapper: wrapper?.className ?? "",
        rowCount: list.length,
        gaps: [...new Set(gaps)],
        cellClasses: list[0]
          ? [...list[0].querySelectorAll(":scope > div:last-child > div")].slice(0, 3).map(
              (c) => c.className,
            )
          : [],
      };
    });
    // The reference wraps the 7 day rows in a space-y-1.5 container
    // (measured: 6px inter-row gap, live).
    expect(rows.rowCount).toBe(7);
    expect(rows.wrapper).toContain("space-y-1.5");
    expect(rows.gaps).toEqual([6]);
    // Reference cells are default-cursor (the click handler sits on the
    // parent grid; only task blocks are cursor-pointer).
    for (const cls of rows.cellClasses) {
      expect(cls).not.toContain("cursor-pointer");
    }
  });

  test("the Skills Map pie renders the reference's recharts 2.x DOM shape (G-3)", async ({ page }) => {
    // The reference's pie (recharts 2.x — its bundle contains ZERO
    // "recharts-zIndex" strings): div.recharts-wrapper's children are
    // [svg.recharts-surface, div.recharts-tooltip-wrapper] in that order,
    // no g.recharts-zIndex-layer_* groups, no g.recharts-shape wrappers
    // (both are recharts 3-only). Pinned so a recharts major bump cannot
    // silently change the DOM.
    const residue = await (await page.request.get("/api/tasks")).json();
    for (const t of (residue?.data?.tasks ?? []) as { id: string; title: string }[]) {
      if (t.title.startsWith("E2E ")) await page.request.delete(`/api/tasks/${t.id}`);
    }
    const created = await (
      await page.request.post("/api/tasks", {
        data: {
          title: "E2E recharts task",
          start_time: new Date(Date.now() + 5 * 60_000).toISOString(),
          duration_minutes: 30,
          category: "work",
        },
      })
    ).json();
    const id = created?.data?.task?.id;
    expect(id).toBeTruthy();
    await page.reload();
    await page.waitForFunction(() => !!document.querySelector("main svg.lucide-award"));

    const pie = await page.evaluate(() => {
      const wrapper = document.querySelector("main .recharts-wrapper");
      if (!wrapper) return { present: false };
      return {
        present: true,
        zIndexLayers: wrapper.querySelectorAll('g[class*="recharts-zIndex"]').length,
        shapeWrappers: wrapper.querySelectorAll("g.recharts-shape").length,
        children: [...wrapper.children].map((c) => {
          const cls =
            typeof c.className === "string" ? c.className : (c as SVGElement).getAttribute("class") ?? "";
          // tagName is UPPERCASE for HTML elements ("DIV") but lowercase
          // for SVG ("svg") — normalize for the assertion.
          return `${c.tagName.toLowerCase()}.${cls}`;
        }),
      };
    });
    expect(pie.present).toBe(true);
    expect(pie.zIndexLayers).toBe(0);
    expect(pie.shapeWrappers).toBe(0);
    expect(pie.children).toEqual(["svg.recharts-surface", "div.recharts-tooltip-wrapper"]);
    await page.request.delete(`/api/tasks/${id}`);
  });

  test("a newly created task takes the first DOM position on its day (G-2)", async ({ page }) => {
    // The reference's dialog save refetches the task list (createdAt desc)
    // so the newest task renders FIRST among its day's blocks — the
    // clone's store mirrors that with a PREPEND on createTask. Verified
    // WITHOUT a reload after the second creation.
    const residue = await (await page.request.get("/api/tasks")).json();
    for (const t of (residue?.data?.tasks ?? []) as { id: string; title: string }[]) {
      if (t.title.startsWith("E2E ")) await page.request.delete(`/api/tasks/${t.id}`);
    }
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const d = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const dayName = today.toLocaleDateString("en-US", { weekday: "short" });
    // Task A first (15:00 — a slot free of seeded tasks on every weekday).
    const a = await (
      await page.request.post("/api/tasks", {
        data: {
          title: "E2E prepend alpha",
          start_time: `${d}T15:00`,
          duration_minutes: 30,
          category: "work",
          priority: "low",
        },
      })
    ).json();
    const aId = a?.data?.task?.id;
    expect(aId).toBeTruthy();
    await page.goto("/Dashboard");

    // Task B (21:00 — also free on every weekday) through the calendar-cell
    // dialog, exactly like a user would.
    await page
      .getByRole("button", { name: new RegExp(`^Add task on ${dayName} .* at 21:00$`) })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Task Title").fill("E2E prepend beta");
    await dialog.getByRole("button", { name: "Create Task", exact: true }).click();
    await expect(dialog).toBeHidden();

    // No reload: the day's task blocks must read [beta, alpha] — the
    // newest task FIRST (the reference's refetch semantics).
    const order = await page.evaluate(() =>
      [...document.querySelectorAll('main div[style*="position: absolute"]')]
        .map((el) => el.textContent.trim())
        .filter((t) => t.startsWith("E2E prepend")),
    );
    expect(order).toEqual(["E2E prepend beta", "E2E prepend alpha"]);
    await page.request.delete(`/api/tasks/${aId}`);
    const residue2 = await (await page.request.get("/api/tasks")).json();
    for (const t of (residue2?.data?.tasks ?? []) as { id: string; title: string }[]) {
      if (t.title.startsWith("E2E prepend")) await page.request.delete(`/api/tasks/${t.id}`);
    }
  });
  test("the task dialog animates open like the reference (G-1)", async ({ page }) => {
    // The reference's stylesheet defines .animate-in { animation-name:
    // enter; animation-duration: 0.15s } — its dialog/menus genuinely
    // animate. The clone shipped the same utility classes but never
    // imported the engine (tw-animate-css), so they were dead strings:
    // computed animation-name was "none". Pinned at the computed-style
    // level so a missing import can never come back silently.
    await page
      .getByRole("button", { name: /^Add task on Tue .* at 10:00$/ })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const anim = await dialog.evaluate((el) => getComputedStyle(el).animationName);
    expect(anim).toBe("enter");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
  });

  test("the dialog title renders the classic tracking-tight heading (G-3)", async ({ page }) => {
    // The reference's DialogTitle base is the classic shadcn form
    // (text-lg font-semibold leading-none tracking-tight) — the merged
    // heading renders `tracking-tight text-xl font-bold text-slate-900`.
    // The clone's modern base dropped tracking-tight.
    await page
      .getByRole("button", { name: /^Add task on Tue .* at 10:00$/ })
      .first()
      .click();
    const heading = page.getByRole("dialog").getByRole("heading", { name: "Add New Task" });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveClass(/tracking-tight/);
    await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
  });

  test("select triggers carry the classic ring/placeholder classes (G-3)", async ({ page }) => {
    // The reference's SelectTrigger: `... shadow-sm ring-offset-background
    // data-[placeholder]:text-muted-foreground focus:outline-none ...`.
    // The clone's modern base had replaced that with
    // placeholder:text-muted-foreground and dropped ring-offset-background.
    await page
      .getByRole("button", { name: /^Add task on Tue .* at 10:00$/ })
      .first()
      .click();
    const trigger = page.getByRole("dialog").getByRole("combobox").first();
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveClass(/ring-offset-background/);
    await expect(trigger).toHaveClass(/data-\[placeholder\]:text-muted-foreground/);
    await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
  });

  test("the edit dialog's delete icon renders the reference's single lucide class (G-2)", async ({ page }) => {
    // The reference runs lucide-react v0.475.0 — its factory emits exactly
    // ONE class per icon (lucide-trash2). The clone's 0.525.0 emits BOTH
    // lucide-trash2 AND lucide-trash-2 for renamed icons. Pinned so the
    // lucide major cannot drift from the reference's measured version.
    const residue = await (await page.request.get("/api/tasks")).json();
    for (const t of (residue?.data?.tasks ?? []) as { id: string; title: string }[]) {
      if (t.title.startsWith("E2E trash icon")) await page.request.delete(`/api/tasks/${t.id}`);
    }
    // 15:00 today — a slot free of seeded tasks on every weekday, and a
    // time that renders on the calendar grid at ANY hour of the run
    // (FS-16: now+N-minutes tasks vanish from the grid outside
    // 07:00–22:00).
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const d = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const created = await (
      await page.request.post("/api/tasks", {
        data: {
          title: "E2E trash icon task",
          start_time: `${d}T15:00`,
          duration_minutes: 30,
          category: "work",
        },
      })
    ).json();
    const id = created?.data?.task?.id;
    expect(id).toBeTruthy();
    await page.reload();

    const block = page.getByRole("button", { name: /E2E trash icon task/ }).first();
    await expect(block).toBeVisible();
    await block.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Edit Task" })).toBeVisible();
    const trash = dialog.getByRole("button", { name: "Delete" }).locator("svg");
    await expect(trash).toHaveClass(/lucide-trash2/);
    await expect(trash).not.toHaveClass(/lucide-trash-2/);

    // Cleanup: cancel the dialog, then remove the task via the API.
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await page.request.delete(`/api/tasks/${id}`);
  });

  test("the tasks API responds in the reference's captured entity shape (G-4 + session 12 W-1/W-2)", async ({ page }) => {
    // The documented wire contract (AGENTS.md / PAD §4.1), re-pinned in
    // session 12 against the CAPTURED live reference wire (XHR
    // interception of the reference's own base44 entity traffic): tasks
    // ship start_time / end_time / duration_minutes / created_date /
    // updated_date / is_sample / created_by / created_by_id, and the
    // clone-internal camelCase fields (isSample/userId) stay off the wire.
    // The request side always spoke snake_case; the responses used to
    // return raw camelCase Prisma objects.
    const residue = await (await page.request.get("/api/tasks")).json();
    for (const t of (residue?.data?.tasks ?? []) as { id: string; title: string }[]) {
      if (t.title.startsWith("E2E wire task")) await page.request.delete(`/api/tasks/${t.id}`);
    }
    const created = await (
      await page.request.post("/api/tasks", {
        data: {
          title: "E2E wire task",
          start_time: new Date(Date.now() + 5 * 60_000).toISOString(),
          duration_minutes: 45,
          category: "personal",
        },
      })
    ).json();
    const task = created?.data?.task ?? {};
    expect(task.start_time).toBeTruthy();
    expect(task.duration_minutes).toBe(45);
    expect(task.end_time).toBeTruthy();
    expect(task.created_date).toBeTruthy();
    expect(task.updated_date).toBeTruthy();
    expect(task.is_sample).toBe(false);
    expect(task.created_by).toBe("demo@flowschedule.app");
    expect(task.created_by_id).toBeTruthy();
    expect(task.startTime).toBeUndefined();
    expect(task.durationMinutes).toBeUndefined();
    expect(task.isSample).toBeUndefined();
    expect(task.userId).toBeUndefined();
    expect(task.created_at).toBeUndefined();
    // The captured 14-key wire shape (session 12, W-1/W-2).
    expect(Object.keys(task).sort()).toEqual(
      [
        "category",
        "created_by",
        "created_by_id",
        "created_date",
        "description",
        "duration_minutes",
        "end_time",
        "id",
        "is_sample",
        "priority",
        "start_time",
        "status",
        "title",
        "updated_date",
      ].sort(),
    );

    // The GET list ships the same shape.
    const list = await (await page.request.get("/api/tasks")).json();
    const listed = (list?.data?.tasks ?? []).find(
      (t: { title: string }) => t.title === "E2E wire task",
    );
    expect(listed?.start_time).toBeTruthy();
    expect(listed?.duration_minutes).toBe(45);
    expect(listed?.created_date).toBeTruthy();
    expect(listed?.is_sample).toBe(false);
    expect(listed?.created_by).toBe("demo@flowschedule.app");

    await page.request.delete(`/api/tasks/${task.id}`);
  });
});

test.describe("dashboard layout (wide viewport)", () => {
  // X1e's page container is `p-4 md:p-6 lg:p-8` — full-bleed, no max-width
  // (live-measured 1440px wide at a 1440 viewport, session 4, D-1).
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/Dashboard");
  });

  test("dashboard page is full-bleed at lg with the reference's padding", async ({ page }) => {
    const pageDiv = await page.evaluate(() => {
      const main = document.querySelector("main");
      const el = main?.firstElementChild as HTMLElement | null;
      if (!el) return { cls: "", w: 0 };
      return { cls: el.className, w: Math.round(el.getBoundingClientRect().width) };
    });
    expect(pageDiv.cls).toContain("p-4");
    expect(pageDiv.cls).toContain("md:p-6");
    expect(pageDiv.cls).toContain("lg:p-8");
    expect(pageDiv.cls).not.toContain("max-w-7xl");
    // Full-bleed: the container spans the 1440px viewport (the clone's old
    // max-w-7xl mx-auto capped it at 1280).
    expect(pageDiv.w).toBeGreaterThanOrEqual(1440);
  });
});
