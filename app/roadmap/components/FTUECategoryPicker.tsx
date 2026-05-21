'use client';

/**
 * FTUECategoryPicker.tsx — Phase 1
 *
 * The "Where do you want to start?" screen shown to first-time Roadmap visitors
 * who have completed their LifeFrame but haven't added any goals yet.
 *
 * Design:
 *   - Dark canvas with floating, organic blob bubbles — one per life category.
 *   - Each bubble has a gentle floating animation (staggered so they feel alive).
 *   - Clicking a bubble calls onSelectCategory, which opens AddGoalModal.
 *   - Bubbles are <button> elements for full keyboard and screen reader support.
 *   - prefers-reduced-motion: animations removed, layout stays the same.
 */

import { useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FTUECategoryPickerProps {
  /** The user's actual life category names from their LifeFrame. */
  categories: string[];
  /** Called when the user taps a category bubble. Opens AddGoalModal. */
  onSelectCategory: (category: string) => void;
}

// ─── Visual config ────────────────────────────────────────────────────────────

/**
 * Four organic SVG blob paths (viewBox 0 0 100 100).
 * Each goal bubble picks one of these shapes based on its index.
 * Designed to feel hand-drawn and imperfect — that's intentional.
 */
const BLOB_PATHS = [
  // Blob 0 — soft and round, leans left
  'M 52,9 C 76,6 94,24 91,50 C 88,76 68,95 44,91 C 20,87 6,67 9,43 C 12,19 31,12 52,9 Z',
  // Blob 1 — wider, flatter bottom
  'M 50,8 C 74,5 93,22 94,46 C 95,70 78,92 54,92 C 30,92 7,76 8,52 C 9,28 29,11 50,8 Z',
  // Blob 2 — tall, leans right
  'M 46,9 C 70,6 90,26 88,52 C 86,78 64,96 40,91 C 16,86 5,65 9,41 C 13,17 26,12 46,9 Z',
  // Blob 3 — irregular, more interesting silhouette
  'M 56,8 C 79,9 94,30 91,54 C 88,78 69,95 45,91 C 21,87 5,68 9,44 C 13,20 35,7 56,8 Z',
];

/**
 * Color gradient pairs for bubbles.
 * Each category cycles through these so the canvas is always varied.
 */
const GRADIENTS = [
  { from: '#7C3AED', to: '#4F46E5', text: 'white' }, // violet → indigo
  { from: '#DB2777', to: '#9D174D', text: 'white' }, // pink → rose
  { from: '#0891B2', to: '#0E7490', text: 'white' }, // cyan → teal
  { from: '#D97706', to: '#B45309', text: 'white' }, // amber → yellow
  { from: '#059669', to: '#047857', text: 'white' }, // emerald → green
  { from: '#2563EB', to: '#1D4ED8', text: 'white' }, // blue → indigo
  { from: '#DC2626', to: '#B91C1C', text: 'white' }, // red → rose
  { from: '#7C3AED', to: '#6D28D9', text: 'white' }, // purple → violet
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function FTUECategoryPicker({
  categories,
  onSelectCategory,
}: FTUECategoryPickerProps) {
  /**
   * We read prefers-reduced-motion once on mount so we can conditionally
   * disable the float animations without a flash of animated content.
   */
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 pt-16">
      {/* Inject float keyframes. We do this inline so no global CSS file is needed. */}
      <style>{`
        @keyframes rm-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-10px) scale(1.02); }
        }
        @keyframes rm-float-slow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-6px) scale(1.01); }
        }
        .bubble-float {
          animation: rm-float 3.6s ease-in-out infinite;
        }
        .bubble-float-slow {
          animation: rm-float-slow 4.8s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="text-center mb-16">
          <p className="text-purple-300 text-sm font-semibold uppercase tracking-widest mb-4">
            Your Roadmap
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
            Where do you want<br className="hidden sm:block" /> to start?
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Pick a life category — we'll build your first goal from there.
          </p>
        </div>

        {/* ── Bubble grid ────────────────────────────────────────── */}
        <div
          className="flex flex-wrap justify-center gap-6 md:gap-8"
          role="list"
          aria-label="Life categories — pick one to start"
        >
          {categories.map((category, index) => {
            const blobPath = BLOB_PATHS[index % BLOB_PATHS.length];
            const gradient = GRADIENTS[index % GRADIENTS.length];

            // Stagger float animation delay so bubbles don't all move together.
            const animDelay = `${(index * 0.45).toFixed(2)}s`;
            // Alternate between two float speeds for extra organic feel.
            const animClass = reducedMotion
              ? ''
              : index % 2 === 0 ? 'bubble-float' : 'bubble-float-slow';

            return (
              <div
                key={category}
                role="listitem"
                className={animClass}
                style={{ animationDelay: animDelay }}
              >
                <button
                  onClick={() => onSelectCategory(category)}
                  aria-label={`Start with ${category}`}
                  className="group relative focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950 rounded-full"
                >
                  {/* SVG blob shape */}
                  <svg
                    viewBox="0 0 100 100"
                    className="w-36 h-36 md:w-44 md:h-44 transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient
                        id={`grad-${index}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor={gradient.from} />
                        <stop offset="100%" stopColor={gradient.to} />
                      </linearGradient>
                      {/* Subtle inner glow on hover via a filter */}
                      <filter id={`glow-${index}`}>
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Soft shadow blob (slightly larger, blurred) */}
                    <path
                      d={blobPath}
                      fill="rgba(0,0,0,0.25)"
                      transform="translate(3, 5) scale(0.97)"
                      className="transition-opacity duration-300 opacity-60 group-hover:opacity-80"
                    />

                    {/* Main coloured blob */}
                    <path
                      d={blobPath}
                      fill={`url(#grad-${index})`}
                      className="transition-all duration-300"
                    />

                    {/* Highlight sheen — subtle white overlay at top-left */}
                    <path
                      d={blobPath}
                      fill="url(#sheen)"
                      opacity="0.12"
                      className="transition-opacity duration-300 group-hover:opacity-20"
                    />

                    {/* Sheen gradient definition */}
                    <defs>
                      <radialGradient
                        id="sheen"
                        cx="30%"
                        cy="25%"
                        r="50%"
                      >
                        <stop offset="0%" stopColor="white" />
                        <stop offset="100%" stopColor="transparent" />
                      </radialGradient>
                    </defs>
                  </svg>

                  {/* Category label centred over the blob */}
                  <span
                    className="
                      absolute inset-0 flex items-center justify-center
                      text-white text-sm md:text-base font-bold
                      text-center leading-tight px-4
                      drop-shadow-sm
                    "
                  >
                    {category}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Footer hint ─────────────────────────────────────────── */}
        <p className="text-center text-slate-500 text-sm mt-16">
          You can add goals across all categories — this just gets you started.
        </p>
      </div>
    </div>
  );
}
