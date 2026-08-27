export type FigmaNodeId = `${number}:${number}`;

export const FIGMA_FILE_KEY = "V1WXFOR0Gob6lBc14cbmba" as const;

export const FIGMA_NODES = {
  frozenHandoff: "656:133",
  engineeringManifest: "660:211",
  assetRegistry: "555:119",
  arrival: "540:2",
  current: "543:2",
  inspection: "544:31",
  record: "545:56",
  currentMotionStart: "624:6",
  recordMotionStart: "624:81",
  acquireCta: "534:10",
  bottomNav: "533:32",
  relicMeta: "536:20",
  inspectionSheet: "537:2",
  evidenceLabel: "535:9",
  remyState: "580:14",
  remyPatrol: "580:10",
  remyClipboard: "580:4",
  spatialCue: "600:20",
} as const satisfies Record<string, FigmaNodeId>;

export const FIGMA_COLOR_TOKENS = {
  "--rr-surface-canvas": "#f4f0e8",
  "--rr-surface-card": "#fbf8f2",
  "--surface-inspection": "#1b1a18",
  "--surface-inspection-raised": "#211f1c",
  "--rr-text-primary": "#1b1a18",
  "--rr-text-secondary": "#575149",
  "--text-on-inspection": "#fbf8f2",
  "--rr-border-default": "#c9c0b3",
  "--border-on-inspection": "#575149",
  "--status-active": "#e34a3d",
} as const;

export const FIGMA_TEXT_STYLES = {
  "RR Mobile / Object": {
    family: "Geist Mono",
    style: "Medium",
    weight: 500,
    size: 18,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  "RR Mobile / Action": {
    family: "Geist Mono",
    style: "Medium",
    weight: 500,
    size: 13,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  "RR Mobile / Meta": {
    family: "Geist Mono",
    style: "Regular",
    weight: 400,
    size: 10,
    lineHeight: 13,
    letterSpacing: 0.25,
  },
} as const;

export const FIGMA_REFERENCE_VIEWPORT = {
  width: 390,
  height: 844,
} as const;
