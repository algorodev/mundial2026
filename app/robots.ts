import type { MetadataRoute } from "next";

const APP_URL = process.env.APP_URL || "https://porrabros.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Allow tiene precedencia sobre Disallow en googlebot. Habilitamos
        // las landings SEO y las porras oficiales públicas (prefijo
        // /g/oficial-); el resto de /g sigue cerrado (grupos privados).
        allow: [
          "/",
          "/login",
          "/register",
          "/about",
          "/privacidad",
          "/terminos",
          "/cookies",
          "/porra-mundial-2026",
          "/porra-champions-2025-26",
          "/porra-laliga-2026-27",
          "/g/oficial-",
        ],
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
