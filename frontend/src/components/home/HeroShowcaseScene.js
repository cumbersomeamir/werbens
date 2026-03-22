"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const NODE_CONFIGS = [
  { label: "IG", color: "#ff8ad8", radius: 2.85, angle: -0.25, speed: 0.18, arc: 0.92 },
  { label: "LI", color: "#7de3ff", radius: 3.05, angle: 0.8, speed: 0.16, arc: 0.58 },
  { label: "YT", color: "#ff7f8a", radius: 2.65, angle: 1.95, speed: 0.17, arc: -0.72 },
  { label: "EM", color: "#9ef5d6", radius: 2.9, angle: 3.0, speed: 0.14, arc: -0.56 },
  { label: "AD", color: "#ffd48a", radius: 3.18, angle: 4.05, speed: 0.15, arc: 0.7 },
  { label: "X", color: "#d1d5ff", radius: 2.78, angle: 5.1, speed: 0.19, arc: -0.86 },
];

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function createGlowTexture(colorStops) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  colorStops.forEach(([offset, color]) => gradient.addColorStop(offset, color));

  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createNodeTexture(label, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 160;
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  const gradient = context.createLinearGradient(20, 20, 140, 140);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "#07111d");

  context.fillStyle = gradient;
  context.beginPath();
  context.arc(80, 80, 48, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "rgba(255,255,255,0.18)";
  context.lineWidth = 4;
  context.beginPath();
  context.arc(80, 80, 48, 0, Math.PI * 2);
  context.stroke();

  context.fillStyle = "#f8fffe";
  context.font = "700 42px Inter, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, 80, 84);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function setCurvePositions(array, start, control, end, segments) {
  for (let i = 0; i < segments; i += 1) {
    const t = i / (segments - 1);
    const invT = 1 - t;
    const x =
      invT * invT * start.x + 2 * invT * t * control.x + t * t * end.x;
    const y =
      invT * invT * start.y + 2 * invT * t * control.y + t * t * end.y;
    const z =
      invT * invT * start.z + 2 * invT * t * control.z + t * t * end.z;

    const index = i * 3;
    array[index] = x;
    array[index + 1] = y;
    array[index + 2] = z;
  }
}

function getBezierPoint(start, control, end, t, target) {
  const invT = 1 - t;
  target.set(
    invT * invT * start.x + 2 * invT * t * control.x + t * t * end.x,
    invT * invT * start.y + 2 * invT * t * control.y + t * t * end.y,
    invT * invT * start.z + 2 * invT * t * control.z + t * t * end.z
  );
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

    const pointer = { x: 0, y: 0, active: false };
    const smoothPointer = { x: 0, y: 0 };
    let boostUntil = 0;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 8.2);

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
    renderer.toneMappingExposure = 1.06;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

    const rig = new THREE.Group();
    scene.add(rig);

    const ambientLight = new THREE.AmbientLight("#d8f7ff", 1.15);
    const mainLight = new THREE.PointLight("#8ef7ea", 16, 18, 2);
    const rimLight = new THREE.PointLight("#4fb0ff", 9, 22, 2);
    const accentLight = new THREE.PointLight("#b2fff4", 7, 18, 2);
    mainLight.position.set(2.8, 1.8, 4.8);
    rimLight.position.set(-3.4, -2.2, 4.2);
    accentLight.position.set(0, 3.8, 4.4);
    scene.add(ambientLight, mainLight, rimLight, accentLight);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 64, 64),
      new THREE.MeshPhysicalMaterial({
        color: "#7fe7dc",
        emissive: "#2a7585",
        emissiveIntensity: 0.9,
        roughness: 0.18,
        metalness: 0.04,
        transparent: true,
        opacity: 0.98,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
      })
    );

    const coreShell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.24, 2),
      new THREE.MeshBasicMaterial({
        color: "#dffefd",
        transparent: true,
        wireframe: true,
        opacity: 0.13,
      })
    );

    const glowTexture = createGlowTexture([
      [0, "rgba(255,255,255,0.95)"],
      [0.25, "rgba(127,231,220,0.75)"],
      [0.65, "rgba(96,220,208,0.18)"],
      [1, "rgba(96,220,208,0)"],
    ]);

    const coreGlow = glowTexture
      ? new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: glowTexture,
            transparent: true,
            depthWrite: false,
            opacity: 0.68,
          })
        )
      : null;

    if (coreGlow) {
      coreGlow.scale.set(3.4, 3.4, 1);
      rig.add(coreGlow);
    }

    rig.add(core, coreShell);

    const starField = new THREE.Points(
      (() => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(180 * 3);

        for (let i = 0; i < 180; i += 1) {
          const spread = 6.8;
          const index = i * 3;
          positions[index] = (Math.random() - 0.5) * spread * 2;
          positions[index + 1] = (Math.random() - 0.5) * spread * 1.45;
          positions[index + 2] = (Math.random() - 0.5) * 1.8;
        }

        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3)
        );
        return geometry;
      })(),
      new THREE.PointsMaterial({
        color: "#e4f8ff",
        size: 0.04,
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    scene.add(starField);

    const nodeGroups = [];
    const trails = [];
    const nodePositions = NODE_CONFIGS.map(() => new THREE.Vector3());

    NODE_CONFIGS.forEach((config) => {
      const group = new THREE.Group();

      const nodeGlow = glowTexture
        ? new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: glowTexture,
              transparent: true,
              depthWrite: false,
              opacity: 0.32,
              color: new THREE.Color(config.color),
            })
          )
        : null;

      if (nodeGlow) {
        nodeGlow.scale.set(1.2, 1.2, 1);
        group.add(nodeGlow);
      }

      const nodeTexture = createNodeTexture(config.label, config.color);
      const nodeSprite = nodeTexture
        ? new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: nodeTexture,
              transparent: true,
              depthWrite: false,
              opacity: 0.98,
            })
          )
        : new THREE.Mesh(
            new THREE.CircleGeometry(0.22, 28),
            new THREE.MeshBasicMaterial({
              color: config.color,
              transparent: true,
              opacity: 0.95,
            })
          );

      nodeSprite.scale.set(0.82, 0.82, 1);
      group.add(nodeSprite);

      group.userData = {
        glow: nodeGlow,
        sprite: nodeSprite,
      };

      rig.add(group);
      nodeGroups.push(group);

      const trailGeometry = new THREE.BufferGeometry();
      const trailPositions = new Float32Array(32 * 3);
      trailGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(trailPositions, 3)
      );

      const trail = new THREE.Line(
        trailGeometry,
        new THREE.LineBasicMaterial({
          color: config.color,
          transparent: true,
          opacity: 0.17,
        })
      );

      rig.add(trail);
      trails.push(trail);
    });

    const beamGeometry = new THREE.BufferGeometry();
    beamGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(18 * 3), 3)
    );
    const beam = new THREE.Line(
      beamGeometry,
      new THREE.LineBasicMaterial({
        color: "#d8fefd",
        transparent: true,
        opacity: 0,
      })
    );
    rig.add(beam);

    const particleTexture = createGlowTexture([
      [0, "rgba(255,255,255,1)"],
      [0.4, "rgba(216,254,253,0.9)"],
      [1, "rgba(216,254,253,0)"],
    ]);

    const particles = Array.from({ length: 26 }, (_, index) => {
      const sprite = particleTexture
        ? new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: particleTexture,
              transparent: true,
              depthWrite: false,
              opacity: 0.94,
            })
          )
        : new THREE.Mesh(
            new THREE.CircleGeometry(0.04, 16),
            new THREE.MeshBasicMaterial({
              color: "#ffffff",
              transparent: true,
              opacity: 0.9,
            })
          );

      sprite.scale.set(0.15, 0.15, 1);
      rig.add(sprite);

      const angle = Math.random() * Math.PI * 2;
      const radius = 1.2 + Math.random() * 1.3;

      return {
        sprite,
        nodeIndex: index % NODE_CONFIGS.length,
        delay: Math.random() * 1.1,
        speed: 0.45 + Math.random() * 0.25,
        offset: Math.random(),
        gather: new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.62,
          (Math.random() - 0.5) * 0.6
        ),
      };
    });

    const projected = new THREE.Vector3();
    const controlPoint = new THREE.Vector3();
    const tempPoint = new THREE.Vector3();
    const origin = new THREE.Vector3(0, 0, 0);
    let frameId = 0;

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      const safeHeight = Math.max(clientHeight, 1);
      renderer.setSize(clientWidth, safeHeight, false);
      camera.aspect = clientWidth / safeHeight;
      camera.updateProjectionMatrix();
    };

    const onPointerMove = (event) => {
      const bounds = container.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.x = 0;
      pointer.y = 0;
    };

    const onCtaBoost = () => {
      boostUntil = performance.now() + 1000;
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    const cta = document.querySelector("[data-hero-cta]");
    cta?.addEventListener("mouseenter", onCtaBoost);
    cta?.addEventListener("focus", onCtaBoost);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const clock = new THREE.Clock();

    const renderFrame = () => {
      const elapsed = clock.getElapsedTime();
      const boost = performance.now() < boostUntil ? 1.9 : 1;

      smoothPointer.x += (pointer.x - smoothPointer.x) * 0.05;
      smoothPointer.y += (pointer.y - smoothPointer.y) * 0.05;

      camera.position.x = smoothPointer.x * 0.28;
      camera.position.y = smoothPointer.y * 0.22;
      camera.lookAt(0, 0, 0);

      const intro = Math.min(elapsed / 1.15, 1);
      const revealBase = easeOutCubic(intro);

      core.rotation.y = elapsed * 0.28;
      core.rotation.x = elapsed * 0.14;
      core.scale.setScalar(0.86 + revealBase * 0.2 + Math.sin(elapsed * 1.7) * 0.02);
      coreShell.rotation.x = -elapsed * 0.12;
      coreShell.rotation.y = elapsed * 0.2;
      if (coreGlow) {
        const glowScale = 3.15 + Math.sin(elapsed * 1.25) * 0.12;
        coreGlow.scale.set(glowScale, glowScale, 1);
      }

      rig.rotation.z = smoothPointer.x * 0.08;
      rig.rotation.x = smoothPointer.y * 0.05;
      starField.rotation.z = elapsed * 0.01;

      let activeIndex = -1;
      let minDistance = Infinity;
      const distances = [];

      NODE_CONFIGS.forEach((config, index) => {
        const reveal = easeOutCubic(
          Math.min(Math.max((elapsed - index * 0.08) / 1.05, 0), 1)
        );
        const orbitTime = Math.max(elapsed - 1.1, 0);
        const angle = config.angle + orbitTime * config.speed;
        const target = nodePositions[index];

        target.set(
          Math.cos(angle) * config.radius,
          Math.sin(angle * 1.08) * 0.36,
          Math.sin(angle) * 0.24
        );

        target.multiplyScalar(reveal);

        const group = nodeGroups[index];
        group.position.copy(target);

        let distanceToPointer = Infinity;
        if (pointer.active) {
          projected.copy(target).project(camera);
          const x = ((projected.x + 1) * 0.5) * container.clientWidth;
          const y = ((1 - projected.y) * 0.5) * container.clientHeight;
          const px = ((pointer.x + 1) * 0.5) * container.clientWidth;
          const py = ((1 - pointer.y) * 0.5) * container.clientHeight;
          distanceToPointer = Math.hypot(px - x, py - y);
        }
        distances[index] = distanceToPointer;

        if (distanceToPointer < minDistance) {
          minDistance = distanceToPointer;
          activeIndex = index;
        }

        const controlX = target.x * 0.48;
        const controlY = target.y * 0.48 + config.arc;
        controlPoint.set(controlX, controlY, 0);

        const trailPositions =
          trails[index].geometry.attributes.position.array;
        setCurvePositions(trailPositions, origin, controlPoint, target, 32);
        trails[index].geometry.attributes.position.needsUpdate = true;
      });

      if (!(pointer.active && minDistance < 130)) {
        activeIndex = -1;
      }

      NODE_CONFIGS.forEach((config, index) => {
        const reveal = easeOutCubic(
          Math.min(Math.max((elapsed - index * 0.08) / 1.05, 0), 1)
        );
        const isActive =
          pointer.active && activeIndex === index && distances[index] < 130;
        const activeBoost = isActive ? 0.16 : 0;
        const group = nodeGroups[index];

        group.scale.setScalar(0.75 + reveal * 0.35 + activeBoost);

        if (group.userData.glow) {
          group.userData.glow.material.opacity = isActive ? 0.52 : 0.28;
        }
      });

      if (activeIndex >= 0) {
        const target = nodePositions[activeIndex];
        controlPoint.set(target.x * 0.5, target.y * 0.5 + 0.22, 0);
        const beamPositions = beam.geometry.attributes.position.array;
        setCurvePositions(beamPositions, origin, controlPoint, target, 18);
        beam.geometry.attributes.position.needsUpdate = true;
        beam.material.opacity = 0.46;
      } else {
        beam.material.opacity = 0;
      }

      particles.forEach((particle) => {
        const timeAfterGather = elapsed - 0.9 - particle.delay;

        if (timeAfterGather <= 0) {
          const gatherT = easeInOutCubic(Math.min(elapsed / 0.9, 1));
          particle.sprite.position.lerpVectors(particle.gather, origin, gatherT);
          particle.sprite.material.opacity = 0.38 + gatherT * 0.42;
          return;
        }

        const node = nodePositions[particle.nodeIndex];
        const config = NODE_CONFIGS[particle.nodeIndex];
        controlPoint.set(node.x * 0.52, node.y * 0.52 + config.arc, 0);
        const progress =
          ((timeAfterGather * particle.speed * boost) + particle.offset) % 1;
        const eased = easeInOutCubic(progress);
        getBezierPoint(origin, controlPoint, node, eased, tempPoint);
        particle.sprite.position.copy(tempPoint);
        particle.sprite.material.opacity =
          0.18 + Math.sin(progress * Math.PI) * 0.82;
      });

      renderer.render(scene, camera);

      if (!prefersReducedMotion) {
        frameId = window.requestAnimationFrame(renderFrame);
      }
    };

    renderer.render(scene, camera);

    if (!prefersReducedMotion) {
      frameId = window.requestAnimationFrame(renderFrame);
    }

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      cta?.removeEventListener("mouseenter", onCtaBoost);
      cta?.removeEventListener("focus", onCtaBoost);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      resizeObserver.disconnect();

      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => {
              if (material.map) {
                material.map.dispose();
              }
              material.dispose();
            });
          } else {
            if (object.material.map) {
              object.material.map.dispose();
            }
            object.material.dispose();
          }
        }
      });

      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative h-[15.5rem] overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,rgba(9,16,30,0.94),rgba(8,20,34,0.78))] shadow-[0_30px_80px_rgba(3,8,20,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] [backdrop-filter:blur(24px)_saturate(180%)] sm:h-[18rem] lg:h-[28rem]">
      <div
        ref={containerRef}
        className="absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(127,231,220,0.09),transparent_44%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_30%,rgba(7,17,29,0.3)_100%)]" />
        <div className="hero-grid absolute inset-0 opacity-18" />

        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#bffff8]/55 via-[#7fe7dc]/40 to-[#4ea4b7]/20 blur-[6px] sm:h-28 sm:w-28 lg:h-36 lg:w-36" />
        <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8 opacity-30 sm:h-48 sm:w-48 lg:h-64 lg:w-64" />
        <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-werbens-light-cyan/10 opacity-28 sm:h-64 sm:w-64 lg:h-80 lg:w-80" />

        {NODE_CONFIGS.map((node, index) => {
          const angle = node.angle - Math.PI / 2;
          const radius = index % 2 === 0 ? 34 : 39;
          const x = 50 + Math.cos(angle) * radius;
          const y = 50 + Math.sin(angle) * radius * 0.72;

          return (
            <div
              key={node.label}
              className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[#08131f]/72 shadow-[0_0_24px_rgba(127,231,220,0.12)] backdrop-blur-md sm:h-10 sm:w-10"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span
                className="absolute inset-0 rounded-full opacity-35"
                style={{ background: node.color }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[0.58rem] font-semibold tracking-[0.12em] text-white sm:text-[0.62rem]">
                {node.label}
              </span>
            </div>
          );
        })}

        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
