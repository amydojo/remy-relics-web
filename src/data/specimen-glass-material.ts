export const RR_SPECIMEN_GLASS = {
  name: "RR / Specimen Glass / Periwinkle Refraction",
  kind: "effect",
  shaderId: "58f32006-9569-48bd-bf57-f1dc9d4cbad6",
  approvedVersion: "47a1a1a4de6e45b5f688a1f361b273fb01c396aa",
  owner: "UNDONE by design",
  routeSpecimenId: "RR-FM-01",
  productionTechnique: "css-svg-filter",
  figma: {
    defaultSpecimenNodeId: "1074:652",
    contextQaNodeId: "1076:727",
    finalDecisionNodeId: "1079:991",
  },
  defaults: {
    refraction: 7,
    frost: 12,
    edgeDispersion: 1.4,
    irregularity: 7,
    depth: 14,
    periwinkleInfluence: 12,
    materialScale: 72,
  },
} as const;
