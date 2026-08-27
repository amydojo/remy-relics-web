import type { Metadata } from "next";

import { RoutePlaceholder } from "@/components/foundation/route-placeholder";
import { foundationPageMetadata } from "@/seo/metadata";

export const metadata: Metadata = foundationPageMetadata("Archive");

export default function ArchiveRoute() {
  return (
    <RoutePlaceholder
      route="/archive"
      title="ARCHIVE"
      implementationPass="AFTER PASS 01"
    />
  );
}
