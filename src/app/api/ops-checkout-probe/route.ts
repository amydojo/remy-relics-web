import { createHostedCheckout } from "@/commerce/checkout-service";
import { RelicUnavailableError } from "@/commerce/postgres-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return Response.json({ error: "preview_only" }, { status: 403 });
  }

  try {
    const result = await createHostedCheckout("green-drop-lariat");
    return Response.json(
      { created: true, orderId: result.orderId },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof RelicUnavailableError) {
      return Response.json({ created: false, error: "relic_unavailable" }, { status: 409 });
    }
    return Response.json(
      {
        created: false,
        error: "probe_failed",
        errorName: error instanceof Error ? error.name : "unknown",
        errorMessage: error instanceof Error ? error.message : "unknown",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
