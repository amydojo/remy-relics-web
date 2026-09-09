import type { RelicId, RelicSlug } from "@/data/relic";

export const COMMERCE_RELIC_STATUSES = [
  "available",
  "reserved",
  "transferred",
  "unavailable",
] as const;

export type CommerceRelicStatus = (typeof COMMERCE_RELIC_STATUSES)[number];
export type CommerceCurrency = "USD";

export type CommerceRelicRecord = {
  currency: CommerceCurrency;
  etsyUrl: string | null;
  id: string;
  priceCents: number;
  quantity: 0 | 1;
  relicId: RelicId;
  reservationToken: string | null;
  reservedUntil: string | null;
  slug: RelicSlug;
  status: CommerceRelicStatus;
  stripePriceId: string | null;
  stripeProductId: string | null;
  title: string;
  transferDate: string | null;
};

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "canceled";

export type FulfillmentStatus =
  | "unfulfilled"
  | "fulfilled"
  | "refunded"
  | "canceled";

export type OrderRecord = {
  amountCents: number;
  currency: CommerceCurrency;
  checkoutExpiresAt: string;
  fulfillmentStatus: FulfillmentStatus;
  id: string;
  paymentStatus: PaymentStatus;
  relicId: RelicId;
  reservationToken: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
};

export function isPurchasableCommerceRelic(
  relic: Pick<CommerceRelicRecord, "quantity" | "status">,
) {
  return relic.status === "available" && relic.quantity === 1;
}

export function assertCanonicalCommerceIdentity(
  presentation: { id: RelicId; slug: RelicSlug },
  commerce: Pick<CommerceRelicRecord, "relicId" | "slug">,
) {
  if (
    presentation.id !== commerce.relicId ||
    presentation.slug !== commerce.slug
  ) {
    throw new TypeError(
      "Presentation identity does not match canonical commerce identity.",
    );
  }
}
