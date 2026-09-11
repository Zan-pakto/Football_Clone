import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jolloftips.com";
  const now = new Date();

  const routes = [
    "",
    "/all-matches",
    "/bet-of-the-day",
    "/bet-builder",
    "/leagues",
    "/progress",
    "/hit-and-win",
    "/how-it-works",
    "/blog",
    "/login",
    "/register",
    "/terms",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/all-matches" || route === "/bet-of-the-day" ? "hourly" : "daily",
    priority: route === "" ? 1.0 : route === "/all-matches" || route === "/bet-of-the-day" ? 0.9 : 0.7,
  }));
}
