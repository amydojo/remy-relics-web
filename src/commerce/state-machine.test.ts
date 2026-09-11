import { describe, expect, it } from "vitest";

import {
  releaseExpiredReservation,
  releaseReservation,
  reserveOneOfOne,
  transferReservedRelic,
  type OneOfOneInventoryState,
} from "./state-machine";

const AVAILABLE: OneOfOneInventoryState = {
  relicId: "RR-S3-N1",
  status: "available",
  quantity: 1,
  reservationToken: null,
  reservedUntil: null,
  transferDate: null,
};

describe("one-of-one inventory state machine", () => {
  it("allows exactly one live reservation in sequence", () => {
    const first = reserveOneOfOne(AVAILABLE, {
      now: new Date("2026-09-08T20:00:00-07:00"),
      reservationToken: "reservation-a",
      reservedUntil: "2026-09-08T20:15:00-07:00",
    });

    expect(first.ok).toBe(true);
    if (!first.ok) {
      throw new Error("Expected first reservation to succeed.");
    }

    const second = reserveOneOfOne(first.state, {
      now: new Date("2026-09-08T20:01:00-07:00"),
      reservationToken: "reservation-b",
      reservedUntil: "2026-09-08T20:16:00-07:00",
    });

    expect(second).toMatchObject({
      ok: false,
      reason: "reservation_active",
    });
  });

  it("releases canceled and expired reservations without transferring", () => {
    const reserved = reserveOneOfOne(AVAILABLE, {
      now: new Date("2026-09-08T20:00:00-07:00"),
      reservationToken: "reservation-a",
      reservedUntil: "2026-09-08T20:15:00-07:00",
    });
    if (!reserved.ok) {
      throw new Error("Expected reservation to succeed.");
    }

    expect(releaseReservation(reserved.state, "reservation-a")).toEqual(
      AVAILABLE,
    );
    expect(
      releaseExpiredReservation(
        reserved.state,
        new Date("2026-09-08T20:16:00-07:00"),
      ),
    ).toEqual(AVAILABLE);
  });

  it("transfers only the relic held by the matching verified reservation", () => {
    const reserved = reserveOneOfOne(AVAILABLE, {
      now: new Date("2026-09-08T20:00:00-07:00"),
      reservationToken: "reservation-a",
      reservedUntil: "2026-09-08T20:15:00-07:00",
    });
    if (!reserved.ok) {
      throw new Error("Expected reservation to succeed.");
    }

    expect(() =>
      transferReservedRelic(reserved.state, {
        reservationToken: "reservation-b",
        transferDate: "2026-09-08",
      }),
    ).toThrow(/matching active reservation/);

    expect(
      transferReservedRelic(reserved.state, {
        reservationToken: "reservation-a",
        transferDate: "2026-09-08",
      }),
    ).toMatchObject({
      relicId: "RR-S3-N1",
      status: "transferred",
      quantity: 0,
      reservationToken: null,
      transferDate: "2026-09-08",
    });
  });

  it("does not permit a transferred relic to be reserved again", () => {
    const attempt = reserveOneOfOne(
      {
        ...AVAILABLE,
        status: "transferred",
        quantity: 0,
        transferDate: "2026-09-08",
      },
      {
        now: new Date("2026-09-08T21:00:00-07:00"),
        reservationToken: "reservation-c",
        reservedUntil: "2026-09-08T21:15:00-07:00",
      },
    );

    expect(attempt).toMatchObject({
      ok: false,
      reason: "not_available",
    });
  });
});
