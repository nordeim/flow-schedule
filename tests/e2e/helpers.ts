export const DEMO_EMAIL = "demo@flowschedule.app";
export const DEMO_PASSWORD = "demo1234";

/**
 * Session note for spec authors: the main Playwright project starts every
 * test ALREADY authenticated — the "setup" project signs the demo user in
 * once and playwright.config.ts injects the saved storageState. Specs that
 * need the logged-out surface (tests/e2e/auth.spec.ts) opt out with an
 * empty storageState at the file level.
 *
 * The auth endpoints are rate-limited (10 attempts/IP/min) — keep the
 * TOTAL number of real login attempts per run well under that budget.
 */
