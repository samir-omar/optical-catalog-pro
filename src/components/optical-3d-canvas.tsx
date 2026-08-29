import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

function isWebGLSupported(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

export function Optical3DCanvas({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
    if (!isWebGLSupported()) {
      setWebglSupported(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let animId: number | null = null;
    let isCancelled = false;

    try {
      const width = Math.max(container.clientWidth || 320, 200);
      const height = Math.max(container.clientHeight || 280, 200);

      // Setup Scene, Camera, Renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 0, 7.5);

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "default",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(
        Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2),
      );

      // Append canvas safely
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(renderer.domElement);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
      mainLight.position.set(5, 5, 5);
      scene.add(mainLight);

      const rimLight = new THREE.DirectionalLight(0x10b981, 2.0);
      rimLight.position.set(-5, -3, -3);
      scene.add(rimLight);

      const pointLight = new THREE.PointLight(0xa855f7, 3, 20);
      pointLight.position.set(0, 0, 4);
      scene.add(pointLight);

      // Group for the entire eyewear assembly
      const glassesGroup = new THREE.Group();
      scene.add(glassesGroup);

      // Materials
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.25,
      });

      const goldBridgeMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.9,
        roughness: 0.2,
      });

      // Lens Material
      const lensMat = new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.55,
        roughness: 0.05,
        metalness: 0.1,
        transmission: 0.85,
        ior: 1.67,
        reflectivity: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      });

      // AR Coating sheen ring
      const arCoatingMat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0.35,
        wireframe: true,
      });

      const lensRadius = 1.05;
      const eyeDistance = 1.35;

      // Create Right and Left Lenses
      const lensGeom = new THREE.CylinderGeometry(lensRadius, lensRadius, 0.06, 48);
      const rightLens = new THREE.Mesh(lensGeom, lensMat);
      rightLens.rotation.x = Math.PI / 2;
      rightLens.position.x = eyeDistance;
      glassesGroup.add(rightLens);

      const leftLens = new THREE.Mesh(lensGeom, lensMat);
      leftLens.rotation.x = Math.PI / 2;
      leftLens.position.x = -eyeDistance;
      glassesGroup.add(leftLens);

      // AR Ring Overlays
      const ringGeom = new THREE.RingGeometry(lensRadius * 0.92, lensRadius * 0.98, 36);
      const rightRing = new THREE.Mesh(ringGeom, arCoatingMat);
      rightRing.position.set(eyeDistance, 0, 0.04);
      glassesGroup.add(rightRing);

      const leftRing = new THREE.Mesh(ringGeom, arCoatingMat);
      leftRing.position.set(-eyeDistance, 0, 0.04);
      glassesGroup.add(leftRing);

      // Frame Rims
      const rimGeom = new THREE.TorusGeometry(lensRadius, 0.06, 24, 64);
      const rightRim = new THREE.Mesh(rimGeom, frameMat);
      rightRim.position.x = eyeDistance;
      glassesGroup.add(rightRim);

      const leftRim = new THREE.Mesh(rimGeom, frameMat);
      leftRim.position.x = -eyeDistance;
      glassesGroup.add(leftRim);

      // Bridge
      const bridgeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-eyeDistance + lensRadius * 0.95, 0.25, 0),
        new THREE.Vector3(0, 0.42, 0.1),
        new THREE.Vector3(eyeDistance - lensRadius * 0.95, 0.25, 0),
      ]);
      const bridgeGeom = new THREE.TubeGeometry(bridgeCurve, 20, 0.045, 12, false);
      const bridge = new THREE.Mesh(bridgeGeom, goldBridgeMat);
      glassesGroup.add(bridge);

      // Temple Arms
      const leftTempleCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-eyeDistance - lensRadius, 0.2, 0),
        new THREE.Vector3(-eyeDistance - lensRadius - 0.2, 0.2, -1.8),
        new THREE.Vector3(-eyeDistance - lensRadius - 0.25, -0.3, -2.8),
      ]);
      const leftTemple = new THREE.Mesh(
        new THREE.TubeGeometry(leftTempleCurve, 24, 0.04, 12, false),
        frameMat,
      );
      glassesGroup.add(leftTemple);

      const rightTempleCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(eyeDistance + lensRadius, 0.2, 0),
        new THREE.Vector3(eyeDistance + lensRadius + 0.2, 0.2, -1.8),
        new THREE.Vector3(eyeDistance + lensRadius + 0.25, -0.3, -2.8),
      ]);
      const rightTemple = new THREE.Mesh(
        new THREE.TubeGeometry(rightTempleCurve, 24, 0.04, 12, false),
        frameMat,
      );
      glassesGroup.add(rightTemple);

      // Optical particles
      const particleGroup = new THREE.Group();
      scene.add(particleGroup);

      const particleGeom = new THREE.BufferGeometry();
      const particleCount = 40;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 10;
        positions[i + 1] = (Math.random() - 0.5) * 6;
        positions[i + 2] = (Math.random() - 0.5) * 6;
      }
      particleGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.06,
        transparent: true,
        opacity: 0.6,
      });
      const particles = new THREE.Points(particleGeom, particleMat);
      particleGroup.add(particles);

      // Mouse Parallax
      let mouseX = 0;
      let mouseY = 0;
      let targetX = 0;
      let targetY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        if (!container) return;
        const rect = container.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        }
      };

      if (typeof window !== "undefined") {
        window.addEventListener("mousemove", handleMouseMove);
      }

      // Resize handler
      const handleResize = () => {
        if (!container || !renderer) return;
        const w = Math.max(container.clientWidth || 320, 200);
        const h = Math.max(container.clientHeight || 280, 200);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      if (typeof window !== "undefined") {
        window.addEventListener("resize", handleResize);
      }

      // Animation loop
      const clock = new THREE.Clock();
      const animate = () => {
        if (isCancelled) return;
        animId = requestAnimationFrame(animate);

        try {
          if (!renderer) return;
          const elapsedTime = clock.getElapsedTime();

          if (Number.isFinite(mouseX) && Number.isFinite(mouseY)) {
            targetX += (mouseX * 0.5 - targetX) * 0.05;
            targetY += (mouseY * 0.3 - targetY) * 0.05;
          }

          if (Number.isFinite(targetX) && Number.isFinite(targetY)) {
            glassesGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.25 + targetX;
            glassesGroup.rotation.x = Math.cos(elapsedTime * 0.6) * 0.12 - targetY;
          }
          glassesGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.12;

          particleGroup.rotation.y = elapsedTime * 0.05;

          renderer.render(scene, camera);
        } catch (renderError) {
          console.warn("Optical3DCanvas render skipped:", renderError);
          if (animId) cancelAnimationFrame(animId);
        }
      };

      animate();

      return () => {
        isCancelled = true;
        if (animId) cancelAnimationFrame(animId);
        if (typeof window !== "undefined") {
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("resize", handleResize);
        }
        try {
          if (renderer) {
            renderer.dispose();
            if (renderer.domElement && container && container.contains(renderer.domElement)) {
              container.removeChild(renderer.domElement);
            }
          }
        } catch {
          // ignore cleanup errors
        }
      };
    } catch (e) {
      console.warn("WebGL initialization failed, falling back to 2D graphic:", e);
      setWebglSupported(false);
    }
  }, []);

  if (!isClient || !webglSupported) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="relative flex h-52 w-52 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500/20 via-emerald-500/10 to-indigo-500/20 p-8 shadow-2xl backdrop-blur-xl border border-sky-500/20 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full border-4 border-sky-400/80 bg-sky-500/10 shadow-inner flex items-center justify-center">
              <span className="text-xs font-mono font-bold text-sky-300">-2.50</span>
            </div>
            <div className="h-1 w-6 bg-amber-400 rounded-full" />
            <div className="h-16 w-16 rounded-full border-4 border-sky-400/80 bg-sky-500/10 shadow-inner flex items-center justify-center">
              <span className="text-xs font-mono font-bold text-sky-300">-2.75</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[300px] overflow-hidden select-none pointer-events-auto ${className}`}
    />
  );
}
