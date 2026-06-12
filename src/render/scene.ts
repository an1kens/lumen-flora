import * as THREE from 'three';

export interface GardenScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
}

/** Foreground garden scene — additive layers composited over the webcam. */
export function createGardenScene(): GardenScene {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 4);

  return { scene, camera };
}
