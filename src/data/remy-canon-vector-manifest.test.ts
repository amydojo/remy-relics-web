import { describe, expect, it } from "vitest";

import {
  REMY_CANON_VECTOR_FAMILY,
  REMY_CANON_VECTOR_KEYS,
  REMY_CANON_VECTOR_MANIFEST,
} from "./remy-canon-vector-manifest";

describe("Remy canon vector manifest", () => {
  it("tracks the complete six-state Figma canon family", () => {
    expect(REMY_CANON_VECTOR_FAMILY).toMatchObject({
      figmaNodeId: "1028:529",
      name: "RR/Remy Canon Vector",
    });
    expect(REMY_CANON_VECTOR_KEYS).toEqual([
      "base",
      "clipboard",
      "sleep",
      "box",
      "patrol",
      "lab",
    ]);
  });

  it("keeps every state unique and bound to a 160x160 SVG asset", () => {
    const assets = REMY_CANON_VECTOR_KEYS.map((key) => REMY_CANON_VECTOR_MANIFEST[key]);

    expect(new Set(assets.map((asset) => asset.figmaNodeId)).size).toBe(assets.length);
    expect(new Set(assets.map((asset) => asset.publicPath)).size).toBe(assets.length);

    for (const asset of assets) {
      expect(asset.width).toBe(160);
      expect(asset.height).toBe(160);
      expect(asset.publicPath).toMatch(/^\/assets\/remy-canon\/remy-[a-z]+\.svg$/);
      expect(asset.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(asset.svgStringFingerprint).toMatch(/^[a-f0-9]{8}$/);
    }
  });
});
