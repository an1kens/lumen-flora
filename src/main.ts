import * as THREE from 'three';
import { ParamBus } from './core/ParamBus';
import { createPanel, bindPanelToggle } from './ui/panel';

// ── Bootstrap ──────────────────────────────────────────────────────────────

const container = document.getElementById('app')!;
const fpsEl = document.getElementById('fps')!;

const bus = new ParamBus();
const gui = createPanel(bus);
bindPanelToggle(gui);

// ── Renderer ───────────────────────────────────────────────────────────────

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x050508, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// ── Scene (debug orb — proves springs ease visually) ───────────────────────

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.position.set(0, 0, 4);

const debugGeo = new THREE.SphereGeometry(0.15, 32, 32);
const debugMat = new THREE.MeshBasicMaterial({ color: 0x88ffcc });
const debugOrb = new THREE.Mesh(debugGeo, debugMat);
scene.add(debugOrb);

// Ground reference line
const lineGeo = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-2, -1.5, 0),
  new THREE.Vector3(2, -1.5, 0),
]);
const lineMat = new THREE.LineBasicMaterial({ color: 0x1a2a24 });
scene.add(new THREE.Line(lineGeo, lineMat));

// ── Resize ─────────────────────────────────────────────────────────────────

function resize(): void {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

window.addEventListener('resize', resize);
resize();

// ── FPS meter ──────────────────────────────────────────────────────────────

let frameCount = 0;
let fpsAccum = 0;
let lastFpsUpdate = performance.now();

function updateFps(dt: number): void {
  frameCount++;
  fpsAccum += dt;
  const now = performance.now();
  if (now - lastFpsUpdate >= 500) {
    const fps = Math.round(frameCount / fpsAccum);
    const ms = ((fpsAccum / frameCount) * 1000).toFixed(1);
    fpsEl.textContent = `${fps} fps · ${ms} ms`;
    frameCount = 0;
    fpsAccum = 0;
    lastFpsUpdate = now;
  }
}

// ── RAF loop ───────────────────────────────────────────────────────────────

let lastTime = performance.now();
const MAX_DT = 1 / 30;

function tick(now: number): void {
  requestAnimationFrame(tick);

  const rawDt = (now - lastTime) / 1000;
  lastTime = now;
  const dt = Math.min(rawDt, MAX_DT);

  bus.tick(dt);

  // Debug orb: Y = growthRate (springs visibly ease), X = bloomAperture
  const growth = bus.get('growthRate');
  const aperture = bus.get('bloomAperture');
  debugOrb.position.y = -1.5 + growth * 2.5;
  debugOrb.position.x = (aperture - 0.5) * 2;
  debugOrb.scale.setScalar(0.5 + bus.get('glow') * 0.8);

  const hue = 0.38 + bus.get('lean') * 0.12;
  debugMat.color.setHSL(hue, 0.7, 0.55 + bus.get('branchSpread') * 0.2);

  renderer.render(scene, camera);
  updateFps(dt);
}

requestAnimationFrame(tick);

// ── Demo: spring targets animate when sliders aren't touched ───────────────
// lil-gui sets both value+target directly; use setTarget to see springs ease.

export { bus };
