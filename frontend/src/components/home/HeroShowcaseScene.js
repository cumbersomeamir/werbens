"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

function createParticleField() {
  const count = 220;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const radius = 3.4 + Math.random() * 2.2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const index = i * 3;

    positions[index] = radius * Math.sin(phi) * Math.cos(theta);
    positions[index + 1] = radius * Math.cos(phi) * 0.62;
    positions[index + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: "#e8fffd",
    size: 0.06,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

function createOrbit(color, radius, tube, opacity, rotation) {
  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 20, 220),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
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
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
    camera.position.set(0, 0, 10.2);

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
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

    const ambientLight = new THREE.AmbientLight("#a4fff2", 1.2);
    const rimLight = new THREE.PointLight("#89fff1", 24, 28, 2);
    const fillLight = new THREE.PointLight("#2b9db2", 16, 26, 2);
    const topLight = new THREE.PointLight("#ffffff", 10, 20, 2);

    rimLight.position.set(5.4, 2.4, 5.2);
    fillLight.position.set(-4.8, -2.6, 4.8);
    topLight.position.set(0, 5.4, 5.8);

    scene.add(ambientLight, rimLight, fillLight, topLight);

    const rig = new THREE.Group();
    rig.scale.setScalar(1.32);
    scene.add(rig);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.18, 12),
      new THREE.MeshPhysicalMaterial({
        color: "#7fe7dc",
        emissive: "#1c6074",
        emissiveIntensity: 1.2,
        roughness: 0.12,
        metalness: 0.05,
        transparent: true,
        opacity: 0.98,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
      })
    );

    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(3, 2),
      new THREE.MeshBasicMaterial({
        color: "#ffffff",
        wireframe: true,
        transparent: true,
        opacity: 0.15,
      })
    );

    const orbitA = createOrbit("#d9fffb", 4.2, 0.08, 0.34, {
      x: Math.PI / 2.6,
      y: Math.PI / 5,
      z: 0.32,
    });
    const orbitB = createOrbit("#7fe7dc", 3.7, 0.06, 0.2, {
      x: Math.PI / 1.8,
      y: 0.26,
      z: Math.PI / 3.6,
    });
    const orbitC = createOrbit("#3ca5b8", 4.55, 0.06, 0.18, {
      x: Math.PI / 2.15,
      y: Math.PI / 3,
      z: Math.PI / 2.4,
    });

    const particles = createParticleField();
    const particleRig = new THREE.Group();
    particleRig.add(particles);

    rig.add(core, shell, orbitA, orbitB, orbitC, particleRig);

    const backdropGlow = new THREE.Mesh(
      new THREE.SphereGeometry(5.6, 32, 32),
      new THREE.MeshBasicMaterial({
        color: "#60dcd0",
        transparent: true,
        opacity: 0.06,
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

      core.rotation.x = elapsed * 0.24;
      core.rotation.y = elapsed * 0.36;
      core.scale.setScalar(1 + Math.sin(elapsed * 1.35) * 0.04);

      shell.rotation.x = -elapsed * 0.1;
      shell.rotation.y = elapsed * 0.14;

      orbitA.rotation.z = elapsed * 0.18;
      orbitB.rotation.x += 0.0018;
      orbitB.rotation.y = elapsed * 0.11;
      orbitC.rotation.z = -elapsed * 0.15;

      particleRig.rotation.y = elapsed * 0.045;
      particleRig.rotation.x = Math.sin(elapsed * 0.3) * 0.18;

      rig.rotation.z = Math.sin(elapsed * 0.16) * 0.07;
      rig.position.y = Math.sin(elapsed * 0.65) * 0.16;
      rig.position.x = Math.sin(elapsed * 0.22) * 0.12;

      rimLight.position.x = Math.cos(elapsed * 0.48) * 5.2;
      rimLight.position.y = 2.1 + Math.sin(elapsed * 0.42) * 1.5;
      fillLight.position.x = Math.cos(elapsed * 0.32 + Math.PI) * 4.1;
      fillLight.position.y = -2.1 + Math.sin(elapsed * 0.44 + 0.5) * 1.35;

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
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(127,231,220,0.08),transparent_22%)] sm:bg-[radial-gradient(circle_at_72%_42%,rgba(127,231,220,0.18),transparent_22%)]" />
      <div className="absolute right-[-30%] top-[28%] h-[15rem] w-[15rem] rounded-full bg-gradient-to-br from-[#aaf9f0]/18 via-[#7fe7dc]/14 to-[#46aebd]/12 opacity-45 blur-[12px] sm:right-[-6%] sm:top-[12%] sm:h-[24rem] sm:w-[24rem] sm:opacity-75 sm:blur-[2px] lg:right-[8%] lg:top-[14%] lg:h-[31rem] lg:w-[31rem]" />
      <div className="absolute -right-[24%] top-1/2 h-[22rem] w-[22rem] -translate-y-1/2 rounded-full bg-werbens-light-cyan/6 blur-[100px] sm:-right-[8%] sm:h-[44rem] sm:w-[44rem] sm:bg-werbens-light-cyan/8 lg:right-[-2%] lg:h-[58rem] lg:w-[58rem]" />
      <div className="hidden sm:block absolute right-[-8%] top-[8%] h-[26rem] w-[26rem] rounded-full border border-white/10 opacity-45 lg:right-[12%] lg:h-[42rem] lg:w-[42rem]" />
      <div className="hidden sm:block absolute right-[14%] top-[16%] h-[28rem] w-[28rem] rounded-full border border-werbens-light-cyan/14 opacity-55 lg:right-[18%] lg:h-[36rem] lg:w-[36rem]" />
      <div className="hidden sm:block absolute right-[4%] top-[18%] h-[24rem] w-[34rem] rotate-[36deg] rounded-full border-[10px] border-white/20 opacity-65 lg:right-[14%] lg:h-[30rem] lg:w-[45rem]" />
      <div className="hidden sm:block absolute right-[22%] top-[8%] h-[28rem] w-[4.6rem] rotate-[33deg] rounded-full bg-werbens-dark-cyan/28 opacity-75 blur-[1px] lg:right-[28%] lg:h-[38rem] lg:w-[5.4rem]" />
      <div className="hidden sm:block absolute right-[10%] top-[14%] h-[32rem] w-[32rem] rounded-full border border-white/6 lg:right-[16%] lg:h-[48rem] lg:w-[48rem]" />
      <div className="hidden sm:block absolute right-[18%] top-[22%] h-[24rem] w-[24rem] rounded-full border border-werbens-light-cyan/10 lg:right-[24%] lg:h-[36rem] lg:w-[36rem]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#07111d] via-[#07111d]/90 to-[#07111d]/68 sm:via-[#07111d]/78 sm:to-transparent lg:from-[#07111d] lg:via-[#07111d]/58 lg:to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#07111d]/20 via-[#07111d]/12 to-[#07111d]/76 sm:from-[#07111d]/14 sm:via-transparent sm:to-[#07111d]/64" />
      <canvas
        ref={canvasRef}
        className="absolute right-[-52%] top-[56%] z-[1] h-[108%] w-[170%] -translate-y-1/2 opacity-16 sm:right-[-8%] sm:top-1/2 sm:h-[120%] sm:w-[118%] sm:opacity-82 lg:right-[-2%] lg:w-[82%]"
      />
    </div>
  );
}
