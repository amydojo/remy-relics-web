import type { Metadata } from "next";

import { CurrentScreen } from "@/components/remy/current-screen";
import { sitePageMetadata } from "@/seo/metadata";

export const metadata: Metadata = sitePageMetadata({
  title: "Current Recoveries",
  description: "Current wearable artifacts held in the Remy Relics field archive.",
  imageKey: "relic.greenDrop.sunlightMacro",
  path: "/current",
});

export default function CurrentRoute() {
  return <CurrentScreen />;
}
