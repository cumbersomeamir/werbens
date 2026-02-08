"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/*
  Splash screen animation sequence:

  Phase 1 (0–1.2s)   : W logo strokes draw themselves via SVG path animation
  Phase 2 (1.2–2.0s) : Cyan accent spark pulses, content particles emit outward
  Phase 3 (2.0–3.5s) : Content icons orbit the logo, then converge back
  Phase 4 (3.5–5.0s) : "Werbens" + tagline fade in with stagger
  Phase 5 (5.0–6.0s) : Everything scales up and fades out
*/

// Small content-type icons that orbit the W
function ContentParticle({ type, delay, angle, phase }) {
  const icons = {
    post: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.365.364.028.718.174.963.42l2.342 2.342a.75.75 0 001.06 0l2.342-2.342c.245-.246.599-.392.963-.42a49.31 49.31 0 003.238-.365c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    email: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    video: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    ),
    ad: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
    image: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75z" />
      </svg>
    ),
    blog: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-full h-full">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  };

  return (
    <div
      className="absolute w-6 h-6 sm:w-7 sm:h-7 text-werbens-light-cyan/80"
      style={{
        "--angle": `${angle}deg`,
        "--delay": `${delay}s`,
        animation: `
          particleEmit 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both,
          particleOrbit 2.5s cubic-bezier(0.37, 0, 0.63, 1) ${delay + 0.4}s both,
          particleConverge 0.5s cubic-bezier(0.55, 0, 1, 0.45) ${delay + 2.8}s both
        `,
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      {icons[type]}
    </div>
  );
}

// The SVG W logo with stroke-draw animation
function WLogo({ phase }) {
  return (
    <svg
      viewBox="0 0 200 140"
      className="w-40 h-28 sm:w-56 sm:h-40 md:w-64 md:h-44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left outer stroke of W */}
      <path
        d="M 10 20 L 45 120 L 70 55"
        stroke="#316879"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="splash-stroke"
        style={{
          strokeDasharray: 220,
          strokeDashoffset: 220,
          animation: "strokeDraw 1s cubic-bezier(0.65, 0, 0.35, 1) 0.1s forwards",
        }}
      />

      {/* Center V of W */}
      <path
        d="M 70 55 L 100 120 L 130 55"
        stroke="#316879"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="splash-stroke"
        style={{
          strokeDasharray: 180,
          strokeDashoffset: 180,
          animation: "strokeDraw 0.9s cubic-bezier(0.65, 0, 0.35, 1) 0.3s forwards",
        }}
      />

      {/* Right outer stroke of W */}
      <path
        d="M 130 55 L 155 120 L 190 20"
        stroke="#316879"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="splash-stroke"
        style={{
          strokeDasharray: 220,
          strokeDashoffset: 220,
          animation: "strokeDraw 1s cubic-bezier(0.65, 0, 0.35, 1) 0.5s forwards",
        }}
      />

      {/* Cyan accent spark — the inner-left highlight */}
      <path
        d="M 35 75 L 55 120 L 70 82"
        stroke="#7fe7dc"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{
          strokeDasharray: 120,
          strokeDashoffset: 120,
          animation: "strokeDraw 0.7s cubic-bezier(0.65, 0, 0.35, 1) 0.9s forwards",
          filter: phase >= 2 ? "drop-shadow(0 0 12px rgba(127, 231, 220, 0.8))" : "none",
          transition: "filter 0.5s ease",
        }}
      />

      {/* Glow pulse on the accent */}
      {phase >= 2 && (
        <circle
          cx="55"
          cy="100"
          r="20"
          fill="none"
          stroke="#7fe7dc"
          strokeWidth="2"
          style={{
            opacity: 0,
            animation: "glowRing 0.8s ease-out 1.4s forwards",
          }}
        />
      )}
    </svg>
  );
}

export function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState(1);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const timers = [];

    // Phase 2: Spark at 1.2s
    timers.push(setTimeout(() => setPhase(2), 1200));

    // Phase 3: Orbit at 2.0s
    timers.push(setTimeout(() => setPhase(3), 2000));

    // Phase 4: Text reveal at 3.5s
    timers.push(setTimeout(() => setPhase(4), 3500));

    // Phase 5: Exit at 5.5s
    timers.push(setTimeout(() => setExiting(true), 5500));

    // Complete at 6.3s
    timers.push(setTimeout(() => {
      if (onComplete) onComplete();
    }, 6300));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Click to skip
  const handleSkip = () => {
    setExiting(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 500);
  };

  const particles = [
    { type: "post", delay: 1.3, angle: 0 },
    { type: "email", delay: 1.45, angle: 60 },
    { type: "video", delay: 1.6, angle: 120 },
    { type: "ad", delay: 1.75, angle: 180 },
    { type: "image", delay: 1.9, angle: 240 },
    { type: "blog", delay: 2.05, angle: 300 },
  ];

  return (
    <div
      className={`
        fixed inset-0 z-[100] flex flex-col items-center justify-center
        bg-werbens-midnight cursor-pointer select-none overflow-hidden
        transition-opacity duration-700 ease-out
        ${exiting ? "opacity-0" : "opacity-100"}
      `}
      onClick={handleSkip}
    >
      {/* Background ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: phase >= 2
            ? "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(127,231,220,0.08) 0%, transparent 70%)"
            : "none",
          transition: "background 1s ease",
        }}
      />

      {/* Subtle noise */}
      <div className="absolute inset-0 noise pointer-events-none" />

      {/* Particle field behind logo — subtle floating dots */}
      {phase >= 2 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-werbens-light-cyan/20"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animation: `particleDrift ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 2}s infinite alternate`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div
        className={`
          relative flex flex-col items-center
          transition-transform duration-700 ease-out
          ${exiting ? "scale-110" : "scale-100"}
        `}
      >
        {/* Logo container with orbiting particles */}
        <div className="relative">
          <WLogo phase={phase} />

          {/* Content particles */}
          {phase >= 2 && (
            <div className="absolute inset-0">
              {particles.map((p, i) => (
                <ContentParticle key={i} {...p} phase={phase} />
              ))}
            </div>
          )}
        </div>

        {/* Brand text */}
        <div className="mt-8 sm:mt-10 text-center">
          <h1
            className={`
              text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight
              transition-all duration-700 ease-out
              ${phase >= 4
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
              }
            `}
          >
            <span className="gradient-text-light">Werbens</span>
          </h1>

          <p
            className={`
              mt-3 sm:mt-4 text-base sm:text-lg md:text-xl
              text-werbens-alt-text/60 font-light tracking-wide
              transition-all duration-700 ease-out
              ${phase >= 4
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
              }
            `}
            style={{ transitionDelay: phase >= 4 ? "200ms" : "0ms" }}
          >
            Create content.{" "}
            <span className="text-werbens-light-cyan font-medium">
              Automatically.
            </span>
          </p>
        </div>

        {/* Tagline pills */}
        <div
          className={`
            mt-6 sm:mt-8 flex flex-wrap justify-center gap-2 sm:gap-3
            transition-all duration-700 ease-out
            ${phase >= 4
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
            }
          `}
          style={{ transitionDelay: phase >= 4 ? "500ms" : "0ms" }}
        >
          {["Social", "Email", "Ads", "Blog", "Video"].map((label, i) => (
            <span
              key={label}
              className="px-3 py-1 rounded-full text-xs sm:text-sm font-medium glass-dark text-werbens-light-cyan/70"
              style={{
                animationDelay: phase >= 4 ? `${600 + i * 80}ms` : "0ms",
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Skip hint */}
      <p
        className={`
          absolute bottom-8 text-xs sm:text-sm text-werbens-alt-text/30
          transition-all duration-500
          ${phase >= 4 ? "opacity-100" : "opacity-0"}
        `}
      >
        Click anywhere to skip
      </p>

    </div>
  );
}
