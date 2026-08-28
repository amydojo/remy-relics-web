import { describe, expect, it } from "vitest";

import { getFlipTransform, getInspectionHeroRect } from "./object-lift";

describe("object lift FLIP geometry", () => {
  it.each([320, 390, 430])(
    "derives canonical inspection geometry from a %ipx current surface",
    (viewportWidth) => {
      const screenWidth = Math.min(viewportWidth, 390);
      const screenLeft = (viewportWidth - screenWidth) / 2;
      const destination = getInspectionHeroRect({
        left: screenLeft,
        top: 0,
        width: screenWidth,
        height: 844,
      });

      expect(destination).toEqual({
        left: screenLeft + 16,
        top: 70,
        width: screenWidth - 32,
        height: 318,
      });
    },
  );

  it("maps a partially clipped Current object into Inspection without layout tweening", () => {
    const source = {
      left: -27,
      top: 114,
      width: 272,
      height: 369,
    };
    const destination = {
      left: 16,
      top: 70,
      width: 358,
      height: 318,
    };

    const flip = getFlipTransform(source, destination);

    expect(flip.x).toBe(-43);
    expect(flip.y).toBe(44);
    expect(flip.scaleX).toBeCloseTo(272 / 358, 6);
    expect(flip.scaleY).toBeCloseTo(369 / 318, 6);
  });

  it("rejects impossible destination geometry", () => {
    expect(() =>
      getFlipTransform(
        { left: 0, top: 0, width: 100, height: 100 },
        { left: 0, top: 0, width: 0, height: 100 },
      ),
    ).toThrow(RangeError);
  });
});
