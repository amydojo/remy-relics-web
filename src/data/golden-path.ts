import { CANONICAL_ETSY_LISTING_IDS } from "@/commerce/etsy";
import type { AvailableRelic, RelicSlug } from "@/data/relic";

export const GREEN_DROP_LARIAT_SLUG = "green-drop-lariat" as const;
export const GREEN_DROP_FIGMA_LABEL = "GREEN TEARDROP BEND" as const;

export const GREEN_DROP_LARIAT = {
  id: "RR-S3-N1",
  slug: GREEN_DROP_LARIAT_SLUG,
  name: "Green Drop Lariat",
  status: "available",
  classification: "WEARABLE ARTIFACT",
  condition: "EVIDENCE RETAINED",
  assembly: "HAND ASSEMBLED",
  recoveredOn: "2026-08-24",
  materials: ["RESIN", "FOUND COMPONENTS"],
  assets: {
    hero: "relic.greenDrop.sunlightMacro",
    social: "relic.greenDrop.sunlightMacro",
    context: ["relic.greenDropBlackPearl.stylingPair"],
    evidence: [
      {
        index: 1,
        label: "FULL OBJECT",
        assetKey: "relic.greenDrop.sunlightMacro",
      },
      {
        index: 2,
        label: "SURFACE",
        assetKey: "relic.greenDrop.sunlightMacro",
      },
      {
        index: 3,
        label: "WORN SCALE",
        assetKey: "relic.greenDrop.wornMacro",
      },
    ],
  },
  commerce: {
    etsyListingId: CANONICAL_ETSY_LISTING_IDS["RR-S3-N1"],
    price: { amountMinor: 7800, currency: "USD" },
  },
  seo: {
    title: "Green Drop Lariat",
    description:
      "Green Drop Lariat in the Remy Relics archive — a hand-assembled wearable artifact.",
  },
} as const satisfies AvailableRelic;

export function getGoldenPathRelic(slug: RelicSlug) {
  return slug === GREEN_DROP_LARIAT_SLUG ? GREEN_DROP_LARIAT : null;
}

export function formatRelicPrice(relic: AvailableRelic) {
  return `$${relic.commerce.price.amountMinor / 100}`;
}

export function formatRecoveryDate(recoveredOn: AvailableRelic["recoveredOn"]) {
  const [year, month, day] = recoveredOn.split("-");
  return `${month}.${day}.${year.slice(-2)}`;
}
