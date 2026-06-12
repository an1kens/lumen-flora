import * as THREE from 'three';
import { splineLength } from './spline';

export interface Branch {
  id: number;
  depth: number;
  /** Catmull-Rom control points from base to tip. */
  points: THREE.Vector3[];
  /** Distance from root along parent chain. */
  rootOrder: number;
}

export interface PlantGraph {
  branches: Branch[];
  totalLength: number;
}

/** Deterministic RNG for stable structure at a given spread/lean. */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(spread: number, lean: number): number {
  const s = Math.round(spread * 100);
  const l = Math.round(lean * 100);
  return (s * 374761 + l * 668265) | 0;
}

function rotate2D(dir: THREE.Vector3, angle: number, leanBias: number): THREE.Vector3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const x = dir.x * c - dir.z * s + leanBias * 0.08;
  const z = dir.x * s + dir.z * c;
  return new THREE.Vector3(x, dir.y, z).normalize();
}

function buildBranchPoints(
  start: THREE.Vector3,
  end: THREE.Vector3,
  lean: number,
  rand: () => number,
): THREE.Vector3[] {
  const leanX = (lean - 0.5) * 0.25;
  const mid = start.clone().lerp(end, 0.5);
  mid.x += leanX * 0.15 + (rand() - 0.5) * 0.06;
  mid.z += (rand() - 0.5) * 0.04;
  return [start.clone(), mid, end.clone()];
}

/**
 * Stochastic space-colonisation-style branch graph.
 * branchSpread: 0 = single trunk, 1 = wide candelabra.
 * lean: phototropic bias (0 left, 1 right).
 */
export function generatePlant(branchSpread: number, lean: number): PlantGraph {
  const rand = mulberry32(hashSeed(branchSpread, lean));
  const branches: Branch[] = [];
  let nextId = 0;
  let totalLength = 0;

  const leanX = (lean - 0.5) * 0.4;
  const root = new THREE.Vector3(0, -1.55, 0);
  const trunkTop = new THREE.Vector3(leanX * 0.3, 1.35, 0);

  const trunkPts = [
    root.clone(),
    new THREE.Vector3(leanX * 0.08, -0.85, 0),
    new THREE.Vector3(leanX * 0.18, 0.15, 0),
    new THREE.Vector3(leanX * 0.25, 0.85, 0),
    trunkTop.clone(),
  ];

  branches.push({ id: nextId++, depth: 0, points: trunkPts, rootOrder: 0 });
  totalLength += splineLength(trunkPts);

  const maxDepth = branchSpread < 0.12 ? 0 : Math.floor(2 + branchSpread * 2);
  const branchAngle = 0.28 + branchSpread * 0.62;
  const branchProb = 0.35 + branchSpread * 0.55;

  interface Tip {
    pos: THREE.Vector3;
    dir: THREE.Vector3;
    depth: number;
    order: number;
  }

  const tips: Tip[] = [
    {
      pos: trunkTop,
      dir: new THREE.Vector3(leanX * 0.15, 1, 0).normalize(),
      depth: 0,
      order: 1,
    },
  ];

  while (tips.length > 0) {
    const tip = tips.shift()!;
    if (tip.depth >= maxDepth) continue;

    const segLen = 0.55 + rand() * 0.45 - tip.depth * 0.08;
    const childCount = rand() < branchProb ? 2 : 1;

    for (let side = 0; side < childCount; side++) {
      const sign = side === 0 ? 1 : -1;
      const angleNoise = (rand() - 0.5) * 0.35 * branchSpread;
      const angle = sign * (branchAngle + angleNoise);
      const dir = rotate2D(tip.dir, angle, lean - 0.5);
      const end = tip.pos.clone().add(dir.clone().multiplyScalar(segLen));

      const pts = buildBranchPoints(tip.pos, end, lean, rand);
      branches.push({
        id: nextId++,
        depth: tip.depth + 1,
        points: pts,
        rootOrder: tip.order,
      });
      totalLength += splineLength(pts);

      tips.push({
        pos: end,
        dir: dir.clone().lerp(new THREE.Vector3(leanX * 0.1, 1, 0), 0.15).normalize(),
        depth: tip.depth + 1,
        order: tip.order + 1,
      });
    }
  }

  return { branches, totalLength };
}
