import { describe, expect, it } from "vitest";

import { MOTION_CONTRACT, MOTION_EASING, motionProfile } from "./contract";

describe("motion foundation", () => {
  it("keeps the frozen promotion timing while exposing the V1.1 object phases", () => {
    expect(MOTION_CONTRACT.currentToInspectionMs).toBe(260);
    expect(MOTION_CONTRACT.objectLiftMs).toBe(80);
    expect(MOTION_CONTRACT.objectTravelMs).toBe(180);
    expect(
      MOTION_CONTRACT.objectLiftMs + MOTION_CONTRACT.objectTravelMs,
    ).toBe(MOTION_CONTRACT.currentToInspectionMs);
    expect(MOTION_CONTRACT.creamToBlackCrossfadeMs).toBe(
      MOTION_CONTRACT.objectTravelMs,
    );
    expect(MOTION_CONTRACT.mediaDecodeBudgetMs).toBe(80);
    expect(MOTION_EASING).toBe("cubic-bezier(.22,1,.36,1)");
    expect(MOTION_CONTRACT.archiveRoamMs).toBe(240);
    expect(MOTION_CONTRACT.archiveToRecordMs).toBe(180);
    expect(MOTION_CONTRACT.transferRevealPauseMs).toBe(150);
    expect(MOTION_CONTRACT.transferRevealSettleMs).toBe(200);
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
