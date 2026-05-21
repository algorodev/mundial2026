import type { MetadataRoute } from "next";
import { LANDINGS } from "@/lib/landings";

const APP_URL = process.env.APP_URL || "https://porrabros.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const landingEntries = Object.keys(LANDINGS).map((slug) => ({
    url: `${APP_URL}/porra-${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));
  return [
    {
      url: `${APP_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...landingEntries,
    {
      url: `${APP_URL}/login`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
