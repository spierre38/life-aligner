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
import VideoPlayer from '@/app/components/VideoPlayer';
import { getVideo } from '@/lib/videos';

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
  const [activeVideo, setActiveVideo] = useState<{ video: any; src: string } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className="min-h-screen pt-navbar pb-32" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0f0a1a 50%, #090d0f 100%)' }}>
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

      <div className="max-w-5xl mx-auto px-5 py-10 md:py-20">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="text-center mb-10 md:mb-16">
          <p className="text-purple-300 text-xs font-semibold uppercase tracking-widest mb-3">
            Your Roadmap
          </p>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            Where do you want<br className="hidden sm:block" /> to start?
          </h1>
          <p className="text-slate-400 text-sm md:text-lg max-w-xl mx-auto mb-5">
            Pick a life category to set your first goal.
          </p>

          {/* Coaching Video Pill */}
          <button
            onClick={() => {
              const v4 = getVideo('v4-goals');
              if (v4?.blobUrl) setActiveVideo({ video: v4, src: v4.blobUrl });
            }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-105 shadow-lg group cursor-pointer"
            style={{
              background: 'rgba(139,92,246,0.12)',
              border: '1px solid rgba(167,139,250,0.3)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs transition-transform group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
            >
              ▶
            </span>
            <span className="text-xs sm:text-sm font-medium" style={{ color: 'rgba(216,180,254,0.95)' }}>
              Watch Tim explain setting goals (3:50)
            </span>
          </button>
        </div>

        {/* ── Bubble grid ────────────────────────────────────────── */}
        <div
          className="flex flex-wrap justify-center gap-4 md:gap-8"
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
                    className="w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
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
                  <span className="absolute inset-0 flex items-center justify-center text-white text-xs sm:text-sm md:text-base font-bold text-center leading-tight px-3 drop-shadow-sm">
                    {category}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Footer hint ─────────────────────────────────────────── */}
        <p className="text-center text-slate-500 text-xs md:text-sm mt-10 md:mt-16">
          You can add goals across all categories — this just gets you started.
        </p>
      </div>

      {/* Video Player Modal */}
      {activeVideo && (
        <VideoPlayer
          video={activeVideo.video}
          src={activeVideo.src}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </div>
  );
}
