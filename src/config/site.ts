type SiteEnvironment = {
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
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
