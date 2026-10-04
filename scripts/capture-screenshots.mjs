// One-off: capture the interactive screenshots that need trusted pointer
// events (Radix menus, dialogs) from the dev server on :3000. Playwright's
// locator.click dispatches trusted events (the agent-browser eval click
// does not — see AGENTS.md Radix quirk).
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

// Sign in (the e2e rate limiter is per-IP on :3100 only; :3000 dev has its
// own limiter — one login is fine).
await page.goto(`${BASE}/login`);
await page.getByLabel("Email").fill("demo@flowschedule.app");
await page.getByLabel("Password").fill("demo1234");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/Dashboard");

// 08-mobile-menu: open the account menu (trusted click).
await page.getByRole("button", { name: "Open account menu" }).click();
await page.waitForSelector("[role=menu]");
await page.screenshot({ path: `${OUT}/08-mobile-menu.png` });
await page.keyboard.press("Escape");

// 09-mobile-planning
await page.goto(`${BASE}/Planning`);
await page.getByRole("heading", { name: "Weekly Planning" }).waitFor();
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/09-mobile-planning.png` });

// 14-statuscard-nextup: create a task a few minutes out so the reference's
// rich Next Up card renders, then capture the desktop dashboard.
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page2 = await ctx2.newPage();
await page2.goto(`${BASE}/login`);
await page2.getByLabel("Email").fill("demo@flowschedule.app");
await page2.getByLabel("Password").fill("demo1234");
await page2.getByRole("button", { name: "Sign in" }).click();
await page2.waitForURL("**/Dashboard");
await page2.getByRole("heading", { name: "Weekly Schedule" }).waitFor();
await page2.evaluate(async () => {
  await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Screenshot next up task",
      start_time: new Date(Date.now() + 6 * 60000).toISOString(),
      duration_minutes: 30,
      priority: "high",
      category: "work",
    }),
  });
});
await page2.reload();
await page2.getByRole("heading", { name: "Next Up", exact: true }).waitFor();
await page2.waitForTimeout(1200);
await page2.screenshot({ path: `${OUT}/14-statuscard-nextup.png` });
// cleanup
await page2.evaluate(async () => {
  const res = await (await fetch("/api/tasks")).json();
  for (const t of res?.data?.tasks ?? []) {
    if (t.title === "Screenshot next up task") await fetch(`/api/tasks/${t.id}`, { method: "DELETE" });
  }
});

// 15-taskdialog-delete-confirm: open the dialog on a seeded task and stop
// at the open state (the confirm itself is native — pinned by e2e).
await page2.getByRole("button", { name: /Team standup/ }).first().click();
await page2.getByRole("dialog").waitFor();
await page2.screenshot({ path: `${OUT}/15-taskdialog.png` });

await browser.close();
const files = fs.readdirSync(OUT).filter((f) => /^\d+/.test(f));
console.log("screenshots now:", files.join(", "));
