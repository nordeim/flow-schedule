import { expect, test } from "@playwright/test";

// Focus Timer timed-interaction pins (session 18, FT-1).
//
// The session-18 live sub-second measurement of BOTH apps (the reference
// at 1440×900 with the operator's account; the clone's production build)
// established the W1e timed contract — the display-flip timeline recorded
// by an in-page MutationObserver with performance.now() timestamps. The
// open/countdown/input-hidden/icon/zero-minutes contract is already pinned
// in dashboard.spec.ts's Quick Actions describe; THIS family locks the
// timed semantics that were live-verified but unpinned:
//
//   - PAUSE snaps the display back to the full duration (~100–170 ms
//     after the click on both apps) and the minutes input reappears;
//   - RESUME restarts the countdown from FULL (the reference's toggle
//     resets on BOTH directions — the next flip is 00:59 again, not the
//     paused continuation);
//   - editing minutes while paused moves the display immediately (the
//     reference's display follows the minutes value, +13 ms measured);
//   - the completion path (page.clock fast-forward — the fake clock runs
//     the 60-second countdown instantly; the real-65s path was a
//     session-3 one-off, too slow for the suite): the alert
//     "Focus session complete!" fires at the 60 s tick, and the display's
//     TERMINAL state is 00:00 (FT-1: the reference leaves 00:00 — only
//     the toggle and the minutes-change handler reset to the full
//     duration; a derived `running ? remaining : minutes*60` display
//     wrongly snaps to full at the completion edge);
//   - closing the panel while running resets to the FRESH idle state
//     (25:00, Play toggle — the panel unmounts; no state persistence on
//     either app).
//
// Each test navigates itself: the completion pin must install the fake
// clock BEFORE page.goto (page.clock replaces the page's timers before
// the app scripts load), so a shared beforeEach navigation would break it.

const DISPLAY = "div.font-mono";

async function openTimerPanel(page: import("@playwright/test").Page) {
  await page.goto("/Dashboard");
  await page.getByRole("heading", { name: "Weekly Schedule" }).waitFor();
  await page.getByRole("button", { name: "Start Focus Timer", exact: true }).click();
  await page.getByRole("heading", { name: "Start Focus Timer" }).waitFor();
  const display = page.locator(DISPLAY).filter({ hasText: /^\d{2}:\d{2}$/ }).first();
  await expect(display).toHaveText("25:00");
  return display;
}

test.describe("Focus Timer timed interactions (the W1e contract, session 18)", () => {
  test("pause snaps the display to the full duration + the minutes input reappears", async ({ page }) => {
    const display = await openTimerPanel(page);
    await page.getByLabel("Timer minutes").fill("1");
    await expect(display).toHaveText("01:00");
    await page.getByRole("button", { name: "Start timer" }).click();
    // the first interval tick (~1.1 s after the click on both apps)
    await expect(display).toHaveText("00:59", { timeout: 15_000 });
    // PAUSE: the display snaps back to the full duration (measured live
    // on the reference at +166 ms, on the clone at +99 ms — the toggle's
    // reset, not an idle effect).
    await page.getByRole("button", { name: "Pause timer" }).click();
    await expect(display).toHaveText("01:00");
    // the minutes input reappears on pause (hidden only while running).
    await expect(page.getByLabel("Timer minutes")).toBeVisible();
  });

  test("resume restarts the countdown from full (not from the paused value)", async ({ page }) => {
    const display = await openTimerPanel(page);
    await page.getByLabel("Timer minutes").fill("1");
    await page.getByRole("button", { name: "Start timer" }).click();
    await expect(display).toHaveText("00:59", { timeout: 15_000 });
    await page.getByRole("button", { name: "Pause timer" }).click();
    await expect(display).toHaveText("01:00");
    // RESUME: the countdown RESTARTS from full — the next flip is 00:59
    // again, NOT 00:58 (the reference's toggle resets on both directions;
    // a continue-from-paused timer would show 00:58).
    await page.getByRole("button", { name: "Start timer" }).click();
    await expect(display).toHaveText("00:59", { timeout: 15_000 });
  });

  test("editing minutes while paused moves the display immediately", async ({ page }) => {
    const display = await openTimerPanel(page);
    await page.getByLabel("Timer minutes").fill("1");
    await page.getByRole("button", { name: "Start timer" }).click();
    await expect(display).toHaveText("00:59", { timeout: 15_000 });
    await page.getByRole("button", { name: "Pause timer" }).click();
    await expect(display).toHaveText("01:00");
    // the paused display FOLLOWS the minutes edit (+13 ms on the
    // reference, +34 ms on the clone — both immediate).
    await page.getByLabel("Timer minutes").fill("2");
    await expect(display).toHaveText("02:00");
    // and the resumed countdown counts from the NEW minutes.
    await page.getByRole("button", { name: "Start timer" }).click();
    await expect(display).toHaveText("01:59", { timeout: 15_000 });
  });

  test("the completed state is the terminal 00:00 display (FT-1)", async ({ page }) => {
    // page.clock: the fake clock runs the 60-second countdown instantly.
    // install BEFORE navigation — the fake timers must replace the page's
    // clock before the app scripts load (playwright's contract).
    const dialogs: string[] = [];
    page.on("dialog", (dialog) => {
      dialogs.push(`${dialog.type()}:${dialog.message()}`);
      void dialog.dismiss();
    });
    await page.clock.install();
    await page.goto("/Dashboard");
    await page.getByRole("heading", { name: "Weekly Schedule" }).waitFor();
    await page.getByRole("button", { name: "Start Focus Timer", exact: true }).click();
    await page.getByRole("heading", { name: "Start Focus Timer" }).waitFor();
    const display = page.locator(DISPLAY).filter({ hasText: /^\d{2}:\d{2}$/ }).first();
    await expect(display).toHaveText("25:00");
    await page.getByLabel("Timer minutes").fill("1");
    await expect(display).toHaveText("01:00");
    await page.getByRole("button", { name: "Start timer" }).click();
    await expect(page.getByLabel("Timer minutes")).toBeHidden();
    // run the whole 60-second countdown on the fake clock — runFor (not
    // fastForward: the interval must fire REPEATEDLY; fastForward fires
    // each due timer at most once and pauses the clock). The alert fires
    // at the r=1 tick; the dialog handler dismisses it.
    await page.clock.runFor(62_000);
    // FT-1: the reference's terminal display is 00:00 — NOT a snap back
    // to the full duration (measured live: displayAfterDismiss "00:00").
    await expect(display).toHaveText("00:00");
    expect(dialogs).toEqual(["alert:Focus session complete!"]);
    // the post-completion controls: the Play toggle back, the minutes
    // input visible again (its value preserved).
    await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible();
    await expect(page.getByLabel("Timer minutes")).toBeVisible();
  });

  test("closing the panel resets the timer to the fresh idle state", async ({ page }) => {
    const display = await openTimerPanel(page);
    await page.getByLabel("Timer minutes").fill("1");
    await page.getByRole("button", { name: "Start timer" }).click();
    await expect(display).toHaveText("00:59", { timeout: 15_000 });
    await page.getByRole("button", { name: "Close Timer" }).click();
    await expect(page.getByRole("heading", { name: "Start Focus Timer" })).toBeHidden();
    // the panel unmounts on close — the timer does NOT survive; a reopen
    // shows the FRESH 25:00 idle state with the Play toggle (measured
    // live on BOTH apps: no state persistence).
    await page.getByRole("button", { name: "Start Focus Timer", exact: true }).click();
    await page.getByRole("heading", { name: "Start Focus Timer" }).waitFor();
    const display2 = page.locator(DISPLAY).filter({ hasText: /^\d{2}:\d{2}$/ }).first();
    await expect(display2).toHaveText("25:00");
    await expect(page.getByRole("button", { name: "Start timer" })).toBeVisible();
    // leave the panel closed (clean state for the next test).
    await page.getByRole("button", { name: "Close Timer" }).click();
    await expect(page.getByRole("heading", { name: "Start Focus Timer" })).toBeHidden();
  });
});
