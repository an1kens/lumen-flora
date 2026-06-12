import * as THREE from 'three';
import type { ParamBus } from '../core/ParamBus';
import vertShader from './shaders/background.vert.glsl?raw';
import fragShader from './shaders/background.frag.glsl?raw';

const MAX_TREATMENT_WIDTH = 1920;
const MAX_TREATMENT_HEIGHT = 1080;

export type BackgroundStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error';

export class BackgroundLayer {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  private video: HTMLVideoElement;
  private texture: THREE.VideoTexture;
  private material: THREE.ShaderMaterial;
  private mesh: THREE.Mesh;

  private status: BackgroundStatus = 'idle';
  private statusListeners: Array<(s: BackgroundStatus) => void> = [];
  private elapsed = 0;

  constructor(private bus: ParamBus) {
    this.video = document.createElement('video');
    this.video.playsInline = true;
    this.video.muted = true;
    this.video.setAttribute('playsinline', '');
    this.video.setAttribute('webkit-playsinline', '');

    this.texture = new THREE.VideoTexture(this.video);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    // Custom shader samples UVs manually — flipY stays false; Y corrected in GLSL.
    this.texture.flipY = false;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uVideo: { value: this.texture },
        uTime: { value: 0 },
        uBgDim: { value: 0.55 },
        uResolution: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: vertShader,
      fragmentShader: fragShader,
      depthTest: false,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.scene.add(this.mesh);
  }

  getStatus(): BackgroundStatus {
    return this.status;
  }

  onStatusChange(cb: (s: BackgroundStatus) => void): void {
    this.statusListeners.push(cb);
  }

  private setStatus(s: BackgroundStatus): void {
    this.status = s;
    for (const cb of this.statusListeners) cb(s);
  }

  /** Must be called from a user gesture (click) for Safari. */
  async start(): Promise<void> {
    if (this.status === 'active' || this.status === 'requesting') return;
    this.setStatus('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: MAX_TREATMENT_WIDTH, max: MAX_TREATMENT_WIDTH },
          height: { ideal: MAX_TREATMENT_HEIGHT, max: MAX_TREATMENT_HEIGHT },
          facingMode: 'user',
        },
        audio: false,
      });

      this.video.srcObject = stream;
      await new Promise<void>((resolve) => {
        if (this.video.readyState >= HTMLMediaElement.HAVE_METADATA) {
          resolve();
          return;
        }
        this.video.onloadedmetadata = () => resolve();
      });
      await this.video.play();
      this.texture.needsUpdate = true;
      this.setStatus('active');
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        this.setStatus('denied');
      } else {
        console.error('Webcam error:', err);
        this.setStatus('error');
      }
    }
  }

  resize(displayWidth: number, displayHeight: number): void {
    this.material.uniforms.uResolution.value.set(displayWidth, displayHeight);
  }

  update(dt: number): void {
    this.elapsed += dt;
    this.material.uniforms.uTime.value = this.elapsed;
    this.material.uniforms.uBgDim.value = this.bus.get('bgDim');

    if (this.status === 'active' && this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      this.texture.needsUpdate = true;
    }
  }

  /**
   * Render treated webcam fullscreen.
   * Leaves autoClear = false so the garden pass composites on top.
   */
  render(renderer: THREE.WebGLRenderer): void {
    renderer.setClearColor(0x050508, 1);

    if (this.status !== 'active') {
      renderer.autoClear = true;
      renderer.clear(true, true, true);
      return;
    }

    renderer.autoClear = true;
    renderer.clear(true, true, true);
    renderer.render(this.scene, this.camera);

    // Garden pass must NOT clear colour — only reset depth.
    renderer.autoClear = false;
    renderer.clear(false, true, false);
  }

  dispose(): void {
    const stream = this.video.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    this.texture.dispose();
    this.material.dispose();
  }
}
