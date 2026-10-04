import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

// next.config.ts contract — pins the load-bearing settings and forbids the
// scaffold's type-build bypass flag (session-3 D-1).
//
// `typescript.ignoreBuildErrors: true` shipped from the scaffold and let the
// production build succeed even with type errors; the gate was
// `bun run typecheck` only. The flag is now removed — the build itself must
// fail on type errors (defense in depth on top of typecheck). (Next 16 has
// no eslint-during-builds option at all — there is nothing else to bypass.)

describe("next.config.ts contract", () => {
  it("does not bypass TypeScript build errors", () => {
    expect(nextConfig.typescript?.ignoreBuildErrors).toBeFalsy();
  });

  it("keeps the standalone output (self-hosted deployment target)", () => {
    expect(nextConfig.output).toBe("standalone");
  });

  it("keeps the dev-origin allowlist (Next 16 dev-origin protection)", () => {
    // Without this, the dev server silently blocks chunks for the
    // 127.0.0.1 origin — unhydrated pages (AGENTS.md framework quirks).
    const origins = nextConfig.allowedDevOrigins ?? [];
    expect(origins).toContain("127.0.0.1");
    expect(origins).toContain("localhost");
  });
});
