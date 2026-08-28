import { describe, expect, it } from "vitest";

import { getCanonicalAsset } from "@/data/asset-manifest";
import { GREEN_DROP_LARIAT } from "@/data/golden-path";

import { getRelicObjectMedia } from "./relic-object-media";

describe("relic object media manifest v0", () => {
  it("resolves RR-S3-N1 through one canonical media identity", () => {
    const media = getRelicObjectMedia(GREEN_DROP_LARIAT);
    const canonical = getCanonicalAsset("relic.greenDrop.sunlightMacro");

    expect(media).toMatchObject({
      relicId: "RR-S3-N1",
      canonicalAssetKey: "relic.greenDrop.sunlightMacro",
      backgroundIsolationStatus: "contextual-rectangle",
      alphaBounds: null,
      safeCrop: null,
      fallbackAssetKey: "relic.greenDrop.sunlightMacro",
      masterAsset: {
        publicPath: canonical.publicPath,
        width: canonical.width,
        height: canonical.height,
        sha256: canonical.sha256,
      },
    });
  });

  it("keeps geometry metadata normalized and derivatives ordered", () => {
    const media = getRelicObjectMedia(GREEN_DROP_LARIAT);

    for (const point of [media.visualCenter, media.anchor, media.focalPoint]) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(1);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(1);
    }

    expect(media.derivatives.strategy).toBe("next-image-runtime");
    expect(media.derivatives.widths).toEqual([480, 720, 1080, 1600]);
    expect([...media.derivatives.widths].sort((a, b) => a - b)).toEqual(
      media.derivatives.widths,
    );
    expect(media.aspectRatio).toBeCloseTo(1585 / 1982, 6);
  });
});
