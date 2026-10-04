import { afterEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Site URL helper (Session 1, R-3)
//
// `src/lib/site.ts` centralizes the canonical-origin logic that
// NEXT_PUBLIC_SITE_URL feeds: metadataBase in the root layout, sitemap.ts
// and robots.ts. Pure module — the env var is read at call time so tests
// can pin both the override and the localhost fallback.
// ----------------------------------------------------------------------------

describe("siteUrl()", () => {
  it("returns NEXT_PUBLIC_SITE_URL when set, with trailing slash trimmed", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://flow.example.com/");
    const { siteUrl } = await import("../src/lib/site");
    expect(siteUrl()).toBe("https://flow.example.com");
  });

  it("falls back to http://localhost:3000 when unset", async () => {
    vi.unstubAllEnvs();
    const { siteUrl } = await import("../src/lib/site");
    expect(siteUrl()).toBe("http://localhost:3000");
  });
});

describe("absoluteUrl()", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("joins a path onto the site origin with a single slash", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://flow.example.com");
    const { absoluteUrl } = await import("../src/lib/site");
    expect(absoluteUrl("/Planning")).toBe("https://flow.example.com/Planning");
  });

  it("keeps the root URL clean for an empty path", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://flow.example.com");
    const { absoluteUrl } = await import("../src/lib/site");
    expect(absoluteUrl("")).toBe("https://flow.example.com");
  });
});
