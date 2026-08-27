import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { REMY_STATE_MANIFEST } from "./remy-state-manifest";

describe("canonical Remy state assets", () => {
  it("keeps the exact Figma component exports", () => {
    for (const entry of Object.values(REMY_STATE_MANIFEST)) {
      const file = readFileSync(join(process.cwd(), "public", entry.publicPath));

      expect(file.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(file.readUInt32BE(16)).toBe(entry.width);
      expect(file.readUInt32BE(20)).toBe(entry.height);
      expect(createHash("sha256").update(file).digest("hex")).toBe(entry.sha256);
    }
  });
});
