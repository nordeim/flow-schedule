import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// robots.txt (Session 1, R-3): allow everything, point crawlers at the
// sitemap. Content is personal per-user; crawlers get the route surface,
// the data stays behind cookie auth.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
