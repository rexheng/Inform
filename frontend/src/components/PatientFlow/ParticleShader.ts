/**
 * GLSL shaders for the patient-flow particle renderer.
 *
 * Geometry: THREE.CircleGeometry rendered via THREE.InstancedMesh.
 * - gl_PointCoord / gl_PointSize are NOT used (those belong to Points sprites).
 * - Soft-circle alpha falloff is derived from the CircleGeometry UV coordinates,
 *   where the center sits at (0.5, 0.5) in UV space.
 */

export const vertexShader: string = /* glsl */ `
  // Per-instance attributes written by the particle engine each frame
  attribute vec3 aColour;
  attribute float aOpacity;
  attribute float aPhase;

  // Varyings passed to the fragment shader
  varying vec2  vUv;
  varying vec3  vColour;
  varying float vOpacity;
  varying float vPhase;

  void main() {
    // Forward the geometry's UV coordinates so the fragment shader can
    // compute distance from the circle centre (0.5, 0.5).
    vUv     = uv;
    vColour  = aColour;
    vOpacity = aOpacity;
    vPhase   = aPhase;

    // instanceMatrix contains the per-particle position/scale/rotation
    // baked by InstancedMesh every frame.
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader: string = /* glsl */ `
  uniform float uTime;

  varying vec2  vUv;
  varying vec3  vColour;
  varying float vOpacity;
  varying float vPhase;

  void main() {
    // CircleGeometry UVs: centre = (0.5, 0.5), edge ≈ radius from centre.
    // Convert to a [0, 1] distance value where 0 = centre, 1 = hard edge.
    float dist = length(vUv - vec2(0.5, 0.5)) * 2.0;

    // Soft alpha falloff — fade from opaque at centre to transparent at edge.
    // smoothstep(edge0, edge1, x): returns 0 at x<=edge0, 1 at x>=edge1
    // We want alpha=1 at centre (dist=0) and alpha=0 at rim (dist>=1).
    float alpha = smoothstep(1.0, 0.4, dist);

    // Discard fully transparent fragments to avoid overdraw artefacts.
    if (alpha <= 0.0) discard;

    // Optional pulse glow for particles with an active phase signal.
    float brightness = 1.0;
    if (vPhase > 0.0) {
      brightness = sin(uTime * 3.0 + vPhase) * 0.3 + 1.0;
    }

    gl_FragColor = vec4(vColour * brightness, alpha * vOpacity);
  }
`;
