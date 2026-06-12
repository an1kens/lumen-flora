uniform float uDebug;

varying float vBrightness;

void main() {
  if (uDebug > 0.5) {
    gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
    return;
  }

  vec2 centered = gl_PointCoord - 0.5;
  float dist = length(centered);
  if (dist > 0.5) discard;

  // Tight core — less overlap, less additive blow-out.
  float alpha = smoothstep(0.5, 0.28, dist);
  float core = smoothstep(0.2, 0.0, dist);

  vec3 tipColor = vec3(0.85, 0.95, 0.8);
  vec3 bodyColor = vec3(0.35, 0.65, 0.5);
  vec3 col = mix(bodyColor, tipColor, core);

  col *= vBrightness * 0.45;

  gl_FragColor = vec4(col * alpha, alpha * 0.7);
}
