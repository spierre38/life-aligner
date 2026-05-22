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
  /** Called when the user taps "Ask Tim". Opens AI-guided entry. */
  onAskTim?: () => void;
}

// ─── Visual config ────────────────────────────────────────────────────────────

const BLOB_PATHS = [
  'M 52,9 C 76,6 94,24 91,50 C 88,76 68,95 44,91 C 20,87 6,67 9,43 C 12,19 31,12 52,9 Z',
  'M 50,8 C 74,5 93,22 94,46 C 95,70 78,92 54,92 C 30,92 7,76 8,52 C 9,28 29,11 50,8 Z',
  'M 46,9 C 70,6 90,26 88,52 C 86,78 64,96 40,91 C 16,86 5,65 9,41 C 13,17 26,12 46,9 Z',
  'M 56,8 C 79,9 94,30 91,54 C 88,78 69,95 45,91 C 21,87 5,68 9,44 C 13,20 35,7 56,8 Z',
];

const GRADIENTS = [
  { from: '#7C3AED', to: '#4F46E5' }, // violet → indigo
  { from: '#DB2777', to: '#9D174D' }, // pink → rose
  { from: '#0891B2', to: '#0E7490' }, // cyan → teal
  { from: '#D97706', to: '#B45309' }, // amber → yellow
  { from: '#059669', to: '#047857' }, // emerald → green
  { from: '#2563EB', to: '#1D4ED8' }, // blue → indigo
  { from: '#DC2626', to: '#B91C1C' }, // red → rose
  { from: '#7C3AED', to: '#6D28D9' }, // purple → violet
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function FTUECategoryPicker({
  categories,
  onSelectCategory,
  onAskTim,
}: FTUECategoryPickerProps) {
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
      <style>{`
        @keyframes rm-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-10px) scale(1.02); }
        }
        @keyframes rm-float-slow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-6px) scale(1.01); }
        }
        @keyframes rm-glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(251,191,36,0.3)); }
          50%       { filter: drop-shadow(0 0 18px rgba(251,191,36,0.6)); }
        }
        .bubble-float      { animation: rm-float 3.6s ease-in-out infinite; }
        .bubble-float-slow { animation: rm-float-slow 4.8s ease-in-out infinite; }
        .ask-tim-glow       { animation: rm-glow-pulse 2.8s ease-in-out infinite; }
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
            Pick a life category to set your first goal, or ask Tim for a personalized suggestion.
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
            const animDelay = `${(index * 0.45).toFixed(2)}s`;
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
                  <svg
                    viewBox="0 0 100 100"
                    className="w-36 h-36 md:w-44 md:h-44 transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id={`grad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={gradient.from} />
                        <stop offset="100%" stopColor={gradient.to} />
                      </linearGradient>
                      <filter id={`glow-${index}`}>
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <path d={blobPath} fill="rgba(0,0,0,0.25)" transform="translate(3, 5) scale(0.97)"
                      className="transition-opacity duration-300 opacity-60 group-hover:opacity-80" />
                    <path d={blobPath} fill={`url(#grad-${index})`} className="transition-all duration-300" />
                    <path d={blobPath} fill="url(#sheen)" opacity="0.12"
                      className="transition-opacity duration-300 group-hover:opacity-20" />
                    <defs>
                      <radialGradient id="sheen" cx="30%" cy="25%" r="50%">
                        <stop offset="0%" stopColor="white" />
                        <stop offset="100%" stopColor="transparent" />
                      </radialGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-white text-sm md:text-base font-bold text-center leading-tight px-4 drop-shadow-sm">
                    {category}
                  </span>
                </button>
              </div>
            );
          })}

          {/* ── "Ask Tim" AI entry bubble ─────────────────────────── */}
          {onAskTim && (
            <div
              role="listitem"
              className={`${reducedMotion ? '' : 'bubble-float-slow'} ${reducedMotion ? '' : 'ask-tim-glow'}`}
              style={{ animationDelay: `${(categories.length * 0.45).toFixed(2)}s` }}
            >
              <button
                onClick={onAskTim}
                aria-label="Ask Tim for a personalized suggestion"
                className="group relative focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950 rounded-full"
              >
                <svg
                  viewBox="0 0 100 100"
                  className="w-36 h-36 md:w-44 md:h-44 transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="grad-tim" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                  </defs>
                  <path d={BLOB_PATHS[3]} fill="rgba(0,0,0,0.2)" transform="translate(3, 5) scale(0.97)"
                    className="opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                  <path d={BLOB_PATHS[3]} fill="url(#grad-tim)" className="transition-all duration-300" />
                  <path d={BLOB_PATHS[3]} fill="url(#sheen)" opacity="0.15"
                    className="transition-opacity duration-300 group-hover:opacity-25" />
                </svg>
                <span className="absolute inset-0 flex flex-col items-center justify-center text-white drop-shadow-sm">
                  {/* Sparkle icon */}
                  <svg className="w-6 h-6 mb-1 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  </svg>
                  <span className="text-sm md:text-base font-bold">Ask Tim</span>
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ── Footer hint ─────────────────────────────────────────── */}
        <p className="text-center text-slate-500 text-sm mt-16">
          You can add goals across all categories — this just gets you started.
        </p>
      </div>
    </div>
  );
}
