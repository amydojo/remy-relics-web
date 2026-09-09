import { buildCheckoutSessionParams } from "@/commerce/checkout-contract";
import {
  attachCheckoutSession,
  cancelPendingOrderBeforeStripeSession,
  reserveRelicAndCreatePendingOrder,
} from "@/commerce/postgres-store";
import { getCommerceSiteOrigin } from "@/commerce/server-env";
import { getStripeClient } from "@/commerce/stripe-client";

export async function createHostedCheckout(slug: string) {
  const pending = await reserveRelicAndCreatePendingOrder(slug);
  const stripe = getStripeClient();

  let session;

  try {
    session = await stripe.checkout.sessions.create(
      buildCheckoutSessionParams({
        expiresAt: pending.expiresAt,
        orderId: pending.orderId,
        relic: pending.relic,
        reservationToken: pending.reservationToken,
        siteOrigin: getCommerceSiteOrigin(),
      }),
      {
        idempotencyKey: `remy-checkout:${pending.orderId}`,
      },
    );
  } catch (error) {
    await cancelPendingOrderBeforeStripeSession(pending);
    throw error;
  }

  if (!session.url) {
    try {
      await stripe.checkout.sessions.expire(session.id);
      await cancelPendingOrderBeforeStripeSession(pending);
    } catch {
      // Keep the reservation if Stripe cannot prove the Session is neutralized.
    }

    throw new Error("Hosted Stripe Checkout Session did not return a URL.");
  }

  try {
    await attachCheckoutSession(pending, session.id);
  } catch (databaseError) {
    try {
      await stripe.checkout.sessions.expire(session.id);
      await cancelPendingOrderBeforeStripeSession(pending);
    } catch {
      // Do not release while a created Session might remain payable. Its
      // metadata can still reconcile a later verified webhook.
    }

    throw databaseError;
  }

  return {
    checkoutUrl: session.url,
    orderId: pending.orderId,
  };
}
