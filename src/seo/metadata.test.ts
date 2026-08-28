import { describe, expect, it } from "vitest";

import { relicMetadata, sitePageMetadata } from "./metadata";
import { GREEN_DROP_LARIAT } from "../data/golden-path";

describe("V1 metadata", () => {
  it("publishes canonical, indexable metadata for site pages", () => {
    const metadata = sitePageMetadata({
      title: "Archive",
      description: "Transferred relic traces.",
      imageKey: "relic.redWindowRect.macroBokeh",
      path: "/archive",
    });

    expect(metadata.alternates).toEqual({ canonical: "/archive" });
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph).toMatchObject({
      title: "Archive",
      url: "/archive",
      images: [{ url: "/assets/figma/relic.redWindowRect.macroBokeh.png" }],
    });
  });

  it("keeps the permanent relic URL and canonical social asset", () => {
    expect(relicMetadata(GREEN_DROP_LARIAT)).toMatchObject({
      alternates: { canonical: "/relic/green-drop-lariat" },
      openGraph: {
        url: "/relic/green-drop-lariat",
        images: [{ url: "/assets/figma/relic.greenDrop.sunlightMacro.png" }],
      },
    });
  });
});
