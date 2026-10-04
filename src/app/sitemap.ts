import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Canonical sitemap (Session 1, R-3): the four app pages plus /login.
// The reference app is a base44 SPA behind auth; this self-hosted clone
// exposes a static, crawlable route set — exactly the entries below.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const routes = ["/Dashboard", "/Planning", "/Profile", "/Settings", "/login"];
  return routes.map((route) => ({
    url: absoluteUrl(route),
    lastModified,
    changeFrequency: "daily",
    priority: route === "/Dashboard" ? 1 : 0.7,
  }));
}
