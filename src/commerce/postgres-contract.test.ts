import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  RECORD_STRIPE_EVENT_ONCE_SQL,
  RESERVE_ONE_OF_ONE_SQL,
  TRANSFER_RESERVED_RELIC_SQL,
} from "./postgres-contract";

describe("Postgres commerce safety contract", () => {
  it("reserves one-of-one inventory with one conditional atomic update", () => {
    expect(RESERVE_ONE_OF_ONE_SQL).toContain("status = 'available'");
    expect(RESERVE_ONE_OF_ONE_SQL).toContain("quantity = 1");
    expect(RESERVE_ONE_OF_ONE_SQL).toContain("RETURNING *");
  });

  it("transfers only the matching reserved one-of-one row", () => {
    expect(TRANSFER_RESERVED_RELIC_SQL).toContain("status = 'reserved'");
    expect(TRANSFER_RESERVED_RELIC_SQL).toContain("reservation_token = $2");
    expect(TRANSFER_RESERVED_RELIC_SQL).toContain("quantity = 1");
  });

  it("deduplicates Stripe event application by an idempotency key", () => {
    expect(RECORD_STRIPE_EVENT_ONCE_SQL).toContain(
      "ON CONFLICT (event_key) DO NOTHING",
    );
  });

  it("locks the schema with unique transaction references and lifecycle checks", () => {
    const migration = readFileSync(
      join(process.cwd(), "db/migrations/001_commerce_v1_2.sql"),
      "utf8",
    );

    expect(migration).toContain("relic_id text NOT NULL UNIQUE");
    expect(migration).toContain(
      "stripe_checkout_session_id text NOT NULL UNIQUE",
    );
    expect(migration).toContain("event_key text NOT NULL UNIQUE");
    expect(migration).toContain("stripe_event_id text UNIQUE");
    expect(migration).toContain("commerce_relic_lifecycle_consistency");
  });
});
