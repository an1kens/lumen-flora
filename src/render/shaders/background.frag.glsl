uniform sampler2D uVideo;
uniform float uTime;
uniform float uBgDim;
uniform vec2 uResolution;

varying vec2 vUv;

// Matches mirrorX() in src/core/mirror.ts — keep in sync.
float mirrorX(float x) {
  return 1.0 - x;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  // Horizontal mirror (selfie) + vertical flip (video vs WebGL origin).
  vec2 uv = vec2(mirrorX(vUv.x), mirrorX(vUv.y));
  vec3 color = texture2D(uVideo, uv).rgb;

  float lum = dot(color, vec3(0.299, 0.587, 0.114));

  // Moderate desaturation — moody but still recognisable.
  color = mix(vec3(lum), color, 0.28);

  // Pull luminance into ~25–35 % range.
  color *= 0.36;

  // Teal tint only in deep shadows, not across the whole frame.
  vec3 shadowTint = vec3(0.039, 0.078, 0.094);
  float shadowWeight = smoothstep(0.18, 0.0, lum);
  color = mix(color, shadowTint, shadowWeight * 0.3);

  // Soft radial vignette.
  vec2 vig = (vUv - 0.5) * 2.0;
  float vigAmt = 1.0 - dot(vig, vig) * 0.42;
  color *= smoothstep(0.15, 1.0, vigAmt);

  // Ultra-fine film grain.
  float grain = hash(gl_FragCoord.xy * 0.5 + uTime * 60.0);
  color += (grain - 0.5) * 0.028;

  // bgDim: 0 = treated but visible, 1 = fade to black.
  color *= mix(1.0, 0.02, uBgDim);

  gl_FragColor = vec4(color, 1.0);
}
