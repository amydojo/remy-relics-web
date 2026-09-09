import { getStripeClient } from "@/commerce/stripe-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WEBHOOK_ENDPOINT_ID = "we_1UDcsq8GAPnzMaa3csT1m7QH";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return Response.json({ error: "preview_only" }, { status: 403 });
  }

  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  const branchHost =
    process.env.VERCEL_BRANCH_URL?.trim() || process.env.VERCEL_URL?.trim();

  if (!bypass || !branchHost) {
    return Response.json(
      {
        error: "missing_runtime_prerequisite",
        bypassPresent: Boolean(bypass),
        branchHostPresent: Boolean(branchHost),
      },
      { status: 412 },
    );
  }

  const url = new URL(`https://${branchHost}/api/stripe/webhook`);
  url.searchParams.set("x-vercel-protection-bypass", bypass);

  const stripe = getStripeClient();
  const endpoint = await stripe.webhookEndpoints.update(WEBHOOK_ENDPOINT_ID, {
    url: url.toString(),
  });

  return Response.json(
    {
      wired: true,
      endpointId: endpoint.id,
      enabled: endpoint.status === "enabled",
      targetHost: branchHost,
      bypassPresent: true,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
