import * as THREE from 'three';
import type { ParamBus } from '../core/ParamBus';
import vertShader from './shaders/stem.vert.glsl?raw';
import fragShader from './shaders/stem.frag.glsl?raw';

const PARTICLE_COUNT = 2_800;

/** Centripetal Catmull-Rom segment. */
function catmullRom(
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

function sampleSpline(t: number, controlPoints: THREE.Vector3[]): THREE.Vector3 {
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

export class StemRenderer {
  readonly points: THREE.Points;
  private material: THREE.ShaderMaterial;
  private elapsed = 0;
  private stemHeight = 0.3;

  constructor(scene: THREE.Scene) {
    const controlPoints = [
      new THREE.Vector3(-0.04, -1.55, 0),
      new THREE.Vector3(-0.1, -0.9, 0),
      new THREE.Vector3(0.06, -0.1, 0),
      new THREE.Vector3(-0.02, 0.7, 0),
      new THREE.Vector3(0.05, 1.35, 0),
    ];

    const along = new Float32Array(PARTICLE_COUNT);
    const seed = new Float32Array(PARTICLE_COUNT);
    const positions = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = i / (PARTICLE_COUNT - 1);
      along[i] = t;
      seed[i] = Math.random();
      const p = sampleSpline(t, controlPoints);
      const jitter = (Math.random() - 0.5) * 0.004;
      positions[i * 3] = p.x + jitter;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z + jitter * 0.3;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aAlong', new THREE.BufferAttribute(along, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uGrowth: { value: 0.3 },
        uTime: { value: 0 },
        uFrozen: { value: 0 },
        uDebug: { value: 0 },
      },
      vertexShader: vertShader,
      fragmentShader: fragShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = true;
    scene.add(this.points);
  }

  update(dt: number, bus: ParamBus): void {
    this.elapsed += dt;

    // growthRate is spring-smoothed on the bus — drives visible stem height (0–1).
    const frozen = bus.get('frozen');
    if (frozen < 0.5) {
      this.stemHeight = bus.get('growthRate');
    }

    this.material.uniforms.uGrowth.value = this.stemHeight;
    this.material.uniforms.uTime.value = this.elapsed;
    this.material.uniforms.uFrozen.value = frozen;
  }

  setDebug(enabled: boolean): void {
    this.material.uniforms.uDebug.value = enabled ? 1 : 0;
  }
}
