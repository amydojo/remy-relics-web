import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/config/site";

const STATIC_ROUTE_SKELETONS = ["/", "/current", "/archive", "/log", "/about"];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();

  return STATIC_ROUTE_SKELETONS.map((route) => ({
    url: new URL(route, siteUrl).toString(),
  }));
}
