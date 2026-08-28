import type { Metadata } from "next";

import { ArrivalScreen } from "@/components/remy/arrival-screen";
import { SITE_DESCRIPTION, sitePageMetadata } from "@/seo/metadata";

export const metadata: Metadata = sitePageMetadata({
  title: "Arrival",
  description: SITE_DESCRIPTION,
  path: "/",
});

export default function ArrivalRoute() {
  return <ArrivalScreen />;
}
