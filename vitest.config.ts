import { defineConfig } from "vitest/config";
import path from "node:path";

// Unit-test layer for the pure domain seams (auth scrypt/HMAC crypto,
// reference domain constants, SQLite db-path resolution, the .env.example
// contract, and the site URL helper). Browser/E2E coverage lives in
// tests/e2e/*.spec.ts (Playwright — never picked up by this config, which
// matches *.test.ts only) plus scripts/smoke-test.sh.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
});
