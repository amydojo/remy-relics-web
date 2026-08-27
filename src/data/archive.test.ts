import { describe, expect, it } from "vitest";

import { ARCHIVE_TRACES } from "./archive";

describe("Archive trace canon", () => {
  it("preserves spatial depth without inventing relic routes or commerce", () => {
    expect(ARCHIVE_TRACES.map(({ depth, index }) => ({ depth, index }))).toEqual([
      { index: 1, depth: "foreground" },
      { index: 2, depth: "mid" },
      { index: 3, depth: "far" },
      { index: 4, depth: "mid" },
    ]);

    for (const trace of ARCHIVE_TRACES) {
      expect(trace).not.toHaveProperty("slug");
      expect(trace).not.toHaveProperty("commerce");
    }
  });
});
