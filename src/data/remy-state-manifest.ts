import type { FigmaNodeId } from "@/design/figma-contract";

export const REMY_STATE_KEYS = ["patrol", "clipboard", "box"] as const;

export type RemyStateKey = (typeof REMY_STATE_KEYS)[number];

type RemyStateManifestEntry = {
  figmaNodeId: FigmaNodeId;
  height: number;
  key: RemyStateKey;
  publicPath: `/assets/figma/remy.${RemyStateKey}.png`;
  sha256: string;
  width: number;
};

export const REMY_STATE_MANIFEST = {
  patrol: {
    key: "patrol",
    figmaNodeId: "580:10",
    width: 160,
    height: 160,
    publicPath: "/assets/figma/remy.patrol.png",
    sha256: "41633b7a314514bb5fa6e4a369020a02f980d010d7c153fb51afc3553bd2bb91",
  },
  clipboard: {
    key: "clipboard",
    figmaNodeId: "580:4",
    width: 160,
    height: 160,
    publicPath: "/assets/figma/remy.clipboard.png",
    sha256: "347d48a75354945fdee5559a0e5e7802bbe1a27048f9877593a0be6d065e606b",
  },
  box: {
    key: "box",
    figmaNodeId: "580:8",
    width: 3240,
    height: 3240,
    publicPath: "/assets/figma/remy.box.png",
    sha256: "e2427fc4cc57bcd5073bca95078f1282550866ad329970dbab872250872d6e52",
  },
} as const satisfies Record<RemyStateKey, RemyStateManifestEntry>;

export function getRemyStateAsset(key: RemyStateKey) {
  return REMY_STATE_MANIFEST[key];
}
