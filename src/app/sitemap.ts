import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/config/site";

const V1_ROUTES = [
  "/",
  "/current",
  "/archive",
  "/log",
  "/about",
  "/relic/green-drop-lariat",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return V1_ROUTES.map((route) => ({
    url: new URL(route, siteUrl).toString(),
  }));
}
