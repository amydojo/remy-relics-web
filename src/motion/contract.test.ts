import { describe, expect, it } from "vitest";

import { MOTION_CONTRACT, motionProfile } from "./contract";

describe("motion foundation", () => {
  it("keeps the frozen promotion timing", () => {
    expect(MOTION_CONTRACT.currentToInspectionMs).toBe(260);
    expect(MOTION_CONTRACT.depthMultipliers).toEqual({
      foreground: 1,
      mid: 0.6,
      far: 0.35,
    });
  });

  it("removes parallax and overshoot for reduced motion", () => {
    expect(motionProfile(true)).toEqual({
      allowOvershoot: false,
      allowParallax: false,
      dissolveMs: 120,
      settleMs: 120,
    });
  });
});
