import type { Metadata } from "next";
import { headers } from "next/headers";

import { CurrentScreen } from "@/components/remy/current-screen";
import { resolveRelicWithCommerceTruth } from "@/commerce/catalog-adapter";
import { readCommerceRelic } from "@/commerce/public-store";
import {
  GREEN_DROP_LARIAT,
  GREEN_DROP_LARIAT_SLUG,
} from "@/data/golden-path";
import { sitePageMetadata } from "@/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = sitePageMetadata({
  title: "Current Recoveries",
  description: "Current wearable artifacts held in the Remy Relics field archive.",
  imageKey: "relic.greenDrop.sunlightMacro",
  path: "/current",
});

export default async function CurrentRoute() {
  const requestHeaders = await headers();
  const commerceRecord = await readCommerceRelic(
    GREEN_DROP_LARIAT_SLUG,
    requestHeaders.get("x-remy-e2e-commerce-state"),
  );

  if (commerceRecord === null) {
    throw new Error("Canonical commerce truth is missing for Green Drop Lariat.");
  }

  const resolved = resolveRelicWithCommerceTruth(
    GREEN_DROP_LARIAT,
    commerceRecord,
  );

  return <CurrentScreen commerce={resolved.commerce} />;
}
