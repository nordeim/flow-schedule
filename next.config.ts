import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin file tracing to this project so the standalone server always lands
  // at .next/standalone/server.js — even when the repo is cloned inside a
  // parent workspace that has its own lockfile.
  // The app's views live at real Next.js routes (/Dashboard, /Planning,
  // /Profile, /Settings, /login) — same paths as the reference app, so no
  // SPA rewrites are needed.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // No typescript.ignoreBuildErrors / eslint.ignoreDuringBuilds — the
  // production build must fail on type/lint errors itself (the scaffold's
  // bypass flags were removed in session 3; `bun run typecheck` remains
  // the fast gate).
  reactStrictMode: false,
};

export default nextConfig;
