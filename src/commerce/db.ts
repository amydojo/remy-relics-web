import postgres from "postgres";

import { getDatabaseUrl } from "@/commerce/server-env";

export type CommerceDb = ReturnType<typeof postgres>;

let client: CommerceDb | null = null;

export function getCommerceDb(): CommerceDb {
  if (client === null) {
    client = postgres(getDatabaseUrl(), {
      connect_timeout: 10,
      idle_timeout: 20,
      max: 1,
      prepare: false,
    });
  }

  return client;
}
