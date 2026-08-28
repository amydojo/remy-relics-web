import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RelicExperience } from "@/components/remy/relic-experience";
import {
  getGoldenPathRelic,
  GREEN_DROP_FIGMA_LABEL,
  GREEN_DROP_LARIAT_SLUG,
} from "@/data/golden-path";
import { relicMetadata } from "@/seo/metadata";

export function generateStaticParams() {
  return [{ slug: GREEN_DROP_LARIAT_SLUG }];
}

export async function generateMetadata(
  props: PageProps<"/relic/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const relic = getGoldenPathRelic(slug);

  if (relic === null) {
    notFound();
  }

  return relicMetadata(relic);
}

export default async function RelicRoute(props: PageProps<"/relic/[slug]">) {
  const { slug } = await props.params;
  const { view } = await props.searchParams;

  const relic = getGoldenPathRelic(slug);

  if (relic === null) {
    notFound();
  }

  return (
    <RelicExperience
      displayLabel={GREEN_DROP_FIGMA_LABEL}
      initialMode={view === "record" ? "record" : "inspection"}
      relic={relic}
    />
  );
}
