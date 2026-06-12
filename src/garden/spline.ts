import * as THREE from 'three';

/** Centripetal Catmull-Rom segment. */
export function catmullRom(
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  p3: THREE.Vector3,
  t: number,
): THREE.Vector3 {
  const t2 = t * t;
  const t3 = t2 * t;
  return new THREE.Vector3(
    0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    0.5 *
      (2 * p1.z +
        (-p0.z + p2.z) * t +
        (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
        (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3),
  );
}

export function sampleSpline(
  t: number,
  controlPoints: THREE.Vector3[],
): THREE.Vector3 {
  if (controlPoints.length < 2) return controlPoints[0]?.clone() ?? new THREE.Vector3();
  if (controlPoints.length === 2) {
    return controlPoints[0].clone().lerp(controlPoints[1], t);
  }

  const extended = [
    controlPoints[0],
    ...controlPoints,
    controlPoints[controlPoints.length - 1],
  ];
  const segments = controlPoints.length - 1;
  const scaled = t * segments;
  const seg = Math.min(Math.floor(scaled), segments - 1);
  const localT = scaled - seg;
  return catmullRom(
    extended[seg],
    extended[seg + 1],
    extended[seg + 2],
    extended[seg + 3],
    localT,
  );
}

/** Approximate arc length by uniform sampling. */
export function splineLength(controlPoints: THREE.Vector3[], samples = 24): number {
  let len = 0;
  let prev = sampleSpline(0, controlPoints);
  for (let i = 1; i <= samples; i++) {
    const p = sampleSpline(i / samples, controlPoints);
    len += prev.distanceTo(p);
    prev = p;
  }
  return len;
}
