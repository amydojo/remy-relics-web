import type { Metadata } from "next";

import {
  getCanonicalAsset,
  type FigmaAssetKey,
} from "@/data/asset-manifest";
import type { Relic } from "@/data/relic";

export const SITE_NAME = "Remy Relics" as const;
export const SITE_DESCRIPTION =
  "Wearable artifacts for minor personal emergencies." as const;

type SitePageMetadataOptions = {
  description: string;
  imageKey?: FigmaAssetKey;
  path: `/${string}` | "/";
  title: string;
};

function socialImage(imageKey: FigmaAssetKey, alt: string) {
  const image = getCanonicalAsset(imageKey);

  return {
    url: image.publicPath,
    width: image.width,
    height: image.height,
    alt,
  };
}

export function rootMetadata(metadataBase: URL): Metadata {
  const image = socialImage(
    "relic.evilEyeHex.macroBlackWhite",
    "Remy Relics field archive",
  );

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
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      images: [image.url],
    },
  };
}

export function sitePageMetadata({
  description,
  imageKey = "relic.evilEyeHex.macroBlackWhite",
  path,
  title,
}: SitePageMetadataOptions): Metadata {
  const image = socialImage(imageKey, `${title} — ${SITE_NAME}`);

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}

export function relicMetadata(relic: Relic): Metadata {
  const hero = getCanonicalAsset(relic.assets.social);
  const canonicalPath = `/relic/${encodeURIComponent(relic.slug)}`;
  const image = socialImage(relic.assets.social, relic.name);

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
