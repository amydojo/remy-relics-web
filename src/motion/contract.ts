export const MOTION_EASING = "cubic-bezier(.22,1,.36,1)" as const;

export const MOTION_CONTRACT = {
  arrivalRevealMs: 240,
  currentToInspectionMs: 260,
  fieldPromotionMs: 260,
  creamToBlackCrossfadeMs: 180,
  evidenceSnapMs: 220,
  inspectionToRecordTotalMs: 240,
  inspectionToRecordHoldMs: 120,
  archiveRoamMs: 240,
  archiveToRecordMs: 180,
  transferRevealPauseMs: 150,
  transferRevealSettleMs: 200,
  reducedMotionMs: 120,
  ambientDisplacementPx: { min: 4, max: 12 },
  depthMultipliers: { foreground: 1, mid: 0.6, far: 0.35 },
} as const;

export type MotionProfile = {
  allowOvershoot: boolean;
  allowParallax: boolean;
  dissolveMs: number;
  settleMs: number;
};

export function motionProfile(prefersReducedMotion: boolean): MotionProfile {
  if (prefersReducedMotion) {
    return {
      allowOvershoot: false,
      allowParallax: false,
      dissolveMs: MOTION_CONTRACT.reducedMotionMs,
      settleMs: MOTION_CONTRACT.reducedMotionMs,
    };
  }

  return {
    allowOvershoot: true,
    allowParallax: true,
    dissolveMs: MOTION_CONTRACT.creamToBlackCrossfadeMs,
    settleMs: MOTION_CONTRACT.currentToInspectionMs,
  };
}
