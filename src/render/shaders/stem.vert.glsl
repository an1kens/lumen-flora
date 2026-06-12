attribute float aAlong;
attribute float aSeed;

uniform float uGrowth;
uniform float uTime;
uniform float uFrozen;

varying float vBrightness;

void main() {
  if (aAlong > uGrowth + 0.008) {
    gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vBrightness = 0.0;
    return;
  }

  vec3 pos = position;

  float sway = (1.0 - uFrozen) * 0.008;
  pos.x += sin(uTime * 0.9 + aSeed * 6.283) * sway * (0.2 + aAlong);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float tipDist = uGrowth - aAlong;
  float tipGlow = smoothstep(0.06, 0.0, tipDist);

  vBrightness = mix(0.25, 0.85, tipGlow);

  // Fine thread — small sprites, modest tip bloom only.
  float size = mix(1.2, 3.2, tipGlow);
  gl_PointSize = size * (160.0 / max(-mvPosition.z, 0.5));
}
