import type { EtsyListingId } from "@/commerce/etsy";
import type { FigmaAssetKey } from "@/data/asset-manifest";

export type RelicId = `RR-${string}`;
export type RelicSlug = string;
export type RelicStatus = "available" | "transferred";
export type IsoDate = `${number}-${number}-${number}`;

export type Money = {
  amountMinor: number;
  currency: "USD";
};

export type RelicEvidence = {
  assetKey: FigmaAssetKey;
  index: number;
  label: string;
};

type NonEmptyReadonlyArray<T> = readonly [T, ...T[]];

type RelicBase = {
  assembly: string;
  assets: {
    context?: readonly FigmaAssetKey[];
    evidence: NonEmptyReadonlyArray<RelicEvidence>;
    hero: FigmaAssetKey;
    social: FigmaAssetKey;
  };
  classification: string;
  condition: string;
  id: RelicId;
  materials: readonly string[];
  name: string;
  recoveredOn: IsoDate;
  seo: {
    description: string;
    title: string;
  };
  slug: RelicSlug;
};

export type AvailableRelic = RelicBase & {
  commerce: {
    etsyListingId: EtsyListingId;
    price: Money;
  };
  status: "available";
  transferredOn?: never;
};

export type TransferredRelic = RelicBase & {
  commerce: null;
  status: "transferred";
  transferredOn?: IsoDate;
};

export type Relic = AvailableRelic | TransferredRelic;

export function transferRelic(
  relic: AvailableRelic,
  transferredOn?: IsoDate,
): TransferredRelic {
  const transferred: TransferredRelic = {
    assembly: relic.assembly,
    assets: relic.assets,
    classification: relic.classification,
    commerce: null,
    condition: relic.condition,
    id: relic.id,
    materials: relic.materials,
    name: relic.name,
    recoveredOn: relic.recoveredOn,
    seo: relic.seo,
    slug: relic.slug,
    status: "transferred",
    ...(transferredOn === undefined ? {} : { transferredOn }),
  };

  return transferred;
}
