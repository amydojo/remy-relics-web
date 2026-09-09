import { randomUUID } from "node:crypto";

import type Stripe from "stripe";

import { parseRemyCheckoutMetadata } from "@/commerce/checkout-contract";
import { getCommerceDb } from "@/commerce/db";
import {
  RELEASE_RESERVATION_SQL,
  TRANSFER_RESERVED_RELIC_SQL,
} from "@/commerce/postgres-contract";
import { getStripeClient } from "@/commerce/stripe-client";

type OrderRow = {
  amount_cents: number;
  currency: string;
  id: string;
  payment_status: string;
  relic_id: string;
  reservation_token: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
};

function objectId(value: string | { id: string } | null) {
  return value === null ? null : typeof value === "string" ? value : value.id;
}

function sessionPrivateTruth(session: Stripe.Checkout.Session) {
  const shape = session as unknown as {
    collected_information?: {
      customer_details?: { email?: string | null } | null;
      shipping_details?: {
        address?: unknown | null;
        name?: string | null;
      } | null;
    } | null;
    customer_details?: { email?: string | null } | null;
  };

  return {
    customerEmail:
      shape.collected_information?.customer_details?.email ??
      shape.customer_details?.email ??
      null,
    shippingAddress:
      shape.collected_information?.shipping_details?.address ?? null,
    shippingName: shape.collected_information?.shipping_details?.name ?? null,
  };
}

export async function applyPaidSession(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
) {
  const metadata = parseRemyCheckoutMetadata(session.metadata);
  const paymentIntentId = objectId(session.payment_intent);

  if (!paymentIntentId) {
    throw new Error("Paid Checkout Session is missing its PaymentIntent.");
  }

  if (session.amount_total === null || !session.currency) {
    throw new Error("Paid Checkout Session is missing canonical amount truth.");
  }

  const privateTruth = sessionPrivateTruth(session);
  const currency = session.currency.toUpperCase();
  const sql = getCommerceDb();

  return sql.begin(async (tx) => {
    const orders = await tx`
      SELECT
        id,
        relic_id,
        reservation_token,
        amount_cents,
        currency,
        payment_status,
        stripe_checkout_session_id,
        stripe_payment_intent_id
      FROM commerce_orders
      WHERE id = ${metadata.orderId}
      FOR UPDATE
    `;

    const order = orders[0] as OrderRow | undefined;

    if (!order) {
      throw new Error("Stripe event references an unknown Remy order.");
    }

    if (
      order.relic_id !== metadata.relicId ||
      order.reservation_token !== metadata.reservationToken
    ) {
      throw new Error("Stripe reconciliation identity does not match the order.");
    }

    if (
      order.amount_cents !== session.amount_total ||
      order.currency !== currency
    ) {
      throw new Error("Stripe payment amount does not match server order truth.");
    }

    const claimed = await tx`
      INSERT INTO commerce_events (
        id,
        event_key,
        relic_id,
        order_id,
        event_type,
        source,
        stripe_event_id,
        reservation_token
      )
      VALUES (
        ${randomUUID()},
        ${event.id},
        ${order.relic_id},
        ${order.id},
        'payment_succeeded',
        'stripe',
        ${event.id},
        ${order.reservation_token}
      )
      ON CONFLICT (event_key) DO NOTHING
      RETURNING id
    `;

    if (claimed.length !== 1) {
      return "duplicate" as const;
    }

    if (order.payment_status === "paid" || order.payment_status === "refunded") {
      return "already_applied" as const;
    }

    const addressJson =
      privateTruth.shippingAddress === null
        ? null
        : JSON.stringify(privateTruth.shippingAddress);

    await tx`
      UPDATE commerce_orders
      SET
        stripe_checkout_session_id = ${session.id},
        stripe_payment_intent_id = ${paymentIntentId},
        customer_email = ${privateTruth.customerEmail},
        payment_status = 'paid',
        fulfillment_status = 'unfulfilled',
        shipping_name = ${privateTruth.shippingName},
        shipping_address = ${addressJson}::jsonb,
        updated_at = now()
      WHERE id = ${order.id}
    `;

    const transferDate = new Date(event.created * 1000)
      .toISOString()
      .slice(0, 10);

    const transferred = await tx.unsafe(TRANSFER_RESERVED_RELIC_SQL, [
      order.relic_id,
      order.reservation_token,
      transferDate,
    ]);

    if (transferred.length !== 1) {
      throw new Error(
        "Paid order could not atomically transfer its matching reservation.",
      );
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
        ${`${event.id}:transfer`},
        ${order.relic_id},
        ${order.id},
        'transfer_recorded',
        'system',
        ${order.reservation_token}
      )
      ON CONFLICT (event_key) DO NOTHING
    `;

    return "applied" as const;
  });
}

export async function applyReleaseSession(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  reason: "canceled" | "failed",
) {
  const metadata = parseRemyCheckoutMetadata(session.metadata);
  const sql = getCommerceDb();

  return sql.begin(async (tx) => {
    const orders = await tx`
      SELECT
        id,
        relic_id,
        reservation_token,
        amount_cents,
        currency,
        payment_status,
        stripe_checkout_session_id,
        stripe_payment_intent_id
      FROM commerce_orders
      WHERE id = ${metadata.orderId}
      FOR UPDATE
    `;

    const order = orders[0] as OrderRow | undefined;

    if (!order) {
      throw new Error("Stripe release event references an unknown Remy order.");
    }

    if (
      order.relic_id !== metadata.relicId ||
      order.reservation_token !== metadata.reservationToken
    ) {
      throw new Error("Stripe release identity does not match the order.");
    }

    const eventType =
      reason === "failed" ? "payment_failed" : "checkout_expired";

    const claimed = await tx`
      INSERT INTO commerce_events (
        id,
        event_key,
        relic_id,
        order_id,
        event_type,
        source,
        stripe_event_id,
        reservation_token
      )
      VALUES (
        ${randomUUID()},
        ${event.id},
        ${order.relic_id},
        ${order.id},
        ${eventType},
        'stripe',
        ${event.id},
        ${order.reservation_token}
      )
      ON CONFLICT (event_key) DO NOTHING
      RETURNING id
    `;

    if (claimed.length !== 1) {
      return "duplicate" as const;
    }

    if (order.payment_status === "paid" || order.payment_status === "refunded") {
      return "already_paid" as const;
    }

    await tx`
      UPDATE commerce_orders
      SET
        stripe_checkout_session_id = ${session.id},
        payment_status = ${reason === "failed" ? "failed" : "canceled"},
        fulfillment_status = 'canceled',
        updated_at = now()
      WHERE id = ${order.id}
    `;

    const released = await tx.unsafe(RELEASE_RESERVATION_SQL, [
      order.relic_id,
      order.reservation_token,
    ]);

    if (released.length === 1) {
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
          ${`${event.id}:release`},
          ${order.relic_id},
          ${order.id},
          'reservation_released',
          'system',
          ${order.reservation_token}
        )
        ON CONFLICT (event_key) DO NOTHING
      `;
    }

    return "released" as const;
  });
}

export async function applyRefund(event: Stripe.Event, refund: Stripe.Refund) {
  if (refund.status !== "succeeded") {
    return "ignored" as const;
  }

  const paymentIntentId = objectId(refund.payment_intent);

  if (!paymentIntentId) {
    return "ignored" as const;
  }

  const paymentIntent =
    await getStripeClient().paymentIntents.retrieve(paymentIntentId);
  const metadataOrderId = paymentIntent.metadata.order_id?.trim() || null;
  const sql = getCommerceDb();

  return sql.begin(async (tx) => {
    const orders = metadataOrderId
      ? await tx`
          SELECT
            id,
            relic_id,
            reservation_token,
            amount_cents,
            currency,
            payment_status,
            stripe_checkout_session_id,
            stripe_payment_intent_id
          FROM commerce_orders
          WHERE id = ${metadataOrderId}
             OR stripe_payment_intent_id = ${paymentIntentId}
          ORDER BY CASE WHEN id = ${metadataOrderId} THEN 0 ELSE 1 END
          LIMIT 1
          FOR UPDATE
        `
      : await tx`
          SELECT
            id,
            relic_id,
            reservation_token,
            amount_cents,
            currency,
            payment_status,
            stripe_checkout_session_id,
            stripe_payment_intent_id
          FROM commerce_orders
          WHERE stripe_payment_intent_id = ${paymentIntentId}
          LIMIT 1
          FOR UPDATE
        `;

    const order = orders[0] as OrderRow | undefined;

    if (!order) {
      throw new Error("Refund references an unknown Remy order.");
    }

    const claimed = await tx`
      INSERT INTO commerce_events (
        id,
        event_key,
        relic_id,
        order_id,
        event_type,
        source,
        stripe_event_id,
        reservation_token
      )
      VALUES (
        ${randomUUID()},
        ${event.id},
        ${order.relic_id},
        ${order.id},
        'refund_recorded',
        'stripe',
        ${event.id},
        ${order.reservation_token}
      )
      ON CONFLICT (event_key) DO NOTHING
      RETURNING id
    `;

    if (claimed.length !== 1) {
      return "duplicate" as const;
    }

    if (refund.amount >= order.amount_cents) {
      await tx`
        UPDATE commerce_orders
        SET
          stripe_payment_intent_id = COALESCE(
            stripe_payment_intent_id,
            ${paymentIntentId}
          ),
          payment_status = 'refunded',
          fulfillment_status = 'refunded',
          updated_at = now()
        WHERE id = ${order.id}
      `;

      return "refunded" as const;
    }

    return "partial_refund_recorded" as const;
  });
}

export async function processStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== "paid") {
        return "awaiting_payment" as const;
      }

      return applyPaidSession(event, session);
    }

    case "checkout.session.async_payment_succeeded":
      return applyPaidSession(
        event,
        event.data.object as Stripe.Checkout.Session,
      );

    case "checkout.session.async_payment_failed":
      return applyReleaseSession(
        event,
        event.data.object as Stripe.Checkout.Session,
        "failed",
      );

    case "checkout.session.expired":
      return applyReleaseSession(
        event,
        event.data.object as Stripe.Checkout.Session,
        "canceled",
      );

    case "refund.updated":
      return applyRefund(event, event.data.object as Stripe.Refund);

    default:
      return "ignored" as const;
  }
}
