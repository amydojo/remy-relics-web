import { describe, expect, it } from "vitest";

import { GREEN_DROP_LARIAT } from "@/data/golden-path";

import {
  formatCanonicalDate,
  formatCanonicalPrice,
  resolveRelicWithCommerceTruth,
} from "./catalog-adapter";
import type { CommerceRelicRecord } from "./model";

const SERVER_TRUTH: CommerceRelicRecord = {
  id: "commerce-rr-s3-n1",
  relicId: "RR-S3-N1",
  slug: "green-drop-lariat",
  title: "Green Drop Lariat",
  priceCents: 9100,
  currency: "USD",
  status: "available",
  quantity: 1,
  stripeProductId: null,
  stripePriceId: null,
  etsyUrl: "https://www.etsy.com/listing/4555589415",
  transferDate: null,
  reservationToken: null,
  reservedUntil: null,
};

describe("commerce catalog adapter", () => {
  it("uses server commerce truth instead of presentation price or status", () => {
    const resolved = resolveRelicWithCommerceTruth(
      GREEN_DROP_LARIAT,
      SERVER_TRUTH,
    );

    expect(resolved.commerce.priceCents).toBe(9100);
    expect(formatCanonicalPrice(resolved.commerce)).toBe("$91");
    expect(resolved.commerce.purchasable).toBe(true);
  });

  it("removes purchase price when server truth is not available", () => {
    const resolved = resolveRelicWithCommerceTruth(GREEN_DROP_LARIAT, {
      ...SERVER_TRUTH,
      status: "reserved",
    });

    expect(resolved.commerce.purchasable).toBe(false);
    expect(resolved.commerce.priceCents).toBeNull();
    expect(formatCanonicalPrice(resolved.commerce)).toBeNull();
  });

  it("formats canonical transfer dates without timezone inference", () => {
    expect(formatCanonicalDate("2026-09-09")).toBe("09.09.26");
    expect(formatCanonicalDate(null)).toBeNull();
  });

  it("rejects mismatched presentation and commerce identities", () => {
    expect(() =>
      resolveRelicWithCommerceTruth(GREEN_DROP_LARIAT, {
        ...SERVER_TRUTH,
        slug: "not-the-same-relic",
      }),
    ).toThrow(/canonical commerce identity/);
  });
});
