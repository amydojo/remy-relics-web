import { getCanonicalAsset, type FigmaAssetKey } from "@/data/asset-manifest";
import type { Relic, RelicId } from "@/data/relic";

export type NormalizedPoint = Readonly<{ x: number; y: number }>;
export type NormalizedBounds = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;
export type NormalizedInsets = Readonly<{
  top: number;
  right: number;
  bottom: number;
  left: number;
}>;

export type RelicObjectMediaRecord = Readonly<{
  relicId: RelicId;
  canonicalAssetKey: FigmaAssetKey;
  masterAsset: Readonly<{
    publicPath: string;
    width: number;
    height: number;
    sha256: string;
  }>;
  derivatives: Readonly<{
    strategy: "next-image-runtime";
    widths: readonly number[];
  }>;
  alphaBounds: NormalizedBounds | null;
  visualCenter: NormalizedPoint;
  anchor: NormalizedPoint;
  focalPoint: NormalizedPoint;
  preferredScale: number;
  safeCrop: NormalizedInsets | null;
  aspectRatio: number;
  backgroundIsolationStatus: "contextual-rectangle" | "isolated-alpha";
  fallbackAssetKey: FigmaAssetKey;
}>;

const OBJECT_MEDIA_GEOMETRY = {
  "RR-S3-N1": {
    alphaBounds: null,
    visualCenter: { x: 0.5, y: 0.44 },
    anchor: { x: 0.5, y: 0.5 },
    focalPoint: { x: 0.5, y: 0.44 },
    preferredScale: 1,
    safeCrop: null,
    backgroundIsolationStatus: "contextual-rectangle",
    derivativeWidths: [480, 720, 1080, 1600] as const,
  },
} as const;

export function getRelicObjectMedia(relic: Relic): RelicObjectMediaRecord {
  const geometry = OBJECT_MEDIA_GEOMETRY[relic.id as keyof typeof OBJECT_MEDIA_GEOMETRY];

  if (geometry === undefined) {
    throw new Error(`No relic object media record exists for ${relic.id}.`);
  }

  const asset = getCanonicalAsset(relic.assets.hero);

  return {
    relicId: relic.id,
    canonicalAssetKey: relic.assets.hero,
    masterAsset: {
      publicPath: asset.publicPath,
      width: asset.width,
      height: asset.height,
      sha256: asset.sha256,
    },
    derivatives: {
      strategy: "next-image-runtime",
      widths: geometry.derivativeWidths,
    },
    alphaBounds: geometry.alphaBounds,
    visualCenter: geometry.visualCenter,
    anchor: geometry.anchor,
    focalPoint: geometry.focalPoint,
    preferredScale: geometry.preferredScale,
    safeCrop: geometry.safeCrop,
    aspectRatio: asset.width / asset.height,
    backgroundIsolationStatus: geometry.backgroundIsolationStatus,
    fallbackAssetKey: relic.assets.hero,
  };
}
