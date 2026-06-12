import * as THREE from 'three';
import { ParamBus } from './core/ParamBus';
import { BackgroundLayer } from './render/background';
import { createGardenScene } from './render/scene';
import { StemRenderer } from './render/stems';
import { createPanel, bindPanelToggle } from './ui/panel';

// ── Bootstrap ──────────────────────────────────────────────────────────────

const container = document.getElementById('app')!;
const fpsEl = document.getElementById('fps')!;
const overlay = document.getElementById('overlay')!;

const bus = new ParamBus();
const gui = createPanel(bus);
bindPanelToggle(gui);

const background = new BackgroundLayer(bus);
const { scene, camera } = createGardenScene();
const stems = new StemRenderer(scene);

// ── Renderer ───────────────────────────────────────────────────────────────

const renderer = new THREE.WebGLRenderer({
  antialias: false,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
if (import.meta.env.DEV) {
  renderer.debug.checkShaderErrors = true;
}
container.appendChild(renderer.domElement);

// ── Camera permission overlay ──────────────────────────────────────────────

function showOverlay(html: string, clickable: boolean): void {
  overlay.innerHTML = html;
  overlay.style.display = 'flex';
  overlay.style.pointerEvents = clickable ? 'auto' : 'none';
  overlay.style.cursor = clickable ? 'pointer' : 'default';
}

function bindStartButton(): void {
  document.getElementById('start-btn')?.addEventListener('click', () => {
    void background.start();
  });
}

background.onStatusChange((status) => {
  switch (status) {
    case 'idle':
      showOverlay(
        `<div class="overlay-card">
          <h1>Lumen Flora</h1>
          <p>Grow luminous flowers with your hands.</p>
          <button id="start-btn">Enable camera to begin</button>
        </div>`,
        true,
      );
      bindStartButton();
      break;
    case 'requesting':
      showOverlay('<p class="overlay-msg">Requesting camera…</p>', false);
      break;
    case 'active':
      overlay.style.display = 'none';
      break;
    case 'denied':
      showOverlay(
        `<div class="overlay-card">
          <h1>Camera needed</h1>
          <p>Allow webcam access in your browser, then reload.</p>
        </div>`,
        false,
      );
      break;
    case 'error':
      showOverlay(
        `<div class="overlay-card">
          <h1>Camera unavailable</h1>
          <p>Could not access your webcam. Try another browser or device.</p>
        </div>`,
        false,
      );
      break;
  }
});

showOverlay(
  `<div class="overlay-card">
    <h1>Lumen Flora</h1>
    <p>Grow luminous flowers with your hands.</p>
    <button id="start-btn">Enable camera to begin</button>
  </div>`,
  true,
);
bindStartButton();

// ── Resize ─────────────────────────────────────────────────────────────────

function resize(): void {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  background.resize(w, h);
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
  background.update(dt);
  stems.update(dt, bus);

  background.render(renderer);
  renderer.render(scene, camera);
  updateFps(dt);
}

requestAnimationFrame(tick);

export { bus };
