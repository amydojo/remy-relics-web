import { getStripeClient } from "@/commerce/stripe-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_ID = "cs_test_a16x0i6v1Yl4oUWboFUVtExHPu08Sd45EonZmU4bo6bsJKh28qn2uB9eXf";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return Response.json({ error: "preview_only" }, { status: 403 });
  }

  const session = await getStripeClient().checkout.sessions.expire(SESSION_ID);

  return Response.json(
    { expired: session.status === "expired", sessionId: session.id },
    { headers: { "Cache-Control": "no-store" } },
  );
}
