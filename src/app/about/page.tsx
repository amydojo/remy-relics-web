import type { Metadata } from "next";

import { MaterialMemoryScreen } from "@/components/remy/material-memory-screen";
import { sitePageMetadata } from "@/seo/metadata";

export const metadata: Metadata = sitePageMetadata({
  title: "Material Memory",
  description:
    "The material-memory field note for the Remy Relics archive: scratch, tarnish, pressure, heat, and contact.",
  imageKey: "packaging.crystalLariat.dossierHero",
  path: "/about",
});

export default function AboutRoute() {
  return <MaterialMemoryScreen />;
}
