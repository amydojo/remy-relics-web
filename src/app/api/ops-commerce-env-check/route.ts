import { getCommerceDb } from "@/commerce/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    databaseUrl: Boolean(process.env.DATABASE_URL?.trim()),
    stripeSecretKey: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    stripeWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
  };

  let database = {
    reachable: false,
    databaseName: null as string | null,
    commerceSchemaReady: false,
  };

  if (env.databaseUrl) {
    try {
      const [row] = await getCommerceDb()<{
        database_name: string;
        commerce_schema_ready: boolean;
      }[]>`
        SELECT
          current_database() AS database_name,
          to_regclass('public.commerce_relics') IS NOT NULL AS commerce_schema_ready
      `;

      database = {
        reachable: true,
        databaseName: row?.database_name ?? null,
        commerceSchemaReady: row?.commerce_schema_ready ?? false,
      };
    } catch {
      database = {
        reachable: false,
        databaseName: null,
        commerceSchemaReady: false,
      };
    }
  }

  return Response.json(
    { env, database },
    { headers: { "Cache-Control": "no-store" } },
  );
}
