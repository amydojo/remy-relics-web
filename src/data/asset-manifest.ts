import type { FigmaNodeId } from "@/design/figma-contract";

export const FIGMA_ASSET_KEYS = [
  "relic.evilEyeHex.macroBlackWhite",
  "relic.redWindowRect.macroBokeh",
  "relic.clearFoundTrapezoid.heroBokeh",
  "relic.lavenderTeardrop.macroLilac",
  "packaging.evilEyeHex.kraftFlatlay",
  "relic.greenDropBlackPearl.stylingPair",
  "relic.greenDrop.sunlightMacro",
  "relic.greenDrop.wornMacro",
  "packaging.crystalLariat.dossierHero",
] as const;

export type FigmaAssetKey = (typeof FIGMA_ASSET_KEYS)[number];

type AssetUse =
  | "about.archive"
  | "archive.thumb"
  | "arrival.archive-reveal"
  | "arrival.hero"
  | "current.dark"
  | "current.large"
  | "current.small"
  | "inspection.hero"
  | "log.thumb"
  | "record.context"
  | "record.hero"
  | "record.macro"
  | "record.packaging"
  | "social.context"
  | "social.story"
  | "styling.context";

type CommerceMapping =
  | { kind: "relic"; relicId: "RR-S3-N1"; displayName: "GREEN TEARDROP BEND" }
  | { kind: "mixed-context"; note: string }
  | { kind: "unmapped" };

export type CanonicalAssetManifestEntry = {
  commerce: CommerceMapping;
  figmaNodeId: FigmaNodeId;
  height: number;
  key: FigmaAssetKey;
  publicPath: `/assets/figma/${FigmaAssetKey}.png`;
  sha256: string;
  sourceStatus: "canonical" | "upgraded-canonical";
  uses: readonly AssetUse[];
  width: number;
};

export const CANONICAL_ASSET_MANIFEST = {
  "relic.evilEyeHex.macroBlackWhite": {
    key: "relic.evilEyeHex.macroBlackWhite",
    figmaNodeId: "551:119",
    width: 792,
    height: 990,
    sourceStatus: "canonical",
    publicPath: "/assets/figma/relic.evilEyeHex.macroBlackWhite.png",
    sha256: "b8261924c01258c8f6a68bd1c194263353638dc6e3279df27cece2b1c0b31400",
    uses: [
      "archive.thumb",
      "arrival.hero",
      "current.dark",
      "inspection.hero",
      "record.hero",
    ],
    commerce: { kind: "unmapped" },
  },
  "relic.redWindowRect.macroBokeh": {
    key: "relic.redWindowRect.macroBokeh",
    figmaNodeId: "551:120",
    width: 3277,
    height: 4096,
    sourceStatus: "canonical",
    publicPath: "/assets/figma/relic.redWindowRect.macroBokeh.png",
    sha256: "f588b18eee15e2e3fcca839fe6bdcd0c4d7fbf6a090b72e11766ca126baa1e8c",
    uses: ["archive.thumb", "current.large", "inspection.hero", "record.hero"],
    commerce: { kind: "unmapped" },
  },
  "relic.clearFoundTrapezoid.heroBokeh": {
    key: "relic.clearFoundTrapezoid.heroBokeh",
    figmaNodeId: "551:121",
    width: 2707,
    height: 3384,
    sourceStatus: "canonical",
    publicPath: "/assets/figma/relic.clearFoundTrapezoid.heroBokeh.png",
    sha256: "b5e81f06b428c8304e2a4b511b0a403cea9b6c649f8c6cdbe00ccbe6d0420655",
    uses: ["archive.thumb", "current.large", "inspection.hero", "record.hero"],
    commerce: { kind: "unmapped" },
  },
  "relic.lavenderTeardrop.macroLilac": {
    key: "relic.lavenderTeardrop.macroLilac",
    figmaNodeId: "551:122",
    width: 724,
    height: 1086,
    sourceStatus: "canonical",
    publicPath: "/assets/figma/relic.lavenderTeardrop.macroLilac.png",
    sha256: "b7225e8f0529a3c1d866aa5b79be29b38ef10e27e38dde709a80c96fe6b2e777",
    uses: ["current.small", "inspection.hero", "record.macro"],
    commerce: { kind: "unmapped" },
  },
  "packaging.evilEyeHex.kraftFlatlay": {
    key: "packaging.evilEyeHex.kraftFlatlay",
    figmaNodeId: "551:123",
    width: 792,
    height: 990,
    sourceStatus: "canonical",
    publicPath: "/assets/figma/packaging.evilEyeHex.kraftFlatlay.png",
    sha256: "5f7a10a86aa3bebe43e85b1f955f6c7c98df400d4af02e2dd14d5d3b3b473d89",
    uses: ["record.packaging", "about.archive", "social.context"],
    commerce: { kind: "unmapped" },
  },
  "relic.greenDropBlackPearl.stylingPair": {
    key: "relic.greenDropBlackPearl.stylingPair",
    figmaNodeId: "559:139",
    width: 1330,
    height: 2364,
    sourceStatus: "upgraded-canonical",
    publicPath: "/assets/figma/relic.greenDropBlackPearl.stylingPair.png",
    sha256: "a70782751a58984ac6bc3640367bc075dda37902caa0212941c74d55d693bd77",
    uses: ["social.story", "styling.context"],
    commerce: {
      kind: "mixed-context",
      note: "GREEN TEARDROP + BLACK PEARL CONTEXT",
    },
  },
  "relic.greenDrop.sunlightMacro": {
    key: "relic.greenDrop.sunlightMacro",
    figmaNodeId: "559:136",
    width: 1585,
    height: 1982,
    sourceStatus: "upgraded-canonical",
    publicPath: "/assets/figma/relic.greenDrop.sunlightMacro.png",
    sha256: "89c3e3ad60b350f0db585558e273a4c7f837fa298bc1873702904a63a3b9b26f",
    uses: [
      "current.large",
      "current.small",
      "archive.thumb",
      "inspection.hero",
      "record.hero",
      "record.macro",
      "log.thumb",
    ],
    commerce: {
      kind: "relic",
      relicId: "RR-S3-N1",
      displayName: "GREEN TEARDROP BEND",
    },
  },
  "relic.greenDrop.wornMacro": {
    key: "relic.greenDrop.wornMacro",
    figmaNodeId: "559:138",
    width: 1330,
    height: 2364,
    sourceStatus: "upgraded-canonical",
    publicPath: "/assets/figma/relic.greenDrop.wornMacro.png",
    sha256: "2cb07cabe427b44162de6aa9f90eed52268e8772d481f95fb10597c87bcb2856",
    uses: ["inspection.hero", "record.context"],
    commerce: {
      kind: "relic",
      relicId: "RR-S3-N1",
      displayName: "GREEN TEARDROP BEND",
    },
  },
  "packaging.crystalLariat.dossierHero": {
    key: "packaging.crystalLariat.dossierHero",
    figmaNodeId: "552:126",
    width: 1586,
    height: 1982,
    sourceStatus: "canonical",
    publicPath: "/assets/figma/packaging.crystalLariat.dossierHero.png",
    sha256: "17e7ca215f79ee32544e2762b7e115393e3227b3563d182cb2c3df3d91c65fcd",
    uses: ["arrival.archive-reveal", "record.packaging", "about.archive"],
    commerce: { kind: "unmapped" },
  },
} as const satisfies Record<FigmaAssetKey, CanonicalAssetManifestEntry>;

export function getCanonicalAsset(key: FigmaAssetKey) {
  return CANONICAL_ASSET_MANIFEST[key];
}

export const CANONICAL_VECTOR_ASSET_MANIFEST = {
  "materialMemory.traceMapObjectRemoved": {
    key: "materialMemory.traceMapObjectRemoved",
    figmaNodeId: "645:134" as FigmaNodeId,
    width: 208,
    height: 266,
    publicPath: "/assets/figma/material-memory.trace-map.svg",
    sha256: "dff58ba0aa1be03d309c50c416779b9bc01e310664ff87013888c817c0722faa",
  },
} as const;

export type CanonicalVectorAssetKey = keyof typeof CANONICAL_VECTOR_ASSET_MANIFEST;

export function getCanonicalVectorAsset(key: CanonicalVectorAssetKey) {
  return CANONICAL_VECTOR_ASSET_MANIFEST[key];
}
