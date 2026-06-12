import * as THREE from 'three';

export interface GardenScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  debugOrb: THREE.Mesh;
  debugMat: THREE.MeshBasicMaterial;
}

/** Foreground garden scene — additive layers composited over the webcam. */
export function createGardenScene(): GardenScene {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 4);

  const debugMat = new THREE.MeshBasicMaterial({
    color: 0x88ffcc,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const debugOrb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 32), debugMat);
  scene.add(debugOrb);

  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-2, -1.5, 0),
    new THREE.Vector3(2, -1.5, 0),
  ]);
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x1a2a24,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  scene.add(new THREE.Line(lineGeo, lineMat));

  return { scene, camera, debugOrb, debugMat };
}
