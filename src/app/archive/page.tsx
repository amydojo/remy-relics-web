import type { Metadata } from "next";

import { ArchiveScreen } from "@/components/remy/archive-screen";
import { sitePageMetadata } from "@/seo/metadata";

export const metadata: Metadata = sitePageMetadata({
  title: "Archive",
  description: "Transferred Remy Relics remain visible as traces in the field archive.",
  imageKey: "relic.redWindowRect.macroBokeh",
  path: "/archive",
});

export default function ArchiveRoute() {
  return <ArchiveScreen />;
}
