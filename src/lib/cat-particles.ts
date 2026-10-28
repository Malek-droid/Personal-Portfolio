import * as THREE from "three";

export const DESKTOP_PARTICLE_COUNT = 7000;
export const MOBILE_PARTICLE_COUNT = 3000;
export const MOBILE_BREAKPOINT_PX = 768;

const SCATTER_RADIUS = 0.45;
const SCATTER_STRENGTH = 0.08;
const RETURN_SPRING = 0.08;
const DAMPING = 0.82;
const MAX_DPR = 2;

// World space horizontal span (cat fits with native aspect ratio inside camera view)
const WORLD_WIDTH_SPAN = 2.0;

// Named three-stop luminance color mapping (shadows -> midtones -> highlights)
export const COLOR_SHADOW_DEEP_VIOLET = 0x4c1d95; // #4c1d95 deep violet
export const COLOR_MIDTONE_VIOLET = 0x7c3aed;     // #7c3aed violet
export const COLOR_HIGHLIGHT_LAVENDER = 0xc4b5fd; // #c4b5fd light lavender

// Eye color constants (viewer's left is blue, viewer's right is yellow)
export const EYE_VIEWER_LEFT_COLOR = "#3b9eff";  // Blue (#3b9eff)
export const EYE_VIEWER_RIGHT_COLOR = "#ffd23f"; // Yellow (#ffd23f)

// Normalized eye coordinates (0 to 1 relative to cat-photo.png dimensions)
// Viewer's left eye (cat's right eye)
export const EYE_VIEWER_LEFT_NORM_X = 0.5374;
export const EYE_VIEWER_LEFT_NORM_Y = 0.7290;

// Viewer's right eye (cat's left eye)
export const EYE_VIEWER_RIGHT_NORM_X = 0.8414;
export const EYE_VIEWER_RIGHT_NORM_Y = 0.4953;

// Sampling and dissolve thresholds
const ALPHA_MIN_THRESHOLD = 32;
const LUMINANCE_CURVE_EXPONENT = 1.6;
const MIN_ACCEPTANCE_PROBABILITY = 0.08;
const DISSOLVE_START_NORM_Y = 0.85; // Bottom 15% dissolves downward

/**
 * Checks whether WebGL is supported in the current environment.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/**
 * Named, tunable acceptance probability curve for particle placement.
 * Maps normalized luminance [0, 1] to probability [MIN_ACCEPT, 1.0].
 * Bright fur (lum ~ 1.0) gets high density (~1.0).
 * Dark areas (eyes, mouth, shadows, lum < 0.35) get low density (~0.08)
 * to read cleanly as negative space.
 */
function computeLuminanceProbability(luminance: number): number {
  return (
    MIN_ACCEPTANCE_PROBABILITY +
    (1.0 - MIN_ACCEPTANCE_PROBABILITY) * Math.pow(luminance, LUMINANCE_CURVE_EXPONENT)
  );
}

interface ParticleData {
  positions: Float32Array;
  targets: Float32Array;
  velocities: Float32Array;
  seeds: Float32Array;
  alphas: Float32Array;
  sizes: Float32Array;
  edges: Float32Array;
  luminances: Float32Array;
  normYs: Float32Array;
}

interface EyeLocation {
  worldX: number;
  worldY: number;
}

/**
 * Samples pixels from the cat-photo.png cut-out using an offscreen canvas.
 * Probability of placing a particle scales with pixel luminance so bright fur
 * is dense, while dark features (eyes, nose, mouth) read as negative space.
 * Edge pixels receive ~2x density for a crisp silhouette contour.
 */
async function sampleCatPhotoPoints(
  photoUrl: string,
  targetCount: number
): Promise<{ points: ParticleData; eyeLeft: EyeLocation; eyeRight: EyeLocation }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const imgWidth = img.naturalWidth || img.width;
      const imgHeight = img.naturalHeight || img.height;
      const canvas = document.createElement("canvas");
      canvas.width = imgWidth;
      canvas.height = imgHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("Unable to create 2D canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
      const imgData = ctx.getImageData(0, 0, imgWidth, imgHeight);
      const data = imgData.data;

      const isFilled = (x: number, y: number) => {
        if (x < 0 || x >= imgWidth || y < 0 || y >= imgHeight) return false;
        return data[(y * imgWidth + x) * 4 + 3] > ALPHA_MIN_THRESHOLD;
      };

      interface SampledPixel {
        x: number;
        y: number;
        lum: number;
        isEdge: boolean;
        normY: number;
      }

      const candidatePixels: SampledPixel[] = [];

      for (let y = 0; y < imgHeight; y++) {
        const normY = y / imgHeight;
        for (let x = 0; x < imgWidth; x++) {
          const idx = (y * imgWidth + x) * 4;
          const alpha = data[idx + 3];
          if (alpha <= ALPHA_MIN_THRESHOLD) continue;

          // Dissolve bottom ~15% by reducing acceptance probability towards the bottom
          if (normY > DISSOLVE_START_NORM_Y) {
            const dissolveRatio = (normY - DISSOLVE_START_NORM_Y) / (1.0 - DISSOLVE_START_NORM_Y);
            if (Math.random() < dissolveRatio * 0.65) continue;
          }

          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;

          // Luminance-based probabilistic placement
          const placementProb = computeLuminanceProbability(lum);
          if (Math.random() > placementProb) continue;

          // Outline edge detection (check 2px cardinal neighbors)
          const onEdge =
            !isFilled(x - 2, y) ||
            !isFilled(x + 2, y) ||
            !isFilled(x, y - 2) ||
            !isFilled(x, y + 2);

          candidatePixels.push({ x, y, lum, isEdge: onEdge, normY });

          // Boost density ~2x along the contour edge so ears and silhouette pop
          if (onEdge) {
            candidatePixels.push({
              x: x + (Math.random() - 0.5) * 1.5,
              y: y + (Math.random() - 0.5) * 1.5,
              lum,
              isEdge: true,
              normY,
            });
          }
        }
      }

      // Shuffle sampled candidates
      for (let i = candidatePixels.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = candidatePixels[i];
        candidatePixels[i] = candidatePixels[j];
        candidatePixels[j] = temp;
      }

      const count = Math.min(targetCount, candidatePixels.length);
      const positions = new Float32Array(count * 3);
      const targets = new Float32Array(count * 3);
      const velocities = new Float32Array(count * 3);
      const seeds = new Float32Array(count * 4);
      const alphas = new Float32Array(count);
      const sizes = new Float32Array(count);
      const edges = new Float32Array(count);
      const luminances = new Float32Array(count);
      const normYs = new Float32Array(count);

      // Preserve native aspect ratio without stretching
      const imageAspect = imgWidth / imgHeight;
      const worldWidth = WORLD_WIDTH_SPAN;
      const worldHeight = WORLD_WIDTH_SPAN / imageAspect;

      for (let i = 0; i < count; i++) {
        const item = candidatePixels[i];
        const px = item.x;
        const py = item.y;
        const isEdge = item.isEdge;
        const normY = item.normY;

        const worldX = ((px / imgWidth) - 0.5) * worldWidth;
        const worldY = (0.5 - (py / imgHeight)) * worldHeight;
        const worldZ = (Math.random() - 0.5) * 0.08;

        positions[i * 3] = worldX;
        positions[i * 3 + 1] = worldY;
        positions[i * 3 + 2] = worldZ;

        targets[i * 3] = worldX;
        targets[i * 3 + 1] = worldY;
        targets[i * 3 + 2] = worldZ;

        velocities[i * 3] = 0;
        velocities[i * 3 + 1] = 0;
        velocities[i * 3 + 2] = 0;

        seeds[i * 4] = Math.random();
        seeds[i * 4 + 1] = Math.random();
        seeds[i * 4 + 2] = Math.random();
        seeds[i * 4 + 3] = Math.random();

        alphas[i] = isEdge ? 0.95 : 0.85;
        sizes[i] = isEdge ? Math.random() * 1.5 + 2.8 : Math.random() * 2.0 + 2.3;
        edges[i] = isEdge ? 1.0 : 0.0;
        luminances[i] = item.lum;
        normYs[i] = normY;
      }

      // World positions for eyes derived from normalized constants
      const eyeLeftWorldX = (EYE_VIEWER_LEFT_NORM_X - 0.5) * worldWidth;
      const eyeLeftWorldY = (0.5 - EYE_VIEWER_LEFT_NORM_Y) * worldHeight;
      const eyeRightWorldX = (EYE_VIEWER_RIGHT_NORM_X - 0.5) * worldWidth;
      const eyeRightWorldY = (0.5 - EYE_VIEWER_RIGHT_NORM_Y) * worldHeight;

      resolve({
        points: { positions, targets, velocities, seeds, alphas, sizes, edges, luminances, normYs },
        eyeLeft: { worldX: eyeLeftWorldX, worldY: eyeLeftWorldY },
        eyeRight: { worldX: eyeRightWorldX, worldY: eyeRightWorldY },
      });
    };
    img.onerror = (err) => reject(err);
    img.src = photoUrl;
  });
}

interface EyeVisual {
  group: THREE.Group;
  updateTime: (elapsedTime: number) => void;
  dispose: () => void;
}

/**
 * Creates an eye visual composed of a dense cluster of colored particles
 * plus a soft glowing aura sprite that gently pulses with time.
 */
function createEyeVisual(
  centerX: number,
  centerY: number,
  colorHex: string,
  pixelRatio: number,
  clusterCount = 20
): EyeVisual {
  const group = new THREE.Group();

  // 1. Dense particle cluster around eye center
  const clusterPositions = new Float32Array(clusterCount * 3);
  const clusterSeeds = new Float32Array(clusterCount);
  const clusterRadius = 0.030;

  for (let i = 0; i < clusterCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * clusterRadius;
    clusterPositions[i * 3] = centerX + Math.cos(angle) * r;
    clusterPositions[i * 3 + 1] = centerY + Math.sin(angle) * r * 0.85; // slightly almond
    clusterPositions[i * 3 + 2] = 0.035;
    clusterSeeds[i] = Math.random();
  }

  const clusterGeo = new THREE.BufferGeometry();
  clusterGeo.setAttribute("position", new THREE.BufferAttribute(clusterPositions, 3));
  clusterGeo.setAttribute("aSeed", new THREE.BufferAttribute(clusterSeeds, 1));

  const clusterMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
    },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime;
      uniform float uPixelRatio;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float pulse = 0.90 + 0.10 * sin(uTime * 1.8 + aSeed * 3.14);
        gl_PointSize = 6.0 * uPixelRatio * pulse;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        float alpha = smoothstep(0.5, 0.15, dist);
        gl_FragColor = vec4(uColor, alpha * 0.95);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const clusterPoints = new THREE.Points(clusterGeo, clusterMat);
  group.add(clusterPoints);

  // 2. Soft glowing aura sprite
  const glowGeo = new THREE.BufferGeometry();
  glowGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([centerX, centerY, 0.04]), 3));

  const glowMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uPixelRatio;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float pulse = 0.85 + 0.15 * sin(uTime * 1.8);
        gl_PointSize = 26.0 * uPixelRatio * pulse;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        float glow = smoothstep(0.5, 0.0, dist);
        gl_FragColor = vec4(uColor, glow * 0.80);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const glowPoints = new THREE.Points(glowGeo, glowMat);
  group.add(glowPoints);

  return {
    group,
    updateTime: (elapsedTime: number) => {
      clusterMat.uniforms.uTime.value = elapsedTime;
      glowMat.uniforms.uTime.value = elapsedTime;
    },
    dispose: () => {
      clusterGeo.dispose();
      clusterMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
    },
  };
}

/**
 * Creates and runs the Three.js particle cat simulation.
 */
export function initParticleCat(
  container: HTMLElement,
  options: { isReducedMotion: boolean }
): { dispose: () => void } {
  let isDisposed = false;
  let rafId: number | null = null;
  let isVisible = true;

  const width = container.clientWidth || 220;
  const height = container.clientHeight || 270;
  const isMobile = width < MOBILE_BREAKPOINT_PX;
  const particleCount = isMobile ? MOBILE_PARTICLE_COUNT : DESKTOP_PARTICLE_COUNT;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_DPR);

  // Scene & Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 3.2;

  // Renderer with transparent background
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setSize(width, height);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // Mouse interaction state
  const mousePlane = new THREE.Vector2(-9999, -9999);
  let hasPointer = false;

  const handlePointerMove = (e: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Unproject to z=0 plane
    const vec = new THREE.Vector3(ndcX, ndcY, 0.5);
    vec.unproject(camera);
    vec.sub(camera.position).normalize();
    const distance = -camera.position.z / vec.z;
    const pos = camera.position.clone().add(vec.multiplyScalar(distance));

    mousePlane.set(pos.x, pos.y);
    hasPointer = true;
  };

  const handlePointerLeave = () => {
    mousePlane.set(-9999, -9999);
    hasPointer = false;
  };

  if (!options.isReducedMotion) {
    container.addEventListener("pointermove", handlePointerMove, { passive: true });
    container.addEventListener("pointerleave", handlePointerLeave, { passive: true });
  }

  // Particle Mesh & Eye Sprites
  let pointsMesh: THREE.Points | null = null;
  let particleData: ParticleData | null = null;
  let eyeLeftVisual: EyeVisual | null = null;
  let eyeRightVisual: EyeVisual | null = null;
  let material: THREE.ShaderMaterial | null = null;

  // Shader material for three-stop violet particles with luminance mapping & neck dissolve
  const vertexShader = `
    attribute vec4 aSeed;
    attribute float aAlpha;
    attribute float aSize;
    attribute float aEdge;
    attribute float aLuminance;
    attribute float aNormY;

    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uReducedMotion;
    uniform vec3 uColorShadow;
    uniform vec3 uColorMidtone;
    uniform vec3 uColorHighlight;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vec3 pos = position;

      if (uReducedMotion < 0.5) {
        // Subtle organic breathing drift
        pos.x += sin(uTime * 0.9 + aSeed.x * 6.28) * 0.010;
        pos.y += cos(uTime * 0.7 + aSeed.y * 6.28) * 0.010;

        // Dissolve bottom ~15% of the image (aNormY > 0.85) downward
        if (aNormY > 0.85) {
          float dissolveProgress = (aNormY - 0.85) / 0.15;
          float drift = mod(uTime * 0.06 + aSeed.z * 1.5, 0.28) * dissolveProgress;
          pos.y -= drift;
        }
      }

      // Three-stop violet mapping: shadows -> midtones -> highlights
      vec3 mappedColor;
      if (aLuminance < 0.5) {
        mappedColor = mix(uColorShadow, uColorMidtone, aLuminance * 2.0);
      } else {
        mappedColor = mix(uColorMidtone, uColorHighlight, (aLuminance - 0.5) * 2.0);
      }

      // Boost outline edge highlighting with lavender
      if (aEdge > 0.5) {
        mappedColor = mix(mappedColor, uColorHighlight, 0.40);
      }

      vColor = mappedColor;

      // Soft vertical fade on dissolving neck particles
      if (aNormY > 0.85) {
        float fade = (aNormY - 0.85) / 0.15;
        vAlpha = aAlpha * (1.0 - fade * 0.50);
      } else {
        vAlpha = aAlpha;
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = aSize * uPixelRatio * (2.8 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      // Soft round circular particle
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;

      float intensity = smoothstep(0.5, 0.05, dist);
      gl_FragColor = vec4(vColor, intensity * vAlpha);
    }
  `;

  sampleCatPhotoPoints("/cat-photo.png", particleCount)
    .then(({ points, eyeLeft, eyeRight }) => {
      if (isDisposed) return;
      particleData = points;

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(points.positions, 3));
      geometry.setAttribute("aSeed", new THREE.BufferAttribute(points.seeds, 4));
      geometry.setAttribute("aAlpha", new THREE.BufferAttribute(points.alphas, 1));
      geometry.setAttribute("aSize", new THREE.BufferAttribute(points.sizes, 1));
      geometry.setAttribute("aEdge", new THREE.BufferAttribute(points.edges, 1));
      geometry.setAttribute("aLuminance", new THREE.BufferAttribute(points.luminances, 1));
      geometry.setAttribute("aNormY", new THREE.BufferAttribute(points.normYs, 1));

      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: pixelRatio },
          uReducedMotion: { value: options.isReducedMotion ? 1.0 : 0.0 },
          uColorShadow: { value: new THREE.Color(COLOR_SHADOW_DEEP_VIOLET) },
          uColorMidtone: { value: new THREE.Color(COLOR_MIDTONE_VIOLET) },
          uColorHighlight: { value: new THREE.Color(COLOR_HIGHLIGHT_LAVENDER) },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      pointsMesh = new THREE.Points(geometry, material);
      scene.add(pointsMesh);

      // Saturated glowing eye visuals (cluster + soft aura sprite)
      eyeLeftVisual = createEyeVisual(eyeLeft.worldX, eyeLeft.worldY, EYE_VIEWER_LEFT_COLOR, pixelRatio);
      eyeRightVisual = createEyeVisual(eyeRight.worldX, eyeRight.worldY, EYE_VIEWER_RIGHT_COLOR, pixelRatio);
      scene.add(eyeLeftVisual.group);
      scene.add(eyeRightVisual.group);
    })
    .catch((err) => {
      console.warn("Failed to load cat photo particles:", err);
    });

  // Animation Loop
  const clock = new THREE.Clock();

  const tick = () => {
    if (isDisposed) return;
    rafId = requestAnimationFrame(tick);

    if (!isVisible) return;

    const elapsedTime = clock.getElapsedTime();

    if (material) {
      material.uniforms.uTime.value = elapsedTime;
    }
    if (eyeLeftVisual) {
      eyeLeftVisual.updateTime(elapsedTime);
    }
    if (eyeRightVisual) {
      eyeRightVisual.updateTime(elapsedTime);
    }

    // Pointer scatter physics (disabled under reduced motion)
    if (!options.isReducedMotion && pointsMesh && particleData) {
      const { positions, targets, velocities } = particleData;
      const count = positions.length / 3;
      const mx = mousePlane.x;
      const my = mousePlane.y;

      let positionChanged = false;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const px = positions[i3];
        const py = positions[i3 + 1];
        const tx = targets[i3];
        const ty = targets[i3 + 1];

        let vx = velocities[i3];
        let vy = velocities[i3 + 1];

        // Scatter repulsion when cursor is near
        if (hasPointer) {
          const dx = px - mx;
          const dy = py - my;
          const distSq = dx * dx + dy * dy;
          if (distSq < SCATTER_RADIUS * SCATTER_RADIUS && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const force = (1.0 - dist / SCATTER_RADIUS) * SCATTER_STRENGTH;
            vx += (dx / dist) * force;
            vy += (dy / dist) * force;
          }
        }

        // Return spring back to rest target
        vx += (tx - px) * RETURN_SPRING;
        vy += (ty - py) * RETURN_SPRING;

        vx *= DAMPING;
        vy *= DAMPING;

        velocities[i3] = vx;
        velocities[i3 + 1] = vy;

        if (Math.abs(vx) > 0.0001 || Math.abs(vy) > 0.0001) {
          positions[i3] += vx;
          positions[i3 + 1] += vy;
          positionChanged = true;
        }
      }

      if (positionChanged) {
        pointsMesh.geometry.attributes.position.needsUpdate = true;
      }
    }

    renderer.render(scene, camera);
  };

  tick();

  // ResizeObserver
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const newWidth = entry.contentRect.width;
      const newHeight = entry.contentRect.height;
      if (newWidth > 0 && newHeight > 0) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    }
  });
  resizeObserver.observe(container);

  // IntersectionObserver to pause loop when scrolled out of view
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        isVisible = entry.isIntersecting;
      }
    },
    { threshold: 0.05 }
  );
  intersectionObserver.observe(container);

  // Visibilitychange listener to pause loop when tab is hidden
  const handleVisibilityChange = () => {
    if (document.hidden) {
      isVisible = false;
    } else {
      isVisible = true;
    }
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Dispose cleanup function
  const dispose = () => {
    isDisposed = true;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }

    container.removeEventListener("pointermove", handlePointerMove);
    container.removeEventListener("pointerleave", handlePointerLeave);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();

    if (pointsMesh) {
      scene.remove(pointsMesh);
      pointsMesh.geometry.dispose();
      (pointsMesh.material as THREE.Material).dispose();
    }
    if (eyeLeftVisual) {
      scene.remove(eyeLeftVisual.group);
      eyeLeftVisual.dispose();
    }
    if (eyeRightVisual) {
      scene.remove(eyeRightVisual.group);
      eyeRightVisual.dispose();
    }

    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
  };

  return { dispose };
}
