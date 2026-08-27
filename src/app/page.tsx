import type { Metadata } from "next";

import { ArrivalScreen } from "@/components/remy/arrival-screen";
import { foundationPageMetadata } from "@/seo/metadata";

export const metadata: Metadata = foundationPageMetadata("Arrival");

export default function ArrivalRoute() {
  return <ArrivalScreen />;
}
