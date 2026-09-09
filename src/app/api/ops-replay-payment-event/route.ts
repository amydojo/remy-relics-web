import { processStripeWebhookEvent } from "@/commerce/webhook-service";
import { getStripeClient } from "@/commerce/stripe-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENT_ID = "evt_1UDe1T8GAPnzMaa3BLOUk6Nd";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return Response.json({ error: "preview_only" }, { status: 403 });
  }

  const event = await getStripeClient().events.retrieve(EVENT_ID);
  const result = await processStripeWebhookEvent(event);

  return Response.json(
    { replayed: true, eventId: event.id, result },
    { headers: { "Cache-Control": "no-store" } },
  );
}
