import GUI from 'lil-gui';
import type { ParamBus } from '../core/ParamBus';

export function createPanel(bus: ParamBus): GUI {
  const gui = new GUI({ title: 'Lumen Flora' });
  const proxy = bus.getGuiProxy();

  const structure = gui.addFolder('Structure Hand');
  structure.add(proxy, 'growthRate', 0, 1, 0.001).name('Growth Rate');
  structure.add(proxy, 'branchSpread', 0, 1, 0.001).name('Branch Spread');
  structure.add(proxy, 'lean', 0, 1, 0.001).name('Lean');
  structure.add(proxy, 'frozen', 0, 1, 0.001).name('Frozen');
  structure.open();

  const bloom = gui.addFolder('Bloom Hand');
  bloom.add(proxy, 'bloomAperture', 0, 1, 0.001).name('Aperture');
  bloom.add(proxy, 'glow', 0, 1, 0.001).name('Glow');
  bloom.add(proxy, 'spiral', 0, 1, 0.001).name('Spiral');
  bloom.open();

  const combined = gui.addFolder('Combined');
  combined.add(proxy, 'wind', 0, 1, 0.001).name('Wind');
  combined.add(proxy, 'dolly', 0, 1, 0.001).name('Dolly');

  const render = gui.addFolder('Render');
  render.add(proxy, 'bgDim', 0, 1, 0.001).name('BG Dim');

  const speciesNames = { Lily: 0, Iris: 1, Rose: 2 };
  gui
    .add({ species: 'Lily' }, 'species', Object.keys(speciesNames))
    .name('Species')
    .onChange((name: keyof typeof speciesNames) => {
      proxy.species = speciesNames[name];
    });

  return gui;
}

export function bindPanelToggle(gui: GUI): void {
  const root = gui.domElement;
  root.style.display = '';

  window.addEventListener('keydown', (e) => {
    if (e.key === 'h' || e.key === 'H') {
      root.style.display = root.style.display === 'none' ? '' : 'none';
    }
  });
}
