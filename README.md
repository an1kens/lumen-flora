# Lumen Flora

**A two-hand gestural instrument for growing luminous flowers in real time.**

*Theremin, but for flowers.*

Lumen Flora turns your body into a gardening instrument. In the browser, with a webcam, you grow a glowing botanical structure out of darkness using nothing but your hands: one hand sculpts the *architecture* of the plant — how stems rise, split, and branch — while the other hand conducts the *life* of the plant — when and how flowers bloom, breathe, and shed light.

The aesthetic is **luminous minimalism**: incandescent particle-traced stems and emissive petals glowing against a near-black void, with your mirrored webcam feed and glowing hand constellations visible behind the garden so any viewer instantly understands that the human is conducting the flowers.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Build | Vite + TypeScript |
| Rendering | Three.js (WebGL2) |
| Post-processing | `postprocessing` — dual bloom |
| Hand tracking | MediaPipe Tasks Vision → HandLandmarker |
| Dev UI | lil-gui (toggle with `h`) |
| State | Plain typed `ParamBus` — no framework |
| Deploy | Vercel |

No React on purpose. A `requestAnimationFrame` loop + modules is simpler to reason about than reconciliation fighting a WebGL canvas.

---

## Architecture

```
Webcam (getUserMedia)
   │
MediaPipe HandLandmarker (21 landmarks × 2 hands)
   │
src/tracking/  — gesture signals + state machine
   │  writes →
src/core/ParamBus.ts  ← THE CONTRACT
   │  reads ←
src/garden/    — L-system growth engine
src/render/    — webcam, stems, petals, hand viz, bloom
   │
Canvas (1080p)
```

**The ParamBus is the keystone.** Tracking writes to it; garden and render only read from it. This keeps gesture logic and visuals decoupled — you can tune the entire piece with sliders before any hand tracking exists.

---

## Project Structure

```
src/
├── main.ts              # bootstrap, RAF loop, resize
├── core/
│   ├── ParamBus.ts      # typed contract + spring smoothing
│   └── springs.ts
├── tracking/            # (Session 7–9)
├── garden/              # (Session 4–6, 10)
├── render/              # (Session 2–7)
└── ui/
    └── panel.ts         # lil-gui dev panel
```

---

## Getting Started

**Requirements:** Node 18+, Chrome (desktop), webcam.

```bash
npm install
npm run dev
```

Open the local URL. Drag sliders in the control panel — the debug orb eases visibly, proving the spring system works. Press `h` to hide the panel.

```bash
npm run build    # production build → dist/
npm run preview  # serve dist/ locally
```

---

## Interaction Model

| Hand | Role | Governs |
|---|---|---|
| **Structure** (left) | The earth | Growth rate, branching, lean, freeze, prune |
| **Bloom** (right) | The sun | Petal aperture, glow, spiral, proximity bloom, petal shed |

Combined gestures: horizontal hand separation → wind; both fists held 2 s → reset; both palms toward camera → dolly.

All signals pass through critically-damped springs. Nothing jumps.

---

## Flower Species

Three presets over one shared parametric model — lily, iris, and rose — differing in petal count, shape, bloom motion, stem character, and palette. Rose phyllotaxis uses the golden angle (137.5°); branching is a stochastic L-system; petal profiles are parametric Bézier surfaces evaluated in a vertex shader.

---

## Build Progress

| Session | Goal | Status |
|---|---|---|
| 1 | Scaffold — Vite, ParamBus, lil-gui, RAF loop | ✅ |
| 2 | Mirrored webcam + cinematic treatment shader | ✅ |
| 3 | Stem particle trails | ✅ |
| 4 | L-system branching | ✅ |
| 5 | Dual bloom post-processing | — |
| 6 | Parametric petals (lily) | — |
| 7 | Hand tracking + constellations | — |
| 8 | Continuous gestures → ParamBus | — |
| 9 | Discrete gestures (fist, flick, reset) | — |
| 10 | Iris + rose species | — |
| 11 | Polish + Vercel deploy | — |

---

## Performance Budget

- 60 fps at 1080p on integrated graphics (Iris Xe class)
- ~100–150k particles via instancing; per-particle animation in GLSL only
- Hand constellations: ≤ 42 dots + ~42 line segments — trivially cheap
- MediaPipe HandLandmarker on GPU delegate at camera rate (~30 fps)

---

## Author

**Anika Thakur** — portfolio showpiece built in Cursor.

---

## License

MIT
