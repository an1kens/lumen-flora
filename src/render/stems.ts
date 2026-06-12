import * as THREE from 'three';
import type { ParamBus } from '../core/ParamBus';
import { buildParticles } from '../garden/growth';
import { generatePlant } from '../garden/lsystem';
import vertShader from './shaders/stem.vert.glsl?raw';
import fragShader from './shaders/stem.frag.glsl?raw';

const PARTICLE_COUNT = 3_200;

export class StemRenderer {
  readonly points: THREE.Points;
  private material: THREE.ShaderMaterial;
  private geometry: THREE.BufferGeometry;
  private elapsed = 0;
  private stemHeight = 0.3;
  private rebuildKey = '';

  constructor(scene: THREE.Scene) {
    this.geometry = new THREE.BufferGeometry();
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

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = true;
    scene.add(this.points);

    this.rebuild(0.3, 0.5);
  }

  private rebuildKeyFor(spread: number, lean: number): string {
    return `${spread.toFixed(2)}|${lean.toFixed(2)}`;
  }

  private rebuild(spread: number, lean: number): void {
    const graph = generatePlant(spread, lean);
    const particles = buildParticles(graph, PARTICLE_COUNT);

    const positions = new Float32Array(particles.length * 3);
    const along = new Float32Array(particles.length);
    const seed = new Float32Array(particles.length);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;
      along[i] = p.along;
      seed[i] = p.seed;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('aAlong', new THREE.BufferAttribute(along, 1));
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeBoundingSphere();
  }

  update(dt: number, bus: ParamBus): void {
    this.elapsed += dt;

    const spread = bus.get('branchSpread');
    const lean = bus.get('lean');
    const key = this.rebuildKeyFor(spread, lean);
    if (key !== this.rebuildKey) {
      this.rebuild(spread, lean);
      this.rebuildKey = key;
    }

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
