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
    sha256: "f16fa50928bb648520f12d2f652ab66521cdba76d71f57fdb3afc46ff4cad73b",
    svgStringFingerprint: "26477ee5",
  },
  clipboard: {
    key: "clipboard",
    figmaNodeId: "1009:164",
    width: 160,
    height: 160,
    publicPath: "/assets/remy-canon/remy-clipboard.svg",
    sha256: "e5754f40080bb91a6061e5cf7fe85ad00fe8229106827be50dd1029a74ba1ecf",
    svgStringFingerprint: "a2e2024a",
  },
  sleep: {
    key: "sleep",
    figmaNodeId: "1010:140",
    width: 160,
    height: 160,
    publicPath: "/assets/remy-canon/remy-sleep.svg",
    sha256: "2605a0d68ad98b363f4e284c09c5e4f042398b4cfd5cd4232cabeb6f221edab7",
    svgStringFingerprint: "f6e762b3",
  },
  box: {
    key: "box",
    figmaNodeId: "1011:282",
    width: 160,
    height: 160,
    publicPath: "/assets/remy-canon/remy-box.svg",
    sha256: "3dd849df9eea801afdf8ceb9bf5ebf4c99e2852f432253ccd38f82ad0111c915",
    svgStringFingerprint: "11a3fe51",
  },
  patrol: {
    key: "patrol",
    figmaNodeId: "1019:198",
    width: 160,
    height: 160,
    publicPath: "/assets/remy-canon/remy-patrol.svg",
    sha256: "02567135d9c588d010ec992b5960a4591fb3030edbc6f27db25f7ac26acf11bb",
    svgStringFingerprint: "77a1111c",
  },
  lab: {
    key: "lab",
    figmaNodeId: "1013:233",
    width: 160,
    height: 160,
    publicPath: "/assets/remy-canon/remy-lab.svg",
    sha256: "004fe3de1061ff9ad6309ac349376f1c875821c300c1015d821f55043ba1c91c",
    svgStringFingerprint: "61da56e9",
  },
} as const satisfies Record<RemyCanonVectorKey, RemyCanonVectorAsset>;

export function getRemyCanonVectorAsset(key: RemyCanonVectorKey) {
  return REMY_CANON_VECTOR_MANIFEST[key];
}
