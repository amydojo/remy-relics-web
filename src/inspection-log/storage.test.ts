import { describe, expect, it } from "vitest";

import {
  createInspectionLogStore,
  INSPECTION_LOG_STORAGE_KEY,
  parseInspectionLogRecords,
  type StorageLike,
} from "./storage";

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();

  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, value),
  };
}

describe("Inspection Log storage", () => {
  it("records first and last inspection without claiming a purchase", () => {
    const storage = memoryStorage();
    let now = new Date("2026-08-26T20:00:00.000Z");
    const log = createInspectionLogStore({ storage, now: () => now });

    log.recordInspection("RR-S3-N1", "available");
    now = new Date("2026-08-26T21:00:00.000Z");
    const record = log.recordInspection("RR-S3-N1", "available");

    expect(record).toEqual({
      relicId: "RR-S3-N1",
      firstInspectedAt: "2026-08-26T20:00:00.000Z",
      lastInspectedAt: "2026-08-26T21:00:00.000Z",
      lastObservedStatus: "available",
      transferRevealAcknowledgedAt: null,
    });
    expect(JSON.parse(storage.getItem(INSPECTION_LOG_STORAGE_KEY) ?? "{}")).not.toHaveProperty(
      "purchased",
    );
  });

  it("holds an available-to-transferred change until its one-time reveal is acknowledged", () => {
    const storage = memoryStorage();
    let now = new Date("2026-08-26T20:00:00.000Z");
    const log = createInspectionLogStore({ storage, now: () => now });

    log.recordInspection("RR-S3-N1", "available");
    now = new Date("2026-08-27T20:00:00.000Z");
    log.recordInspection("RR-S3-N1", "transferred");

    expect(log.hasPendingTransferReveal("RR-S3-N1", "transferred")).toBe(true);
    expect(log.acknowledgeTransfer("RR-S3-N1")).toBe(true);
    expect(log.hasPendingTransferReveal("RR-S3-N1", "transferred")).toBe(false);
    expect(log.get("RR-S3-N1")?.lastObservedStatus).toBe("transferred");
  });

  it("recovers safely from malformed local data", () => {
    const storage = memoryStorage();
    storage.setItem(INSPECTION_LOG_STORAGE_KEY, "not-json");

    const log = createInspectionLogStore({ storage });

    expect(log.list()).toEqual([]);
    expect(parseInspectionLogRecords("not-json")).toEqual([]);
  });

  it("fails safely when browser storage is unavailable", () => {
    const inaccessibleStorage: StorageLike = {
      getItem: () => {
        throw new DOMException("Storage blocked", "SecurityError");
      },
      removeItem: () => {
        throw new DOMException("Storage blocked", "SecurityError");
      },
      setItem: () => {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    };
    const log = createInspectionLogStore({ storage: inaccessibleStorage });

    expect(log.list()).toEqual([]);
    expect(log.clear()).toBe(false);
    expect(log.recordInspection("RR-S3-N1", "available")).toMatchObject({
      relicId: "RR-S3-N1",
      lastObservedStatus: "available",
    });
  });
});
