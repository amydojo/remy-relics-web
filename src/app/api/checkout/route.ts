import { createHostedCheckout } from "@/commerce/checkout-service";
import {
  RelicNotFoundError,
  RelicUnavailableError,
} from "@/commerce/postgres-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("slug" in body) ||
    typeof body.slug !== "string" ||
    body.slug.length === 0 ||
    body.slug.length > 160
  ) {
    return Response.json({ error: "invalid_relic" }, { status: 400 });
  }

  try {
    const checkout = await createHostedCheckout(body.slug);

    return Response.json(
      { checkoutUrl: checkout.checkoutUrl },
      {
        headers: { "Cache-Control": "no-store" },
        status: 200,
      },
    );
  } catch (error) {
    if (error instanceof RelicNotFoundError) {
      return Response.json({ error: "relic_not_found" }, { status: 404 });
    }

    if (error instanceof RelicUnavailableError) {
      return Response.json({ error: "relic_unavailable" }, { status: 409 });
    }

    console.error("Checkout creation failed.", {
      error: error instanceof Error ? error.message : "unknown",
    });

    return Response.json({ error: "checkout_unavailable" }, { status: 500 });
  }
}
