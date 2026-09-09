import { randomUUID } from "node:crypto";

import { CHECKOUT_TTL_SECONDS } from "@/commerce/checkout-contract";
import { getCommerceDb } from "@/commerce/db";
import type { CommerceRelicRecord } from "@/commerce/model";
import {
  RELEASE_RESERVATION_SQL,
  RESERVE_ONE_OF_ONE_SQL,
} from "@/commerce/postgres-contract";
import type { RelicId, RelicSlug } from "@/data/relic";

type CommerceRelicRow = {
  currency: string;
  etsy_url: string | null;
  id: string;
  price_cents: number;
  quantity: number;
  relic_id: RelicId;
  reservation_token: string | null;
  reserved_until: Date | string | null;
  slug: RelicSlug;
  status: CommerceRelicRecord["status"];
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  title: string;
  transfer_date: Date | string | null;
};

export type PendingCheckout = {
  expiresAt: Date;
  orderId: string;
  relic: CommerceRelicRecord;
  reservationToken: string;
};

export class RelicNotFoundError extends Error {
  constructor() {
    super("Relic not found.");
    this.name = "RelicNotFoundError";
  }
}

export class RelicUnavailableError extends Error {
  constructor() {
    super("Relic is not available for checkout.");
    this.name = "RelicUnavailableError";
  }
}

function isoTimestamp(value: Date | string | null) {
  if (value === null) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function isoDate(value: Date | string | null) {
  if (value === null) {
    return null;
  }

  return (value instanceof Date ? value.toISOString() : value).slice(0, 10);
}

function mapRelic(row: CommerceRelicRow): CommerceRelicRecord {
  return {
    currency: "USD",
    etsyUrl: row.etsy_url,
    id: row.id,
    priceCents: row.price_cents,
    quantity: row.quantity === 1 ? 1 : 0,
    relicId: row.relic_id,
    reservationToken: row.reservation_token,
    reservedUntil: isoTimestamp(row.reserved_until),
    slug: row.slug,
    status: row.status,
    stripePriceId: row.stripe_price_id,
    stripeProductId: row.stripe_product_id,
    title: row.title,
    transferDate: isoDate(row.transfer_date),
  };
}

export async function reserveRelicAndCreatePendingOrder(
  slug: string,
): Promise<PendingCheckout> {
  const sql = getCommerceDb();
  const candidates = await sql`
    SELECT relic_id
    FROM commerce_relics
    WHERE slug = ${slug}
    LIMIT 1
  `;

  const candidate = candidates[0] as { relic_id: RelicId } | undefined;

  if (!candidate) {
    throw new RelicNotFoundError();
  }

  const orderId = randomUUID();
  const reservationToken = randomUUID();
  const expiresAt = new Date(Date.now() + CHECKOUT_TTL_SECONDS * 1000);

  return sql.begin(async (tx) => {
    const reservedRows = await tx.unsafe(RESERVE_ONE_OF_ONE_SQL, [
      candidate.relic_id,
      reservationToken,
      expiresAt.toISOString(),
    ]);

    const reserved = reservedRows[0] as CommerceRelicRow | undefined;

    if (!reserved) {
      throw new RelicUnavailableError();
    }

    await tx`
      INSERT INTO commerce_orders (
        id,
        stripe_checkout_session_id,
        stripe_payment_intent_id,
        relic_id,
        reservation_token,
        checkout_expires_at,
        amount_cents,
        currency,
        payment_status,
        fulfillment_status
      )
      VALUES (
        ${orderId},
        NULL,
        NULL,
        ${reserved.relic_id},
        ${reservationToken},
        ${expiresAt.toISOString()},
        ${reserved.price_cents},
        'USD',
        'pending',
        'unfulfilled'
      )
    `;

    await tx`
      INSERT INTO commerce_events (
        id,
        event_key,
        relic_id,
        order_id,
        event_type,
        source,
        reservation_token
      )
      VALUES (
        ${randomUUID()},
        ${`reservation:${orderId}`},
        ${reserved.relic_id},
        ${orderId},
        'reservation_started',
        'system',
        ${reservationToken}
      )
    `;

    return {
      expiresAt,
      orderId,
      relic: mapRelic(reserved),
      reservationToken,
    };
  });
}

export async function attachCheckoutSession(
  pending: PendingCheckout,
  sessionId: string,
) {
  const sql = getCommerceDb();

  await sql.begin(async (tx) => {
    const rows = await tx`
      UPDATE commerce_orders
      SET
        stripe_checkout_session_id = ${sessionId},
        updated_at = now()
      WHERE id = ${pending.orderId}
        AND (
          stripe_checkout_session_id IS NULL
          OR stripe_checkout_session_id = ${sessionId}
        )
      RETURNING id
    `;

    if (rows.length !== 1) {
      throw new Error("Could not attach Stripe Checkout Session to pending order.");
    }

    await tx`
      INSERT INTO commerce_events (
        id,
        event_key,
        relic_id,
        order_id,
        event_type,
        source,
        reservation_token
      )
      VALUES (
        ${randomUUID()},
        ${`checkout:${pending.orderId}`},
        ${pending.relic.relicId},
        ${pending.orderId},
        'checkout_created',
        'system',
        ${pending.reservationToken}
      )
      ON CONFLICT (event_key) DO NOTHING
    `;
  });
}

export async function cancelPendingOrderBeforeStripeSession(
  pending: PendingCheckout,
) {
  const sql = getCommerceDb();

  await sql.begin(async (tx) => {
    const canceled = await tx`
      UPDATE commerce_orders
      SET
        payment_status = 'canceled',
        fulfillment_status = 'canceled',
        updated_at = now()
      WHERE id = ${pending.orderId}
        AND stripe_checkout_session_id IS NULL
        AND payment_status = 'pending'
      RETURNING id
    `;

    if (canceled.length !== 1) {
      return;
    }

    await tx.unsafe(RELEASE_RESERVATION_SQL, [
      pending.relic.relicId,
      pending.reservationToken,
    ]);

    await tx`
      INSERT INTO commerce_events (
        id,
        event_key,
        relic_id,
        order_id,
        event_type,
        source,
        reservation_token
      )
      VALUES (
        ${randomUUID()},
        ${`reservation-release:pre-session:${pending.orderId}`},
        ${pending.relic.relicId},
        ${pending.orderId},
        'reservation_released',
        'system',
        ${pending.reservationToken}
      )
      ON CONFLICT (event_key) DO NOTHING
    `;
  });
}
