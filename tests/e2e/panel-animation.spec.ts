import { expect, test } from "@playwright/test";

// Panel animation pins (session 19, AN-1 / FS-31 + BL-1).
//
// The session-19 animation-timing pass measured the framer-motion family
// live on BOTH apps at four evidence levels (the config decompile from
// the reference's bundle, the runtime engine comparison, the rAF
// timelines, and the WAAPI animation metadata). Every config and every
// measured semantic matched; the ONE rendered divergence was BL-1: the
// reference's SECOND background blob is INVISIBLE (its `w-100 h-100`
// classes are dead in the reference's Tailwind v3-scale build — its
// stylesheet has `.w-96` but NO `.w-100` rule — so the absolutely
// positioned, content-less div collapses to 0×0 and never paints; the
// clone had rendered it as a live 400 px blob via `w-[400px]`).
//
// This family locks the verified motion contract — the surfaces a
// future edit to QuickActions.tsx / BackgroundBlobs.tsx would silently
// change (the same class as session-17's VP-1 and session-18's FT-1):
//
//   - the expanding overlay's native animation carries the reference's
//     exact computed timing — duration 350, easing
//     cubic-bezier(0.55, 0, 1, 0.45) (circOut in the WAAPI-hybrid
//     runtime both apps share) — deterministic, no timing race;
//   - the panel body mounts at translateY(20px) + opacity 0 and HOLDS
//     them for the 0.2 s delay (the measured initial state);
//   - the form-view's exit fires with the LAST-RENDERED transition
//     (AnimatePresence semantics: the exit uses the element's final
//     render props — `delay: activeId ? 0.15 : 0` renders its last
//     pass with activeId SET, so the exit waits 0.15 s — measured
//     identical on both apps);
//   - the blob layer renders exactly TWO visible blobs (w-96, w-80)
//     and the second at 0×0 (the BL-1 dead-class mirror).

const QA_CARD = '.min-h-\\[280px\\]';

async function openDashboard(page: import("@playwright/test").Page) {
  await page.goto("/Dashboard");
  await page.getByRole("heading", { name: "Weekly Schedule" }).waitFor();
}

// The exit-probe shape (an in-page rAF sampler stored on the window —
// typed via a local alias; the build typechecks e2e specs too).
type ExitSample = { t: number; ov: number | null; fv: number | null };
type ExitProbe = { samples: ExitSample[] };

test.describe("Quick Actions panel animation (the G1e/W1e motion contract, session 19)", () => {
  test("the expanding overlay animates on the reference's exact WAAPI timing", async ({ page }) => {
    await openDashboard(page);
    await page.getByRole("button", { name: "Start Focus Timer", exact: true }).click();
    // the overlay mounts with the panel — catch it while its entrance
    // animation is live (350 ms window; the timing metadata is readable
    // after completion too: fill "both" keeps the animation listed).
    const overlay = page.locator(`${QA_CARD} div.absolute.z-10`);
    await overlay.waitFor({ state: "attached" });
    // Poll IN-PAGE for the native animation to register (framer creates
    // it a frame after the mount — a single read can race the
    // registration and flake under compositing load).
    const anims = await overlay.evaluate(async (el) => {
      for (let i = 0; i < 50; i++) {
        const list = el
          .getAnimations({ subtree: false })
          .map((a) => {
            const t = a.effect?.getComputedTiming?.() ?? {};
            const g = a.effect?.getTiming?.() ?? {};
            return { duration: t.duration, delay: t.delay, easing: g.easing, fill: g.fill };
          })
          .filter((a) => typeof a.duration === "number" && a.duration > 0);
        if (list.length) return list;
        await new Promise((r) => setTimeout(r, 20));
      }
      return [];
    });
    // exactly ONE native animation carries the entrance (the geometry +
    // opacity keyframes share the 350 ms circOut tween on both apps —
    // byte-identical metadata measured live on the reference AND clone).
    expect(anims.length).toBeGreaterThanOrEqual(1);
    const entrance = anims.find((a) => a.duration === 350) ?? anims[0];
    expect(entrance.duration).toBe(350);
    expect(entrance.delay).toBe(0);
    expect(entrance.easing).toBe("cubic-bezier(0.55, 0, 1, 0.45)");
    // leave the panel closed (clean state for the next test).
    await page.getByRole("button", { name: "Back to Quick Actions" }).click();
    await page.getByRole("heading", { name: "Quick Actions" }).waitFor();
  });

  test("the panel body enters from translateY(20px) at opacity 0 and holds through the 0.2 s delay", async ({ page }) => {
    await openDashboard(page);
    // S23-F1 (rewritten): the original design read the mount state via
    // waitForFunction, then scheduled the +100 ms delay-hold read as a
    // SECOND page.evaluate — the CDP round-trip between them is
    // load-dependent and ate into the 200 ms delay window on cold-start
    // full-suite runs (the observed flake). The rewrite:
    //   (a) the DETERMINISTIC pin — the panel body's native WAAPI
    //       animation carries the timing contract itself (duration 300,
    //       delay 200, circOut, fill both — live-measured; the same
    //       metadata class spec #1 pins for the overlay);
    //   (b) the entrance's opacity keyframes (native metadata, 0 → 1)
    //       — the initial y and the delay-hold are covered by the WAAPI
    //       delay + the panel-motion SOURCE pins instead of a live
    //       transient read (retired: racy under ~200 ms mount churn).
    await page.getByRole("button", { name: "Start Focus Timer", exact: true }).click();
    // (a) the WAAPI timing metadata — poll in-page for the animation to
    // register (framer creates it a frame after the mount; the timing
    // metadata is readable after completion too: fill "both" keeps the
    // animation listed).
    const anims = await page.evaluate(async () => {
      for (let i = 0; i < 50; i++) {
        const el = document.querySelector('.min-h-\\[280px\\] .space-y-4');
        if (el) {
          const list = el
            .getAnimations({ subtree: false })
            .map((a) => {
              const t = a.effect?.getComputedTiming?.() ?? {};
              const g = a.effect?.getTiming?.() ?? {};
              return { duration: t.duration, delay: t.delay, easing: g.easing, fill: g.fill };
            })
            .filter((a) => typeof a.duration === "number" && a.duration > 0);
          if (list.length) return list;
        }
        await new Promise((r) => setTimeout(r, 20));
      }
      return [];
    });
    // exactly ONE native animation carries the body's entrance.
    expect(anims.length).toBeGreaterThanOrEqual(1);
    const entrance = anims.find((a) => a.duration === 300) ?? anims[0];
    expect(entrance.duration).toBe(300);
    expect(entrance.delay).toBe(200);
    expect(entrance.easing).toBe("cubic-bezier(0.55, 0, 1, 0.45)");
    expect(entrance.fill).toBe("both");
    // (b) the keyframes metadata — the entrance's opacity keyframes are
    // DETERMINISTIC native-animation metadata (0 → 1; live-probed). The
    // initial transform y=20 and the delay-hold are covered WITHOUT a
    // live computed read: the y-offset and the 0.2 delay are byte-pinned
    // at the SOURCE (tests/panel-motion.test.ts pins the panelMotion
    // config — initial { opacity: 0, y: 20 }, delay: 0.2) and the delay
    // is additionally pinned by the WAAPI timing above. The live
    // mount-frame read (the original design AND the single-evaluate
    // variant tried mid-session) is inherently racy against ~200 ms
    // main-thread stalls during the mode="wait" mount churn — measured
    // mid-tween at y=18.37 on a loaded full-suite run; retired for the
    // deterministic surfaces.
    const keyframes = await page.evaluate(async () => {
      for (let i = 0; i < 50; i++) {
        const el = document.querySelector('.min-h-\\[280px\\] .space-y-4');
        if (el) {
          const anims = el
            .getAnimations({ subtree: false })
            .map((a) => {
              const kf = (a as unknown as { effect?: { getKeyframes?: () => unknown[] } }).effect
                ? (a.effect as unknown as KeyframeEffect).getKeyframes?.() ?? []
                : [];
              const dur = a.effect?.getComputedTiming?.()?.duration;
              return { kf, dur: typeof dur === "number" ? dur : 0 };
            })
            .filter((a) => a.dur > 0);
          if (anims.length) return anims[0].kf;
        }
        await new Promise((r) => setTimeout(r, 20));
      }
      return [];
    });
    expect(keyframes.length).toBe(2);
    expect(String(keyframes[0].opacity)).toBe("0");
    expect(String(keyframes[1].opacity)).toBe("1");
    // ...and it settles (the 0.3 s circOut completes).
    await expect
      .poll(async () => page.locator(`${QA_CARD} .space-y-4`).evaluate((el) => getComputedStyle(el).opacity), {
        timeout: 3_000,
      })
      .toBe("1");
    await page.getByRole("button", { name: "Back to Quick Actions" }).click();
    await page.getByRole("heading", { name: "Quick Actions" }).waitFor();
  });

  test("the form-view's exit waits the last-rendered 0.15 s delay", async ({ page }) => {
    await openDashboard(page);
    await page.getByRole("button", { name: "Start Focus Timer", exact: true }).click();
    await page.getByRole("heading", { name: "Start Focus Timer" }).waitFor();
    // Settle the ENTRANCE first — the heading waitFor returns while the
    // form-view is still fading IN (Playwright visibility ignores
    // opacity), and a sampler installed mid-entrance would record the
    // entrance's own opacity climb as the "first drop".
    await page.waitForFunction(
      () => {
        const fv = document.querySelector('.min-h-\\[280px\\] div.relative.z-20')?.firstElementChild;
        return fv instanceof HTMLElement ? +getComputedStyle(fv).opacity >= 0.999 : false;
      },
      null,
      { timeout: 5_000 },
    );
    // Instrument an in-page rAF sampler and click
    // back. The exit delay is measured on the PAGE's clock (zero CDP
    // latency): the OVERLAY starts exiting the moment the handler flips
    // the state (its exit has no delay), so its first change marks the
    // handler time — and the form-view's first opacity drop MINUS that
    // is the exit delay. AnimatePresence exit semantics carry the
    // LAST-RENDERED transition: the form-view's final render had
    // activeId set, so its exit waits 0.15 s (measured identical on
    // both apps; an instant-exit build measures ~0).
    await page.evaluate(() => {
      const w = window as unknown as { __exitProbe?: ExitProbe };
      w.__exitProbe = { samples: [] };
      const qa = () => document.querySelector('.min-h-\\[280px\\]');
      const tick = () => {
        const c = qa();
        if (c) {
          const ov = c.querySelector("div.absolute.z-10");
          const fv = c.querySelector("div.relative.z-20")?.firstElementChild;
          w.__exitProbe?.samples.push({
            t: performance.now(),
            ov: ov ? +getComputedStyle(ov).opacity : null,
            fv: fv && fv.tagName === "DIV" ? +getComputedStyle(fv).opacity : null,
          });
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.getByRole("button", { name: "Back to Quick Actions" }).click();
    await page.getByRole("heading", { name: "Quick Actions" }).waitFor({ timeout: 3_000 });
    const result = await page.evaluate(() => {
      const s = (window as unknown as { __exitProbe: ExitProbe }).__exitProbe.samples;
      // t_handler: the overlay's opacity first leaves 1 (its exit is
      // immediate — the reference's exit-internal transition has no
      // delay, measured on both apps).
      const h = s.find((x) => x.ov !== null && x.ov !== undefined && x.ov < 0.999);
      // t_drop: the form-view's opacity first leaves 1 (AFTER the delay).
      const d = s.find((x) => x.fv !== null && x.fv !== undefined && x.fv < 0.999);
      return {
        handlerAt: h ? h.t : null,
        dropAt: d ? d.t : null,
        delay: h && d ? d.t - h.t : null,
        nSamples: s.length,
      };
    });
    expect(result.handlerAt).not.toBeNull();
    expect(result.dropAt).not.toBeNull();
    // the measured last-rendered delay is ~150 ms on both apps (the
    // overlay's first-change detection adds a frame of quantization, so
    // the differential reads ~120–150); the instant-exit regression
    // class measures ~0–30 ms (both drop on the same frame). The 60 ms
    // threshold splits the classes with frame-drop margin for heavy
    // compositing (a 400 px blurred blob restoring mid-suite drops
    // frames at the handler moment).
    expect(result.delay).toBeGreaterThanOrEqual(60);
    await expect
      .poll(
        async () =>
          page.evaluate(() => (window as unknown as { __exitProbe?: ExitProbe }).__exitProbe?.samples.at(-1)?.fv),
        {
          timeout: 3_000,
        },
      )
      .toBe(1);
  });

  test("the background blob layer renders two visible blobs — the second at 0x0 (BL-1)", async ({ page }) => {
    await openDashboard(page);
    const blobs = await page.evaluate(() => {
      const host = document.querySelector("div.fixed.inset-0.pointer-events-none");
      if (!host) return null;
      return [...host.children].map((b) => {
        const r = b.getBoundingClientRect();
        return { w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
      });
    });
    expect(blobs).not.toBeNull();
    expect(blobs!.length).toBe(3);
    // blob 1 (w-96, the sky/blue 30 s loop) and blob 3 (w-80, the
    // cyan/teal 40 s loop) are LIVE on both apps (their rects scale
    // with the drift — only non-zero area is asserted).
    expect(blobs![0].w).toBeGreaterThan(100);
    expect(blobs![2].w).toBeGreaterThan(100);
    // BL-1: the reference's second blob (indigo/purple, 35 s loop)
    // renders 0×0 — its `w-100 h-100` is a DEAD class in the
    // reference's v3-scale stylesheet (no .w-100 rule; .w-96 exists).
    // The clone mirrors the RENDERED effect: the second blob collapses
    // to 0×0 (the class string is NOT copied — v4's dynamic spacing
    // would generate w-100 as 400 px and keep the divergence).
    expect(blobs![1].w).toBe(0);
    expect(blobs![1].h).toBe(0);
  });
});
