import type { Metadata } from "next";

import { InspectionLogScreen } from "@/components/remy/inspection-log-screen";
import { sitePageMetadata } from "@/seo/metadata";

export const metadata: Metadata = sitePageMetadata({
  title: "Your Inspection Log",
  description:
    "A local-device record of Remy Relics you have inspected, with no account required.",
  imageKey: "relic.greenDrop.sunlightMacro",
  path: "/log",
});

export default function InspectionLogRoute() {
  return <InspectionLogScreen />;
}
