import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Canonical sitemap (Session 1, R-3; session 5: "/" added — the reference
// serves the dashboard at the root). The reference app is a base44 SPA
// behind auth; this self-hosted clone exposes a static, crawlable route
// set — exactly the entries below.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const routes = ["/", "/Dashboard", "/Planning", "/Profile", "/Settings", "/login"];
  return routes.map((route) => ({
    url: absoluteUrl(route),
    lastModified,
    changeFrequency: "daily",
    priority: route === "/" ? 1 : route === "/Dashboard" ? 0.9 : 0.7,
  }));
}
