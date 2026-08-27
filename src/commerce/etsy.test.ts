import { describe, expect, it } from "vitest";

import {
  CANONICAL_ETSY_LISTING_IDS,
  createEtsyHandoff,
  etsyListingUrl,
  parseEtsyListingId,
} from "./etsy";
import { GREEN_DROP_LARIAT } from "../data/golden-path";
import { transferRelic } from "../data/relic";

describe("Etsy handoff", () => {
  it("uses the exact verified RR-S3-N1 listing", () => {
    expect(etsyListingUrl(CANONICAL_ETSY_LISTING_IDS["RR-S3-N1"])).toBe(
      "https://www.etsy.com/listing/4555589415",
    );
  });

  it("rejects non-listing identifiers", () => {
    expect(() => parseEtsyListingId("shop/green-drop")).toThrow(TypeError);
    expect(() => parseEtsyListingId("0")).toThrow(TypeError);
  });

  it("removes commerce handoff when the permanent relic record transfers", () => {
    expect(createEtsyHandoff(transferRelic(GREEN_DROP_LARIAT))).toBeNull();
  });
});
