import { processStripeWebhookEvent } from "@/commerce/webhook-service";
import { constructStripeWebhookEvent } from "@/commerce/stripe-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "missing_signature" }, { status: 400 });
  }

  const payload = await request.text();

  let event;

  try {
    event = constructStripeWebhookEvent(payload, signature);
  } catch {
    return Response.json({ error: "invalid_signature" }, { status: 400 });
  }

  try {
    const outcome = await processStripeWebhookEvent(event);

    return Response.json(
      { received: true, outcome },
      { headers: { "Cache-Control": "no-store" }, status: 200 },
    );
  } catch (error) {
    console.error("Stripe webhook reconciliation failed.", {
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : "unknown",
    });

    return Response.json({ error: "reconciliation_failed" }, { status: 500 });
  }
}
