import type { Metadata } from "next";

import { ArchiveScreen } from "@/components/remy/archive-screen";
import { foundationPageMetadata } from "@/seo/metadata";

export const metadata: Metadata = foundationPageMetadata("Archive");

export default function ArchiveRoute() {
  return <ArchiveScreen />;
}
