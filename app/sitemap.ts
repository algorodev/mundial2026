import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, tournaments } from "@/lib/db/schema";
import { LANDINGS } from "@/lib/landings";

const APP_URL = process.env.APP_URL || "https://porrabros.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const landingEntries = Object.keys(LANDINGS).map((slug) => ({
    url: `${APP_URL}/porra-${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Porras oficiales públicas — sus leaderboards son indexables.
  let officialEntries: MetadataRoute.Sitemap = [];
  try {
    const rows = await db
      .select({ slug: groups.slug })
      .from(groups)
      .innerJoin(tournaments, eq(tournaments.officialGroupId, groups.id))
      .where(eq(groups.visibility, "public"));
    officialEntries = rows.map((r) => ({
      url: `${APP_URL}/g/${r.slug}/leaderboard`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch {
    // Si la DB no responde al build, mejor sitemap sin oficiales que fallo.
  }

  return [
    {
      url: `${APP_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...landingEntries,
    ...officialEntries,
    {
      url: `${APP_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${APP_URL}/login`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${APP_URL}/register`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
