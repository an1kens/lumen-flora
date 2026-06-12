/**
 * Mirror a normalized [0, 1] x-coordinate so on-screen position
 * matches a mirrored webcam feed. Used for landmarks AND video UVs.
 */
export function mirrorX(x: number): number {
  return 1 - x;
}

/** Mirror a Three.js normalized device / UV x to match the feed. */
export function mirrorUV(u: number, v: number): [number, number] {
  return [mirrorX(u), v];
}
