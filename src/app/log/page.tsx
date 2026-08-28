import type { Metadata } from "next";

import { InspectionLogScreen } from "@/components/remy/inspection-log-screen";
import { foundationPageMetadata } from "@/seo/metadata";

export const metadata: Metadata = foundationPageMetadata("Your Inspection Log");

export default function InspectionLogRoute() {
  return <InspectionLogScreen />;
}
