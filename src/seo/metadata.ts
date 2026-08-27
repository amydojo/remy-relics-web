import type { Metadata } from "next";

import { getCanonicalAsset } from "@/data/asset-manifest";
import type { Relic } from "@/data/relic";

export const SITE_NAME = "Remy Relics" as const;
export const SITE_DESCRIPTION =
  "Wearable artifacts for minor personal emergencies." as const;

export function rootMetadata(metadataBase: URL): Metadata {
  return {
    metadataBase,
    title: {
      default: SITE_NAME,
      template: `%s · ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: "/",
    },
  };
}

export function foundationPageMetadata(title: string): Metadata {
  return {
    title,
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export function relicMetadata(relic: Relic): Metadata {
  const hero = getCanonicalAsset(relic.assets.social);
  const canonicalPath = `/relic/${encodeURIComponent(relic.slug)}`;
  const image = {
    url: hero.publicPath,
    width: hero.width,
    height: hero.height,
    alt: relic.name,
  };

  return {
    title: relic.seo.title,
    description: relic.seo.description,
    alternates: { canonical: canonicalPath },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: relic.seo.title,
      description: relic.seo.description,
      url: canonicalPath,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: relic.seo.title,
      description: relic.seo.description,
      images: [hero.publicPath],
    },
  };
}
