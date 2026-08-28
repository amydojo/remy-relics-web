export type RectLike = Readonly<{
  left: number;
  top: number;
  width: number;
  height: number;
}>;

export type FlipTransform = Readonly<{
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
}>;

export function getInspectionHeroRect(screen: RectLike): RectLike {
  return {
    left: screen.left + 16,
    top: screen.top + 70,
    width: Math.max(0, screen.width - 32),
    height: 318,
  };
}

export function getFlipTransform(
  source: RectLike,
  destination: RectLike,
): FlipTransform {
  if (destination.width <= 0 || destination.height <= 0) {
    throw new RangeError("Destination geometry must have positive dimensions.");
  }

  return {
    x: source.left - destination.left,
    y: source.top - destination.top,
    scaleX: source.width / destination.width,
    scaleY: source.height / destination.height,
  };
}

export function flipTransformVariables(transform: FlipTransform) {
  return {
    "--rr-object-flip-x": `${transform.x}px`,
    "--rr-object-flip-y": `${transform.y}px`,
    "--rr-object-flip-scale-x": String(transform.scaleX),
    "--rr-object-flip-scale-y": String(transform.scaleY),
  } as const;
}
