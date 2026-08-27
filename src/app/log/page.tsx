import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/foundation/route-placeholder";
import { foundationPageMetadata } from "@/seo/metadata";

export const metadata: Metadata = foundationPageMetadata("Your Inspection Log");

export default function InspectionLogRoute() {
  return (
    <RoutePlaceholder
      route="/log"
      title="YOUR INSPECTION LOG"
      implementationPass="AFTER PASS 01"
    />
  );
}
