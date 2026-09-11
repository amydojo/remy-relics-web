import type { RelicId } from "@/data/relic";

export type OneOfOneInventoryState = {
  quantity: 0 | 1;
  relicId: RelicId;
  reservationToken: string | null;
  reservedUntil: string | null;
  status: "available" | "reserved" | "transferred" | "unavailable";
  transferDate: string | null;
};

export type ReservationAttempt =
  | { ok: true; state: OneOfOneInventoryState }
  | {
      ok: false;
      reason: "not_available" | "reservation_active";
      state: OneOfOneInventoryState;
    };

function isExpired(isoTimestamp: string, now: Date) {
  return new Date(isoTimestamp).getTime() <= now.getTime();
}

export function releaseExpiredReservation(
  state: OneOfOneInventoryState,
  now: Date,
): OneOfOneInventoryState {
  if (
    state.status !== "reserved" ||
    state.reservedUntil === null ||
    !isExpired(state.reservedUntil, now)
  ) {
    return state;
  }

  return {
    ...state,
    reservationToken: null,
    reservedUntil: null,
    status: "available",
  };
}

export function reserveOneOfOne(
  current: OneOfOneInventoryState,
  input: {
    now: Date;
    reservationToken: string;
    reservedUntil: string;
  },
): ReservationAttempt {
  const state = releaseExpiredReservation(current, input.now);

  if (state.status === "reserved") {
    return { ok: false, reason: "reservation_active", state };
  }

  if (state.status !== "available" || state.quantity !== 1) {
    return { ok: false, reason: "not_available", state };
  }

  return {
    ok: true,
    state: {
      ...state,
      reservationToken: input.reservationToken,
      reservedUntil: input.reservedUntil,
      status: "reserved",
    },
  };
}

export function releaseReservation(
  state: OneOfOneInventoryState,
  reservationToken: string,
): OneOfOneInventoryState {
  if (
    state.status !== "reserved" ||
    state.reservationToken !== reservationToken
  ) {
    return state;
  }

  return {
    ...state,
    reservationToken: null,
    reservedUntil: null,
    status: "available",
  };
}

export function transferReservedRelic(
  state: OneOfOneInventoryState,
  input: {
    reservationToken: string;
    transferDate: string;
  },
): OneOfOneInventoryState {
  if (
    state.status !== "reserved" ||
    state.reservationToken !== input.reservationToken
  ) {
    throw new TypeError(
      "Only the matching active reservation may transfer a one-of-one relic.",
    );
  }

  return {
    ...state,
    quantity: 0,
    reservationToken: null,
    reservedUntil: null,
    status: "transferred",
    transferDate: input.transferDate,
  };
}
