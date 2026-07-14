'use client';

/**
 * SpaceLaunchAnimation.tsx
 *
 * Cinematic "Launch to Space" moment — plays exactly once when a user
 * completes their LifeFrame for the first time.
 *
 * Phases:
 *  0.0s  – Screen darkens, stars scatter in
 *  0.8s  – Rocket appears and rises
 *  2.4s  – Rocket becomes center star, constellation draws in
 *  4.0s  – Text reveals: "The stars are aligned."
 *  5.6s  – Fade out begins → onComplete() at 7.0s
 */

import { useEffect, useState } from 'react';

interface SpaceLaunchAnimationProps {
  categories: string[];
  onComplete: () => void;
}

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: seededRand(i * 2.1) * 100,
  y: seededRand(i * 3.7) * 100,
  size: seededRand(i * 5.3) * 2.2 + 0.5,
  delay: seededRand(i * 7.9) * 1.0,
  twinkle: seededRand(i * 11.3) * 3 + 2,
}));

export default function SpaceLaunchAnimation({ categories, onComplete }: SpaceLaunchAnimationProps) {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2400);
    const t3 = setTimeout(() => setPhase(3), 4000);
    const t4 = setTimeout(() => setPhase(4), 5600);
    const t5 = setTimeout(() => onComplete(), 7000);
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, [onComplete]);

  const cx = 50;
  const cy = 38;
  const r = categories.length > 0 ? Math.min(26, 200 / categories.length) : 26;
  const cats = categories.slice(0, 8);
  const nodes = cats.map((cat, i, arr) => {
    const angle = (i / arr.length) * Math.PI * 2 - Math.PI / 2;
    return { cat, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });

  return (
    <div
      className="fixed inset-0 z-[200] overflow-hidden"
      style={{
        background: '#00000a',
        opacity: phase === 4 ? 0 : 1,
        transition: phase === 4 ? 'opacity 1.4s ease-out' : 'none',
      }}
    >
      {/* ── Starfield ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden ref={undefined}>
        <defs>
          <radialGradient id="nebula-g" cx="50%" cy="38%" r="40%">
            <stop offset="0%" stopColor="rgba(120,80,255,0.35)" />
            <stop offset="60%" stopColor="rgba(40,20,120,0.12)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Nebula bloom */}
        <ellipse
          cx="50%" cy="38%" rx="38%" ry="24%"
          fill="url(#nebula-g)"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transition: 'opacity 1.8s ease',
          }}
        />

        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={`${s.x}%`}
            cy={`${s.y}%`}
            r={s.size}
            fill="white"
            style={{
              opacity: 0,
              animation: `star-appear 0.5s ease-out ${s.delay}s both, twinkle ${s.twinkle}s ease-in-out ${s.delay + 0.5}s infinite`,
            }}
          />
        ))}

        {/* Constellation lines */}
        {phase >= 2 && nodes.map((node, i) => (
          <line
            key={`cl-${i}`}
            x1={`${cx}%`} y1={`${cy}%`}
            x2={`${node.x}%`} y2={`${node.y}%`}
            stroke="rgba(167,139,250,0.55)"
            strokeWidth="0.6"
            strokeDasharray="600"
            strokeDashoffset="0"
            style={{ animation: `constellation-draw 1s ease-out ${i * 0.14}s both` }}
          />
        ))}

        {/* Node dots */}
        {phase >= 2 && nodes.map((node, i) => (
          <circle
            key={`cn-${i}`}
            cx={`${node.x}%`} cy={`${node.y}%`}
            r="3"
            fill="rgba(167,139,250,0.95)"
            style={{
              filter: 'drop-shadow(0 0 5px rgba(167,139,250,0.9))',
              transformOrigin: `${node.x}% ${node.y}%`,
              animation: `constellation-node 0.55s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.14 + 0.35}s both`,
            }}
          />
        ))}

        {/* Center star */}
        {phase >= 2 && (
          <circle
            cx={`${cx}%`} cy={`${cy}%`}
            r="6"
            fill="white"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.95)) drop-shadow(0 0 24px rgba(167,139,250,0.7))',
              transformOrigin: `${cx}% ${cy}%`,
              animation: 'constellation-node 0.7s cubic-bezier(0.34,1.56,0.64,1) both',
            }}
          />
        )}
      </svg>

      {/* ── Category labels ── */}
      {phase >= 2 && (
        <div className="absolute inset-0 pointer-events-none">
          {nodes.map((node, i) => (
            <div
              key={`lbl-${i}`}
              className="absolute"
              style={{
                left: `${node.x}%`,
                top: `${node.y < cy ? node.y - 5 : node.y + 5}%`,
                transform: 'translate(-50%, -50%)',
                animation: `space-text-rise 0.7s ease-out ${i * 0.14 + 0.5}s both`,
                opacity: 0,
              }}
            >
              <span
                className="text-[9px] sm:text-[11px] font-bold tracking-widest uppercase whitespace-nowrap"
                style={{ color: 'rgba(200,180,255,0.9)', textShadow: '0 0 8px rgba(167,139,250,0.6)' }}
              >
                {node.cat}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Rocket ── */}
      {phase === 1 && (
        <div
          className="absolute"
          style={{
            left: '50%',
            bottom: '8%',
            transform: 'translateX(-50%)',
            animation: 'rocket-rise 1.8s cubic-bezier(0.25,0.46,0.45,0.94) both',
          }}
        >
          <svg width="44" height="76" viewBox="0 0 44 76" fill="none">
            {/* Exhaust */}
            <ellipse cx="22" cy="66" rx="7" ry="12" stroke="rgba(251,146,60,0.8)" strokeWidth="2"
              style={{ animation: 'exhaust-pulse 0.28s ease-in-out infinite', transformOrigin: '22px 66px' }} />
            <ellipse cx="22" cy="62" rx="4" ry="7" fill="rgba(251,191,36,0.55)"
              style={{ animation: 'exhaust-pulse 0.28s ease-in-out 0.1s infinite', transformOrigin: '22px 62px' }} />
            {/* Body */}
            <rect x="13" y="28" width="18" height="28" rx="4" fill="rgba(210,210,230,0.95)" />
            {/* Window */}
            <circle cx="22" cy="40" r="5" fill="rgba(100,160,255,0.75)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
            {/* Nose */}
            <path d="M13 28 L22 6 L31 28 Z" fill="rgba(235,235,255,0.98)" />
            {/* Fins */}
            <path d="M13 52 L6 62 L13 57 Z" fill="rgba(180,180,205,0.85)" />
            <path d="M31 52 L38 62 L31 57 Z" fill="rgba(180,180,205,0.85)" />
          </svg>
        </div>
      )}

      {/* ── Tagline ── */}
      {phase >= 3 && (
        <div
          className="absolute inset-x-0 bottom-20 flex flex-col items-center pointer-events-none px-6"
          style={{ animation: 'space-text-rise 1s ease-out both' }}
        >
          <p
            className="text-xs font-bold tracking-[0.22em] uppercase mb-3"
            style={{ color: 'rgba(167,139,250,0.85)' }}
          >
            Your LifeFrame is set
          </p>
          <h2
            className="text-3xl sm:text-4xl font-light text-center"
            style={{ color: 'white', letterSpacing: '-0.02em', textShadow: '0 0 40px rgba(167,139,250,0.5)' }}
          >
            The stars are aligned.
          </h2>
        </div>
      )}

      {/* Bottom radial glow (phase 0) */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '50%', height: '100px',
          background: 'radial-gradient(ellipse at bottom, rgba(167,139,250,0.25) 0%, transparent 70%)',
          opacity: phase === 0 ? 1 : 0,
          transition: 'opacity 0.8s ease',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
