import type { FigmaNodeId } from "@/design/figma-contract";

export const REMY_CANON_VECTOR_KEYS = [
  "base",
  "clipboard",
  "sleep",
  "box",
  "patrol",
  "lab",
] as const;

export type RemyCanonVectorKey = (typeof REMY_CANON_VECTOR_KEYS)[number];

type RemyCanonVectorAsset = {
  key: RemyCanonVectorKey;
  figmaNodeId: FigmaNodeId;
  width: 160;
  height: 160;
  publicPath: `/assets/remy-canon/remy-${RemyCanonVectorKey}.svg`;
  sha256: string;
  svgStringFingerprint: string;
  transparent: true;
};

export const REMY_CANON_VECTOR_FAMILY = {
  figmaFileKey: "V1WXFOR0Gob6lBc14cbmba",
  figmaNodeId: "1028:529" as FigmaNodeId,
  name: "RR/Remy Canon Vector",
} as const;

export const REMY_CANON_VECTOR_MANIFEST = {
  base: {
    key: "base",
    figmaNodeId: "1008:176",
    width: 160,
    height: 160,
    publicPath: "/assets/remy-canon/remy-base.svg",
    sha256: "86949edc72e0febed790bb1a49a203281f8b669625c1d8edd8542cf7a819ba4a",
    svgStringFingerprint: "26477ee5",
    transparent: true,\n  },
  clipboard: {
    key: "clipboard",
    figmaNodeId: "1009:164",
    width: 160,
    height: 160,
    publicPath: "/assets/remy-canon/remy-clipboard.svg",
    sha256: "0a814bfaf7e1f699e85c3083ddc888380fa5d639d8ce64e7cb9c23afec650335",
    svgStringFingerprint: "a2e2024a",
    transparent: true,\n  },
  sleep: {
    key: "sleep",
    figmaNodeId: "1010:140",
    width: 160,
    height: 160,
    publicPath: "/assets/remy-canon/remy-sleep.svg",
    sha256: "040ba7874ca4f86d5759220c0287cd943504aa770bd76aab6fa3504d4609e133",
    svgStringFingerprint: "f6e762b3",
    transparent: true,\n  },
  box: {
    key: "box",
    figmaNodeId: "1011:282",
    width: 160,
    height: 160,
    publicPath: "/assets/remy-canon/remy-box.svg",
    sha256: "a50a76684a7fbfe2a52784f2eee4b90947fed0a5055821e65ec730f01fca1339",
    svgStringFingerprint: "11a3fe51",
    transparent: true,\n  },
  patrol: {
    key: "patrol",
    figmaNodeId: "1019:198",
    width: 160,
    height: 160,
    publicPath: "/assets/remy-canon/remy-patrol.svg",
    sha256: "171df9a5148af3f277ce341738d9111755c70c9ef37a0c4099d2cb4a067117fb",
    svgStringFingerprint: "77a1111c",
    transparent: true,\n  },
  lab: {
    key: "lab",
    figmaNodeId: "1013:233",
    width: 160,
    height: 160,
    publicPath: "/assets/remy-canon/remy-lab.svg",
    sha256: "2159fa1a8a9fb53d045413d9b9baf87a8fad93732f97205c72303932abb000fc",
    svgStringFingerprint: "61da56e9",
    transparent: true,\n  },
} as const satisfies Record<RemyCanonVectorKey, RemyCanonVectorAsset>;

export function getRemyCanonVectorAsset(key: RemyCanonVectorKey) {
  return REMY_CANON_VECTOR_MANIFEST[key];
}
