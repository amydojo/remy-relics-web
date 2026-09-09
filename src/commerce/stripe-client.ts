import Stripe from "stripe";

import {
  getStripeSecretKey,
  getStripeWebhookSecret,
} from "@/commerce/server-env";

let client: Stripe | null = null;

export function getStripeClient() {
  if (client === null) {
    client = new Stripe(getStripeSecretKey(), {
      appInfo: {
        name: "Remy Relics",
        version: "1.2",
      },
      maxNetworkRetries: 2,
      timeout: 10_000,
    });
  }

  return client;
}

export function constructStripeWebhookEvent(
  payload: string,
  signature: string,
) {
  return getStripeClient().webhooks.constructEvent(
    payload,
    signature,
    getStripeWebhookSecret(),
  );
}
