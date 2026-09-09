import { describe, expect, it } from "vitest";

import type { CommerceRelicRecord } from "@/commerce/model";

import {
  buildCheckoutSessionParams,
  CHECKOUT_ALLOWED_COUNTRIES,
  CHECKOUT_TTL_SECONDS,
  parseRemyCheckoutMetadata,
} from "./checkout-contract";

const RELIC: CommerceRelicRecord = {
  currency: "USD",
  etsyUrl: "https://www.etsy.com/listing/4555589415",
  id: "commerce-rr-s3-n1",
  priceCents: 7800,
  quantity: 1,
  relicId: "RR-S3-N1",
  reservationToken: null,
  reservedUntil: null,
  slug: "green-drop-lariat",
  status: "available",
  stripePriceId: null,
  stripeProductId: null,
  title: "Green Drop Lariat",
  transferDate: null,
};

describe("Stripe Checkout contract", () => {
  it("builds one hosted physical-goods checkout from server commerce truth", () => {
    const now = new Date("2026-09-09T04:00:00.000Z");
    const expiresAt = new Date(now.getTime() + CHECKOUT_TTL_SECONDS * 1000);

    const params = buildCheckoutSessionParams({
      expiresAt,
      orderId: "order-1",
      relic: RELIC,
      reservationToken: "reservation-1",
      siteOrigin: "https://preview.example",
    });

    expect(params.mode).toBe("payment");
    expect(params.ui_mode).toBe("hosted");
    expect(params.payment_method_types).toEqual(["card"]);
    expect(params.shipping_address_collection?.allowed_countries).toEqual([
      ...CHECKOUT_ALLOWED_COUNTRIES,
    ]);
    expect(params.line_items?.[0]).toMatchObject({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: 7800,
      },
    });
    expect(params.expires_at).toBe(Math.floor(expiresAt.getTime() / 1000));
    expect(params.success_url).toContain("{CHECKOUT_SESSION_ID}");
  });

  it("does not use a client-owned amount or Stripe price identifier", () => {
    const params = buildCheckoutSessionParams({
      expiresAt: new Date("2026-09-09T04:30:00.000Z"),
      orderId: "order-1",
      relic: RELIC,
      reservationToken: "reservation-1",
      siteOrigin: "https://preview.example",
    });

    const lineItem = params.line_items?.[0];

    expect(lineItem).not.toHaveProperty("price");
    expect(lineItem).toMatchObject({
      price_data: {
        unit_amount: RELIC.priceCents,
      },
    });
  });

  it("round-trips the internal reconciliation metadata contract", () => {
    expect(
      parseRemyCheckoutMetadata({
        order_id: "order-1",
        relic_id: "RR-S3-N1",
        relic_slug: "green-drop-lariat",
        reservation_token: "reservation-1",
      }),
    ).toEqual({
      orderId: "order-1",
      relicId: "RR-S3-N1",
      relicSlug: "green-drop-lariat",
      reservationToken: "reservation-1",
    });
  });

  it("rejects incomplete webhook reconciliation metadata", () => {
    expect(() =>
      parseRemyCheckoutMetadata({
        order_id: "order-1",
      }),
    ).toThrow(/missing Remy reconciliation metadata/);
  });
});
