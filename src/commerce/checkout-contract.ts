import type Stripe from "stripe";

import type { CommerceRelicRecord } from "@/commerce/model";

export const CHECKOUT_TTL_SECONDS = 30 * 60;
export const CHECKOUT_ALLOWED_COUNTRIES = ["US"] as const;

export type RemyCheckoutMetadata = {
  orderId: string;
  relicId: string;
  relicSlug: string;
  reservationToken: string;
};

export function buildCheckoutSessionParams(input: {
  expiresAt: Date;
  orderId: string;
  relic: Pick<
    CommerceRelicRecord,
    "currency" | "priceCents" | "relicId" | "slug" | "title"
  >;
  reservationToken: string;
  siteOrigin: string;
}): Stripe.Checkout.SessionCreateParams {
  const metadata = {
    order_id: input.orderId,
    relic_id: input.relic.relicId,
    relic_slug: input.relic.slug,
    reservation_token: input.reservationToken,
  };

  return {
    cancel_url: `${input.siteOrigin}/relic/${encodeURIComponent(
      input.relic.slug,
    )}?checkout=cancelled`,
    client_reference_id: input.orderId,
    expires_at: Math.floor(input.expiresAt.getTime() / 1000),
    line_items: [
      {
        price_data: {
          currency: input.relic.currency.toLowerCase(),
          product_data: {
            metadata: {
              relic_id: input.relic.relicId,
              relic_slug: input.relic.slug,
            },
            name: input.relic.title,
          },
          unit_amount: input.relic.priceCents,
        },
        quantity: 1,
      },
    ],
    metadata,
    mode: "payment",
    payment_intent_data: {
      metadata: {
        order_id: input.orderId,
        relic_id: input.relic.relicId,
      },
    },
    payment_method_types: ["card"],
    shipping_address_collection: {
      allowed_countries: [...CHECKOUT_ALLOWED_COUNTRIES],
    },
    success_url: `${input.siteOrigin}/transfer/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    ui_mode: "hosted",
  };
}

export function parseRemyCheckoutMetadata(
  metadata: Stripe.Metadata | null,
): RemyCheckoutMetadata {
  const orderId = metadata?.order_id?.trim();
  const relicId = metadata?.relic_id?.trim();
  const relicSlug = metadata?.relic_slug?.trim();
  const reservationToken = metadata?.reservation_token?.trim();

  if (!orderId || !relicId || !relicSlug || !reservationToken) {
    throw new TypeError(
      "Stripe Checkout Session is missing Remy reconciliation metadata.",
    );
  }

  return { orderId, relicId, relicSlug, reservationToken };
}
