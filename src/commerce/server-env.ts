function required(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }

  return value;
}

export function getDatabaseUrl() {
  return required("DATABASE_URL");
}

export function getStripeSecretKey() {
  return required("STRIPE_SECRET_KEY");
}

export function getStripeWebhookSecret() {
  return required("STRIPE_WEBHOOK_SECRET");
}

export function getCommerceSiteOrigin() {
  const vercelHost =
    process.env.VERCEL_BRANCH_URL?.trim() || process.env.VERCEL_URL?.trim();

  const raw =
    process.env.COMMERCE_SITE_URL?.trim() ||
    (vercelHost ? `https://${vercelHost}` : undefined) ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!raw) {
    throw new Error(
      "Missing commerce site origin. Set COMMERCE_SITE_URL or NEXT_PUBLIC_SITE_URL.",
    );
  }

  const url = new URL(raw);

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Commerce site origin must use http or https.");
  }

  return url.origin;
}
