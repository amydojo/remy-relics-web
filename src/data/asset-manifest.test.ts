import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CANONICAL_ASSET_MANIFEST,
  FIGMA_ASSET_KEYS,
} from "./asset-manifest";

describe("canonical Figma asset manifest", () => {
  it("has exactly one permanent local master per canonical key", () => {
    expect(Object.keys(CANONICAL_ASSET_MANIFEST)).toEqual([...FIGMA_ASSET_KEYS]);

    for (const entry of Object.values(CANONICAL_ASSET_MANIFEST)) {
      expect(entry.publicPath).not.toContain("figma.com/api/mcp/asset");
      const file = readFileSync(join(process.cwd(), "public", entry.publicPath));
      const digest = createHash("sha256").update(file).digest("hex");

      expect(file.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(file.readUInt32BE(16)).toBe(entry.width);
      expect(file.readUInt32BE(20)).toBe(entry.height);
      expect(digest).toBe(entry.sha256);
    }
  });

  it("keeps RR-S3-N1 mapped only to its verified green canonical masters", () => {
    const mapped = Object.values(CANONICAL_ASSET_MANIFEST).filter(
      (entry) => entry.commerce.kind === "relic",
    );

    expect(mapped.map((entry) => entry.key)).toEqual([
      "relic.greenDrop.sunlightMacro",
      "relic.greenDrop.wornMacro",
    ]);
  });
});
