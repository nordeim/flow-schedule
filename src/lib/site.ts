// ---------------------------------------------------------------------------
// Canonical site origin (Session 1, R-3)
//
// NEXT_PUBLIC_SITE_URL was documented in .env.example/README as "used for
// metadata, sitemap.xml, and robots.txt" but nothing read it. This module
// makes that claim true. Readers:
//   - src/app/layout.tsx   → metadataBase
//   - src/app/sitemap.ts   → absolute sitemap entries
//   - src/app/robots.ts    → sitemap pointer
// The env var is read at CALL time (pure function, no import-time capture)
// so tests can pin both the override and the localhost fallback.
// ----------------------------------------------------------------------------

/** Default origin when NEXT_PUBLIC_SITE_URL is unset (local dev). */
export const SITE_URL_DEFAULT = "http://localhost:3000";

/** Canonical public origin, trailing slash trimmed. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return SITE_URL_DEFAULT;
  return raw.replace(/\/+$/, "");
}

/**
 * Absolute URL for a root-relative path. The path keeps a single leading
 * slash; an empty path yields the bare origin (no trailing slash).
 */
export function absoluteUrl(path: string): string {
  const clean = path.replace(/^\/+/, "");
  if (!clean) return siteUrl();
  return `${siteUrl()}/${clean}`;
}
