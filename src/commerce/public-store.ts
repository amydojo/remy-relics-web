import type { CommerceRelicRecord } from "@/commerce/model";
import {
  getCommerceRelicBySlug,
  getTransferConfirmationBySessionId,
  type PublicTransferConfirmation,
} from "@/commerce/postgres-store";

const E2E_FIXTURE_ENABLED =
  process.env.REMY_COMMERCE_E2E_FIXTURE === "1";

const GREEN_DROP_SLUG = "green-drop-lariat";
const GREEN_DROP_ETSY_URL = "https://www.etsy.com/listing/4555589415";

type FixtureState = CommerceRelicRecord["status"];

function normalizeFixtureState(value: string | null | undefined): FixtureState {
  if (
    value === "reserved" ||
    value === "transferred" ||
    value === "unavailable"
  ) {
    return value;
  }

  return "available";
}

function fixtureRelic(
  slug: string,
  requestedState?: string | null,
): CommerceRelicRecord | null {
  if (slug !== GREEN_DROP_SLUG) {
    return null;
  }

  const status = normalizeFixtureState(requestedState);
  const reserved = status === "reserved";

  return {
    currency: "USD",
    etsyUrl: GREEN_DROP_ETSY_URL,
    id: "commerce-rr-s3-n1",
    priceCents: 7800,
    quantity: status === "transferred" || status === "unavailable" ? 0 : 1,
    relicId: "RR-S3-N1",
    reservationToken: reserved ? "e2e-reservation" : null,
    reservedUntil: reserved ? "2026-09-09T06:00:00.000Z" : null,
    slug: GREEN_DROP_SLUG,
    status,
    stripePriceId: null,
    stripeProductId: null,
    title: "Green Drop Lariat",
    transferDate: status === "transferred" ? "2026-09-09" : null,
  };
}

function fixtureConfirmation(
  sessionId: string,
): PublicTransferConfirmation | null {
  const base = {
    amountCents: 7800,
    currency: "USD" as const,
    orderId: `e2e-order-${sessionId}`,
    relicId: "RR-S3-N1" as const,
    slug: GREEN_DROP_SLUG,
    title: "Green Drop Lariat",
  };

  if (sessionId === "e2e-transferred") {
    return {
      ...base,
      fulfillmentStatus: "unfulfilled",
      paymentStatus: "paid",
      relicStatus: "transferred",
      transferDate: "2026-09-09",
    };
  }

  if (sessionId === "e2e-pending") {
    return {
      ...base,
      fulfillmentStatus: "unfulfilled",
      paymentStatus: "pending",
      relicStatus: "reserved",
      transferDate: null,
    };
  }

  if (sessionId === "e2e-canceled") {
    return {
      ...base,
      fulfillmentStatus: "canceled",
      paymentStatus: "canceled",
      relicStatus: "available",
      transferDate: null,
    };
  }

  return null;
}

export async function readCommerceRelic(
  slug: string,
  requestedFixtureState?: string | null,
) {
  if (E2E_FIXTURE_ENABLED) {
    return fixtureRelic(slug, requestedFixtureState);
  }

  return getCommerceRelicBySlug(slug);
}

export async function readTransferConfirmation(sessionId: string) {
  if (E2E_FIXTURE_ENABLED) {
    return fixtureConfirmation(sessionId);
  }

  return getTransferConfirmationBySessionId(sessionId);
}
