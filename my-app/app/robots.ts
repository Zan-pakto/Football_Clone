import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jolloftips.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/admin/*",
          "/api/admin",
          "/api/admin/",
          "/api/admin/*",
          "/account",
          "/account/",
          "/account/*",
          "/api/",
          "/api/*",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/admin/*",
          "/api/admin",
          "/api/admin/",
          "/api/admin/*",
          "/account",
          "/account/",
          "/account/*",
          "/api/",
          "/api/*",
        ],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/admin/*",
          "/api/admin",
          "/api/admin/",
          "/api/admin/*",
          "/account",
          "/account/",
          "/account/*",
          "/api/",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
