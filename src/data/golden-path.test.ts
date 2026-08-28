import { describe, expect, it } from "vitest";

import {
  formatRecoveryDate,
  formatRelicPrice,
  getGoldenPathRelic,
  getGoldenPathRelicById,
  GREEN_DROP_FIGMA_LABEL,
  GREEN_DROP_LARIAT,
} from "./golden-path";

describe("PASS 01 relic canon", () => {
  it("locks RR-S3-N1 to the verified route, product truth, and Figma label", () => {
    expect(GREEN_DROP_LARIAT).toMatchObject({
      id: "RR-S3-N1",
      slug: "green-drop-lariat",
      name: "Green Drop Lariat",
      status: "available",
      commerce: {
        etsyListingId: "4555589415",
        price: { amountMinor: 7800, currency: "USD" },
      },
    });
    expect(GREEN_DROP_FIGMA_LABEL).toBe("GREEN TEARDROP BEND");
    expect(formatRelicPrice(GREEN_DROP_LARIAT)).toBe("$78");
    expect(formatRecoveryDate(GREEN_DROP_LARIAT.recoveredOn)).toBe("08.24.26");
    expect(GREEN_DROP_LARIAT.assets.evidence[2]).toEqual({
      index: 3,
      label: "WORN SCALE",
      assetKey: "relic.greenDrop.wornMacro",
    });
  });

  it("does not infer any other relic route", () => {
    expect(getGoldenPathRelic("green-drop-lariat")).toBe(GREEN_DROP_LARIAT);
    expect(getGoldenPathRelic("green-teardrop-bend")).toBeNull();
    expect(getGoldenPathRelicById("RR-S3-N1")).toBe(GREEN_DROP_LARIAT);
    expect(getGoldenPathRelicById("RR-UNMAPPED")).toBeNull();
  });
});
