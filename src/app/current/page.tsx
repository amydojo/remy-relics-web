import type { Metadata } from "next";

import { CurrentScreen } from "@/components/remy/current-screen";
import { foundationPageMetadata } from "@/seo/metadata";

export const metadata: Metadata = foundationPageMetadata("Current Recoveries");

export default function CurrentRoute() {
  return <CurrentScreen />;
}
