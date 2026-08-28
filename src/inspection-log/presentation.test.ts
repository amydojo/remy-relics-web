import { describe, expect, it } from "vitest";

import { formatInspectionTimestamp } from "./presentation";

describe("Inspection Log presentation", () => {
  it("formats recent observations without changing their truth", () => {
    const now = new Date(2026, 7, 27, 18, 0);

    expect(
      formatInspectionTimestamp(
        new Date(2026, 7, 27, 14, 12).toISOString(),
        now,
      ),
    ).toBe("TODAY 14:12");
    expect(
      formatInspectionTimestamp(
        new Date(2026, 7, 26, 9, 5).toISOString(),
        now,
      ),
    ).toBe("YESTERDAY 09:05");
    expect(
      formatInspectionTimestamp(
        new Date(2026, 6, 2, 8, 7).toISOString(),
        now,
      ),
    ).toBe("07.02.26 08:07");
  });
});
