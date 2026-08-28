import type { Metadata } from "next";

import { MaterialMemoryScreen } from "@/components/remy/material-memory-screen";
import { foundationPageMetadata } from "@/seo/metadata";

export const metadata: Metadata = foundationPageMetadata("About the Archive");

export default function AboutRoute() {
  return <MaterialMemoryScreen />;
}
