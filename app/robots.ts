import type { MetadataRoute } from "next";

const APP_URL = process.env.APP_URL || "https://porrabros.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login"],
        // Todo lo demás requiere autenticación o es backend; no debe
        // indexarse aunque algún scraper acabe descubriendo las URLs.
        disallow: [
          "/api/",
          "/admin",
          "/admin/",
          "/g/",
          "/groups",
          "/groups/",
          "/join/",
          "/auth/",
          "/profile",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
