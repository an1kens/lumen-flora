import * as THREE from 'three';
import type { PlantGraph } from './lsystem';
import { sampleSpline, splineLength } from './spline';

export interface StemParticle {
  position: THREE.Vector3;
  /** 0 at root → 1 at full plant extent. */
  along: number;
  seed: number;
}

const ARC_SAMPLES = 12;

/**
 * Distribute particles along all branches proportional to arc length,
 * ordered root → tips.
 */
export function buildParticles(graph: PlantGraph, count: number): StemParticle[] {
  if (graph.branches.length === 0 || graph.totalLength <= 0) return [];

  const ordered = [...graph.branches].sort(
    (a, b) => a.rootOrder - b.rootOrder || a.depth - b.depth || a.id - b.id,
  );

  const lengths = ordered.map((b) => splineLength(b.points, ARC_SAMPLES));
  const total = lengths.reduce((sum, l) => sum + l, 0);

  const particles: StemParticle[] = [];
  let assigned = 0;
  let distSoFar = 0;

  for (let b = 0; b < ordered.length; b++) {
    const len = lengths[b];
    const n = Math.max(
      b === 0 ? 2 : 1,
      Math.min(count - assigned, Math.round((len / total) * count)),
    );

    for (let j = 0; j < n && assigned < count; j++, assigned++) {
      const t = (j + 0.5) / n;
      const globalDist = distSoFar + t * len;
      const along = globalDist / total;
      const pos = sampleSpline(t, ordered[b].points);
      const jitter = (Math.random() - 0.5) * 0.004;
      pos.x += jitter;
      pos.z += jitter * 0.3;

      particles.push({ position: pos, along, seed: Math.random() });
    }
    distSoFar += len;
  }

  while (assigned < count) {
    const t = assigned / count;
    const branch = ordered[0];
    const pos = sampleSpline(t, branch.points);
    particles.push({ position: pos, along: t, seed: Math.random() });
    assigned++;
  }

  particles.sort((a, b) => a.along - b.along);
  return particles;
}
