import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/foundation/route-placeholder";
import { foundationPageMetadata } from "@/seo/metadata";

export const metadata: Metadata = foundationPageMetadata("About the Archive");

export default function AboutRoute() {
  return (
    <RoutePlaceholder
      route="/about"
      title="ABOUT THE ARCHIVE"
      implementationPass="AFTER PASS 01"
    />
  );
}
