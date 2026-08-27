import type { FigmaAssetKey } from "@/data/asset-manifest";

export type ArchiveTraceDepth = "foreground" | "mid" | "far";

export type ArchiveTrace = {
  alt: string;
  assetKey: FigmaAssetKey;
  depth: ArchiveTraceDepth;
  index: 1 | 2 | 3 | 4;
  label: string;
};

// These are canonical visual traces from Figma 547:65. Their commerce mappings
// remain intentionally absent: the frozen asset registry marks them unmapped.
export const ARCHIVE_TRACES = [
  {
    index: 1,
    label: "PINK CIRCLE FILM",
    alt: "Red and black resin pendant archive trace",
    assetKey: "relic.redWindowRect.macroBokeh",
    depth: "foreground",
  },
  {
    index: 2,
    label: "BLACK POCKET",
    alt: "Evil-eye hex pendant archive trace",
    assetKey: "relic.evilEyeHex.macroBlackWhite",
    depth: "mid",
  },
  {
    index: 3,
    label: "CLEAR ROUTE",
    alt: "Clear trapezoid pendant archive trace",
    assetKey: "relic.clearFoundTrapezoid.heroBokeh",
    depth: "far",
  },
  {
    index: 4,
    label: "AMBER TRACE",
    alt: "Green drop pendant archive trace",
    assetKey: "relic.greenDrop.sunlightMacro",
    depth: "mid",
  },
] as const satisfies readonly ArchiveTrace[];
