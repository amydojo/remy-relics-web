import type { Relic, RelicId } from "@/data/relic";

declare const etsyListingIdBrand: unique symbol;

export type EtsyListingId = string & {
  readonly [etsyListingIdBrand]: true;
};

export type EtsyListingUrl = `https://www.etsy.com/listing/${string}`;

export const CANONICAL_ETSY_LISTING_IDS = {
  "RR-S3-N1": "4555589415" as EtsyListingId,
} as const satisfies Partial<Record<RelicId, EtsyListingId>>;

export function parseEtsyListingId(value: string): EtsyListingId {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new TypeError("Etsy listing IDs must contain only positive digits.");
  }

  return value as EtsyListingId;
}

export function etsyListingUrl(listingId: EtsyListingId): EtsyListingUrl {
  return `https://www.etsy.com/listing/${listingId}`;
}

export type EtsyHandoff = {
  event: "etsy_handoff_opened";
  href: EtsyListingUrl;
  listingId: EtsyListingId;
  rel: "external noopener noreferrer";
  target: "_blank";
};

export function createEtsyHandoff(relic: Relic): EtsyHandoff | null {
  if (relic.status !== "available") {
    return null;
  }

  const listingId = relic.commerce.etsyListingId;

  return {
    event: "etsy_handoff_opened",
    href: etsyListingUrl(listingId),
    listingId,
    rel: "external noopener noreferrer",
    target: "_blank",
  };
}
