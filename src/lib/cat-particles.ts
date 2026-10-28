import * as THREE from "three";

export const DESKTOP_PARTICLE_COUNT = 7000;
export const MOBILE_PARTICLE_COUNT = 3000;
export const MOBILE_BREAKPOINT_PX = 768;

const SCATTER_RADIUS = 0.45;
const SCATTER_STRENGTH = 0.08;
const RETURN_SPRING = 0.08;
const DAMPING = 0.82;
const MAX_DPR = 2;

// Saturated readable glowing eye colors: left BLUE (#3b9eff), right YELLOW (#ffd23f)
const EYE_LEFT_COLOR = 0x3b9eff;
const EYE_RIGHT_COLOR = 0xffd23f;

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

interface ParticleData {
  positions: Float32Array;
  targets: Float32Array;
  velocities: Float32Array;
  seeds: Float32Array;
  alphas: Float32Array;
  sizes: Float32Array;
  edges: Float32Array;
}

/**
 * Samples filled pixels from the SVG silhouette using an offscreen canvas.
 * Edge pixels receive 2x density and a brighter violet highlight so the cat's
 * head, ears, and whiskers pop clearly at rest.
 */
async function sampleSilhouettePoints(
  svgUrl: string,
  targetCount: number
): Promise<{ points: ParticleData; eyeLeft: [number, number]; eyeRight: [number, number] }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvasWidth = 400;
      const canvasHeight = 500;
      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("Unable to create 2D context"));
        return;
      }

      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      const data = imgData.data;

      const filledPixels: { x: number; y: number; isEdge: boolean }[] = [];

      const isFilled = (x: number, y: number) => {
        if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) return false;
        return data[(y * canvasWidth + x) * 4 + 3] > 64;
      };

      for (let y = 0; y < canvasHeight; y += 2) {
        for (let x = 0; x < canvasWidth; x += 2) {
          const idx = (y * canvasWidth + x) * 4;
          const alpha = data[idx + 3];
          if (alpha > 64) {
            // Dissolve effect: below the short neck stub (y > 425) only
            if (y > 425) {
              const fadeRatio = (y - 425) / (canvasHeight - 425);
              if (Math.random() < fadeRatio * 0.75) continue;
            }

            // Outline edge detection: check 2px cardinal neighbors
            const onEdge =
              !isFilled(x - 2, y) ||
              !isFilled(x + 2, y) ||
              !isFilled(x, y - 2) ||
              !isFilled(x, y + 2);

            filledPixels.push({ x, y, isEdge: onEdge });

            // 2x particle density near the silhouette contour
            if (onEdge) {
              filledPixels.push({
                x: x + (Math.random() - 0.5) * 1.5,
                y: y + (Math.random() - 0.5) * 1.5,
                isEdge: true,
              });
            }
          }
        }
      }

      // Shuffle pixels
      for (let i = filledPixels.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = filledPixels[i];
        filledPixels[i] = filledPixels[j];
        filledPixels[j] = temp;
      }

      const count = Math.min(targetCount, filledPixels.length);
      const positions = new Float32Array(count * 3);
      const targets = new Float32Array(count * 3);
      const velocities = new Float32Array(count * 3);
      const seeds = new Float32Array(count * 4);
      const alphas = new Float32Array(count);
      const sizes = new Float32Array(count);
      const edges = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        const item = filledPixels[i];
        const px = item.x;
        const py = item.y;
        const isEdge = item.isEdge;

        // Map to world coordinates centered at (0, 0): [-1, 1] horizontally, [-1.25, 1.25] vertically
        const worldX = ((px / canvasWidth) - 0.5) * 2.0;
        const worldY = (0.5 - (py / canvasHeight)) * 2.5;
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

        const isBelowNeck = worldY < -0.8;
        alphas[i] = isBelowNeck ? 0.35 : isEdge ? 0.95 : 0.85;
        sizes[i] = isEdge ? Math.random() * 1.5 + 2.8 : Math.random() * 2.0 + 2.3;
        edges[i] = isEdge ? 1.0 : 0.0;
      }

      // Exact centers of the two almond eye cutouts in 400x500 space
      const eyeLeftX = ((150 / canvasWidth) - 0.5) * 2.0;
      const eyeLeftY = (0.5 - (245 / canvasHeight)) * 2.5;
      const eyeRightX = ((250 / canvasWidth) - 0.5) * 2.0;
      const eyeRightY = (0.5 - (245 / canvasHeight)) * 2.5;

      resolve({
        points: { positions, targets, velocities, seeds, alphas, sizes, edges },
        eyeLeft: [eyeLeftX, eyeLeftY],
        eyeRight: [eyeRightX, eyeRightY],
      });
    };
    img.onerror = (err) => reject(err);
    img.src = svgUrl;
  });
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

  // Scene & Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 3.2;

  // Renderer with transparent background
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
  renderer.setClearColor(0x000000, 0); // Transparent
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
  let eyeLeftMesh: THREE.Points | null = null;
  let eyeRightMesh: THREE.Points | null = null;
  let material: THREE.ShaderMaterial | null = null;

  // Shader material for soft violet particles with crisp edge highlighting
  const vertexShader = `
    attribute vec4 aSeed;
    attribute float aAlpha;
    attribute float aSize;
    attribute float aEdge;

    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uReducedMotion;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vec3 pos = position;

      if (uReducedMotion < 0.5) {
        // Subtle organic breathing drift
        pos.x += sin(uTime * 0.9 + aSeed.x * 6.28) * 0.010;
        pos.y += cos(uTime * 0.7 + aSeed.y * 6.28) * 0.010;

        // Downward dissolving drift below short neck stub only (leaving face/ears intact)
        if (pos.y < -0.75) {
          float drift = mod(uTime * 0.05 + aSeed.z * 1.5, 0.25);
          pos.y -= drift;
        }
      }

      // Base violet #7c3aed (0.486, 0.227, 0.929) with brighter violet along the silhouette edge
      vec3 baseViolet = vec3(0.486, 0.227, 0.929);
      vec3 lightViolet = vec3(0.68, 0.45, 1.0);
      vec3 edgeViolet = vec3(0.62, 0.38, 1.0);

      if (aEdge > 0.5) {
        vColor = mix(edgeViolet, lightViolet, aSeed.w * 0.45);
      } else {
        vColor = mix(baseViolet, lightViolet, aSeed.w * 0.30);
      }

      vAlpha = aAlpha;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = aSize * uPixelRatio * (2.8 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      // Soft round circular point
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;

      float intensity = smoothstep(0.5, 0.05, dist);
      gl_FragColor = vec4(vColor, intensity * vAlpha);
    }
  `;

  // Glowing eye point creation (saturated colors with soft pulse)
  const createEyePoint = (x: number, y: number, colorHex: number) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([x, y, 0.03]), 3));
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(colorHex) },
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, MAX_DPR) },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPixelRatio;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float pulse = 0.85 + 0.15 * sin(uTime * 1.8);
          gl_PointSize = 12.0 * uPixelRatio * pulse;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float glow = smoothstep(0.5, 0.0, dist);
          gl_FragColor = vec4(uColor, glow * 1.0);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Points(geo, mat);
  };

  sampleSilhouettePoints("/cat-silhouette.svg", particleCount)
    .then(({ points, eyeLeft, eyeRight }) => {
      if (isDisposed) return;
      particleData = points;

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(points.positions, 3));
      geometry.setAttribute("aSeed", new THREE.BufferAttribute(points.seeds, 4));
      geometry.setAttribute("aAlpha", new THREE.BufferAttribute(points.alphas, 1));
      geometry.setAttribute("aSize", new THREE.BufferAttribute(points.sizes, 1));
      geometry.setAttribute("aEdge", new THREE.BufferAttribute(points.edges, 1));

      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, MAX_DPR) },
          uReducedMotion: { value: options.isReducedMotion ? 1.0 : 0.0 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      pointsMesh = new THREE.Points(geometry, material);
      scene.add(pointsMesh);

      // Two bright saturated eyes (left BLUE #3b9eff, right YELLOW #ffd23f)
      eyeLeftMesh = createEyePoint(eyeLeft[0], eyeLeft[1], EYE_LEFT_COLOR);
      eyeRightMesh = createEyePoint(eyeRight[0], eyeRight[1], EYE_RIGHT_COLOR);
      scene.add(eyeLeftMesh);
      scene.add(eyeRightMesh);
    })
    .catch((err) => {
      console.warn("Failed to load particle cat silhouette:", err);
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
    if (eyeLeftMesh) {
      (eyeLeftMesh.material as THREE.ShaderMaterial).uniforms.uTime.value = elapsedTime;
    }
    if (eyeRightMesh) {
      (eyeRightMesh.material as THREE.ShaderMaterial).uniforms.uTime.value = elapsedTime;
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
    if (eyeLeftMesh) {
      scene.remove(eyeLeftMesh);
      eyeLeftMesh.geometry.dispose();
      (eyeLeftMesh.material as THREE.Material).dispose();
    }
    if (eyeRightMesh) {
      scene.remove(eyeRightMesh);
      eyeRightMesh.geometry.dispose();
      (eyeRightMesh.material as THREE.Material).dispose();
    }

    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
  };

  return { dispose };
}
