type SiteEnvironment = {
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
};

export type MenuLinkEnvironment = {
  NEXT_PUBLIC_ETSY_SHOP_URL?: string;
  NEXT_PUBLIC_INSTAGRAM_URL?: string;
};

export type MenuExternalLinks = {
  etsyShop: string | null;
  instagram: string | null;
};

function withProtocol(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function getSiteUrl(environment?: SiteEnvironment) {
  const resolvedEnvironment = environment ?? {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  };
  const configuredUrl =
    resolvedEnvironment.NEXT_PUBLIC_SITE_URL ??
    resolvedEnvironment.VERCEL_PROJECT_PRODUCTION_URL ??
    "http://localhost:3000";
  const url = new URL(withProtocol(configuredUrl));

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError("The site URL must use http or https.");
  }

  return url;
}

function getOptionalExternalUrl(value: string | undefined) {
  if (value === undefined || value.trim() === "") {
    return null;
  }

  try {
    const url = new URL(value);

    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function getMenuExternalLinks(
  environment: MenuLinkEnvironment = {
    NEXT_PUBLIC_ETSY_SHOP_URL: process.env.NEXT_PUBLIC_ETSY_SHOP_URL,
    NEXT_PUBLIC_INSTAGRAM_URL: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
  },
): MenuExternalLinks {
  return {
    etsyShop: getOptionalExternalUrl(environment.NEXT_PUBLIC_ETSY_SHOP_URL),
    instagram: getOptionalExternalUrl(environment.NEXT_PUBLIC_INSTAGRAM_URL),
  };
}
