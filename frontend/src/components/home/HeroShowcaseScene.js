"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const SCENE_STATS = [
  { label: "Tone fidelity", value: "97%" },
  { label: "Queued", value: "24" },
  { label: "Publish time", value: "< 8 min" },
];

function createParticleField() {
  const count = 180;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const radius = 2.2 + Math.random() * 1.8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const index = i * 3;

    positions[index] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index + 1] = radius * Math.cos(phi) * 0.72;
    positions[index + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: "#b8fff6",
    size: 0.055,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

function createOrbit(color, rotation) {
  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(2.3, 0.03, 18, 180),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.38,
    })
  );

  orbit.rotation.set(rotation.x, rotation.y, rotation.z);
  return orbit;
}

export function HeroShowcaseScene() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 7.8);

    let renderer;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return undefined;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

    const ambientLight = new THREE.AmbientLight("#8df6eb", 1.5);
    const rimLight = new THREE.PointLight("#7fe7dc", 18, 16, 2);
    const fillLight = new THREE.PointLight("#316879", 20, 18, 2);
    const topLight = new THREE.PointLight("#d6fffb", 14, 16, 2);

    rimLight.position.set(3.8, 1.6, 4.2);
    fillLight.position.set(-3.5, -1.4, 3.4);
    topLight.position.set(0, 3.5, 4.5);

    scene.add(ambientLight, rimLight, fillLight, topLight);

    const rig = new THREE.Group();
    scene.add(rig);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.35, 12),
      new THREE.MeshPhysicalMaterial({
        color: "#7fe7dc",
        emissive: "#154654",
        emissiveIntensity: 1.2,
        roughness: 0.18,
        metalness: 0.1,
        transparent: true,
        opacity: 0.96,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      })
    );

    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.9, 2),
      new THREE.MeshBasicMaterial({
        color: "#a3fff6",
        wireframe: true,
        transparent: true,
        opacity: 0.16,
      })
    );

    const orbitA = createOrbit("#7fe7dc", {
      x: Math.PI / 2.8,
      y: Math.PI / 6,
      z: 0,
    });
    const orbitB = createOrbit("#d8fffb", {
      x: Math.PI / 1.9,
      y: 0,
      z: Math.PI / 4,
    });
    const orbitC = createOrbit("#316879", {
      x: Math.PI / 2.2,
      y: Math.PI / 3,
      z: Math.PI / 2.5,
    });

    const particles = createParticleField();
    const particleRig = new THREE.Group();
    particleRig.add(particles);

    rig.add(core, shell, orbitA, orbitB, orbitC, particleRig);

    const backdropGlow = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 32, 32),
      new THREE.MeshBasicMaterial({
        color: "#49c7bb",
        transparent: true,
        opacity: 0.08,
      })
    );
    rig.add(backdropGlow);

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      const safeHeight = Math.max(clientHeight, 1);
      renderer.setSize(clientWidth, safeHeight, false);
      camera.aspect = clientWidth / safeHeight;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const clock = new THREE.Clock();
    let frameId = 0;

    const renderFrame = () => {
      const elapsed = clock.getElapsedTime();

      core.rotation.x = elapsed * 0.3;
      core.rotation.y = elapsed * 0.42;
      core.scale.setScalar(1 + Math.sin(elapsed * 1.6) * 0.035);

      shell.rotation.x = -elapsed * 0.12;
      shell.rotation.y = elapsed * 0.18;

      orbitA.rotation.z = elapsed * 0.24;
      orbitB.rotation.x += 0.002;
      orbitB.rotation.y = elapsed * 0.14;
      orbitC.rotation.z = -elapsed * 0.18;

      particleRig.rotation.y = elapsed * 0.08;
      particleRig.rotation.x = Math.sin(elapsed * 0.35) * 0.24;

      rig.rotation.z = Math.sin(elapsed * 0.2) * 0.08;
      rig.position.y = Math.sin(elapsed * 0.8) * 0.12;

      rimLight.position.x = Math.cos(elapsed * 0.7) * 3.8;
      rimLight.position.y = 1.6 + Math.sin(elapsed * 0.5) * 1.2;
      fillLight.position.x = Math.cos(elapsed * 0.4 + Math.PI) * 3.1;
      fillLight.position.y = -1.4 + Math.sin(elapsed * 0.55 + 0.5) * 1.1;

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(renderFrame);
    };

    renderer.render(scene, camera);

    if (!prefersReducedMotion) {
      frameId = window.requestAnimationFrame(renderFrame);
    }

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      resizeObserver.disconnect();

      rig.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="panel-surface-dark relative h-[18rem] overflow-hidden rounded-[2.1rem] sm:h-[24rem] lg:h-[29rem]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(127,231,220,0.12),transparent_36%)]" />
      <div className="hero-grid absolute inset-0 opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-[#06111d]/86" />
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-werbens-light-cyan/14 blur-[70px] sm:h-56 sm:w-56" />
        <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-werbens-light-cyan/16 bg-[radial-gradient(circle,rgba(127,231,220,0.2),rgba(127,231,220,0.02))] shadow-[0_0_80px_rgba(127,231,220,0.12)] sm:h-40 sm:w-40" />
        <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8 sm:h-60 sm:w-60" />
        <div className="absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full border border-werbens-light-cyan/8 sm:h-80 sm:w-80" />
      </div>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-[1] h-full w-full"
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute inset-0 z-[2] flex flex-col justify-between p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-werbens-light-cyan/74 sm:text-[0.68rem]">
              Live showcase
            </p>
            <p className="font-display mt-2 text-[1.35rem] font-bold text-white sm:text-[1.7rem]">
              Brand engine in motion
            </p>
          </div>
          <div className="rounded-full border border-werbens-light-cyan/18 bg-werbens-light-cyan/10 px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-werbens-light-cyan sm:text-[0.62rem]">
            Three.js
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {SCENE_STATS.map((item) => (
            <div
              key={item.label}
              className="rounded-[1rem] border border-white/8 bg-[#08131f]/66 px-3 py-3 backdrop-blur-xl"
            >
              <p className="font-display text-lg font-bold text-white sm:text-xl">
                {item.value}
              </p>
              <p className="mt-1 text-[0.56rem] font-semibold uppercase tracking-[0.18em] text-white/48 sm:text-[0.62rem]">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
