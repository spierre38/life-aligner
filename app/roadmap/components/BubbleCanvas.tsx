'use client';

/**
 * BubbleCanvas.tsx — Phase 2.1 (refined)
 *
 * Refinements from sketches:
 *   - Ambient values and interests floating as tiny translucent orbs
 *     in the background, so the user sees their full LifeFrame context
 *     on the canvas at all times.
 *   - No Activities drawer (removed per Tim's note "turn off DASH maybe").
 *   - Mobile card list preserved.
 *   - Radial glow center + ambient particle orbs for depth.
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import type { Goal, RoadmapData } from '@/lib/roadmap-types';
import { computeLayout, computeCanvasHeight, BUBBLE_SIZE } from '@/lib/roadmap-layout';
import GoalBubble from './GoalBubble';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BubbleCanvasProps {
  roadmap: RoadmapData;
  savedValues: string[];
  savedInterests: string[];
  onAddGoal: () => void;
  onAddActivity: (goalId?: string | null) => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onPositionChange: (goalId: string, position: { x: number; y: number }) => void;
  onOpenGoal: (goalId: string) => void;
  onReviewAll: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stringToHue(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h) % 360;
}

// Activity counting is now done inline via roadmap.activities.filter()

// ─── Ambient orb ──────────────────────────────────────────────────────────────

function AmbientOrb({
  label,
  hue,
  size,
  x,
  y,
  delay,
  kind,
  reducedMotion,
  isHighlighted,
  highlightHue,
}: {
  label: string;
  hue: number;
  size: number;
  x: number;
  y: number;
  delay: number;
  kind: 'value' | 'interest';
  reducedMotion: boolean;
  isHighlighted?: boolean;
  highlightHue?: number;
}) {
  const displayHue = isHighlighted ? (highlightHue ?? hue) : hue;
  // Use strong, saturated colors for text so it's readable on both light and dark canvas
  const textStyle: React.CSSProperties = isHighlighted
    ? { color: '#fff', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }
    : { color: `hsl(${displayHue}, 70%, ${kind === 'value' ? '45%' : '48%'})` };

  return (
    <div
      className={`absolute pointer-events-none select-none transition-all duration-300 ${reducedMotion ? '' : 'amb-drift'} ${isHighlighted ? 'scale-125 z-20' : 'z-0'}`}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        animationDelay: `${delay.toFixed(2)}s`,
      }}
    >
      <div
        className="w-full h-full rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          background: isHighlighted
            ? `radial-gradient(circle, hsla(${displayHue},90%,60%,0.95) 0%, hsla(${displayHue},90%,40%,0.7) 70%, transparent 100%)`
            : `radial-gradient(circle, hsla(${displayHue},55%,55%,0.35) 0%, hsla(${displayHue},45%,45%,0.15) 70%, transparent 100%)`,
          border: isHighlighted
            ? `2px solid hsla(${displayHue},100%,80%,0.9)`
            : `1px solid hsla(${displayHue},50%,55%,0.25)`,
          boxShadow: isHighlighted ? `0 0 35px hsla(${displayHue},90%,60%,0.8), inset 0 0 15px hsla(${displayHue},100%,80%,0.5)` : 'none',
        }}
      >
        <span
          className={`transition-all duration-300 text-center leading-tight px-1 ${isHighlighted ? 'text-[11px]' : 'text-[9px] font-semibold'}`}
          style={textStyle}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── By-Category bubble view (FTUE-matching style) ───────────────────────────

// Same gradient palette as FTUECategoryPicker
const CAT_GRADIENTS = [
  { from: '#7C3AED', to: '#4F46E5' }, // violet → indigo
  { from: '#DB2777', to: '#9D174D' }, // pink → rose
  { from: '#0891B2', to: '#0E7490' }, // cyan → teal
  { from: '#D97706', to: '#B45309' }, // amber → yellow
  { from: '#059669', to: '#047857' }, // emerald → green
  { from: '#2563EB', to: '#1D4ED8' }, // blue → indigo
  { from: '#DC2626', to: '#B91C1C' }, // red → rose
  { from: '#7C3AED', to: '#6D28D9' }, // purple → violet
];

const FTUE_BLOB_PATHS = [
  'M 52,9 C 76,6 94,24 91,50 C 88,76 68,95 44,91 C 20,87 6,67 9,43 C 12,19 31,12 52,9 Z',
  'M 50,8 C 74,5 93,22 94,46 C 95,70 78,92 54,92 C 30,92 7,76 8,52 C 9,28 29,11 50,8 Z',
  'M 46,9 C 70,6 90,26 88,52 C 86,78 64,96 40,91 C 16,86 5,65 9,41 C 13,17 26,12 46,9 Z',
  'M 56,8 C 79,9 94,30 91,54 C 88,78 69,95 45,91 C 21,87 5,68 9,44 C 13,20 35,7 56,8 Z',
];

function ByCategoryView({
  roadmap,
  onOpenGoal,
}: {
  roadmap: RoadmapData;
  onOpenGoal: (id: string) => void;
}) {
  // ── drill-down state ──────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const activeGoals = roadmap.goals.filter(g => g.status === 'active');

  // Build the list of categories that actually have goals
  const categoriesWithGoals = (() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const goal of activeGoals) {
      const cat = goal.connectedCategories[0] ?? 'Uncategorized';
      if (!seen.has(cat)) { seen.add(cat); list.push(cat); }
    }
    return list.sort((a, b) => a === 'Uncategorized' ? 1 : b === 'Uncategorized' ? -1 : 0);
  })();

  const goalsForCategory = (cat: string) =>
    activeGoals.filter(g => (g.connectedCategories[0] ?? 'Uncategorized') === cat);

  const catIdx = (cat: string) => Math.max(categoriesWithGoals.indexOf(cat), 0);

  // ── shared styles ─────────────────────────────────────────────────────────
  const shared = (
    <style>{`
      @keyframes bycat-float {
        0%, 100% { transform: translateY(0px) scale(1); }
        50%       { transform: translateY(-10px) scale(1.02); }
      }
      @keyframes bycat-float-slow {
        0%, 100% { transform: translateY(0px) scale(1); }
        50%       { transform: translateY(-6px) scale(1.01); }
      }
      .bycat-float      { animation: bycat-float 3.6s ease-in-out infinite; }
      .bycat-float-slow { animation: bycat-float-slow 4.8s ease-in-out infinite; }
    `}</style>
  );

  // ── LEVEL 1 — All categories ──────────────────────────────────────────────
  if (!selectedCategory) {
    return (
      <div
        className="absolute inset-0 z-20 overflow-y-auto pt-navbar pb-20"
        style={{ background: 'var(--mesh-canvas, var(--color-bg))' }}
      >
        {shared}
        <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />

        <div className="relative max-w-5xl mx-auto px-5 py-10 md:py-16">
          {/* Header */}
          <div className="text-center mb-10 md:mb-14">
            <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--color-text-dim)' }}>By Category</p>
            <h1 className="text-3xl md:text-5xl font-bold mb-3" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
              Your Life Categories
            </h1>
            <p className="text-sm md:text-base" style={{ color: 'var(--color-text-muted)' }}>
              Pick a category to see its goals.
            </p>
          </div>

          {/* Category bubbles — FTUE-style grid */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8" role="list" aria-label="Life categories">
            {categoriesWithGoals.map((cat, i) => {
              const goals = goalsForCategory(cat);
              const grad = CAT_GRADIENTS[i % CAT_GRADIENTS.length];
              const blob = FTUE_BLOB_PATHS[i % 4];
              const gradId = `lvl1-grad-${i}`;
              const sheenId = `lvl1-sheen-${i}`;
              const delay = `${(i * 0.45).toFixed(2)}s`;
              const animCls = i % 2 === 0 ? 'bycat-float' : 'bycat-float-slow';
              return (
                <div key={cat} role="listitem" className={animCls} style={{ animationDelay: delay }}>
                  <button
                    onClick={() => setSelectedCategory(cat)}
                    aria-label={`View ${cat} goals`}
                    className="group relative focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400 rounded-full"
                  >
                    <svg viewBox="0 0 100 100" className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 transition-transform duration-300 group-hover:scale-110 group-active:scale-95" aria-hidden>
                      <defs>
                        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={grad.from} />
                          <stop offset="100%" stopColor={grad.to} />
                        </linearGradient>
                        <radialGradient id={sheenId} cx="30%" cy="25%" r="50%">
                          <stop offset="0%" stopColor="white" />
                          <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                      </defs>
                      <path d={blob} fill="rgba(0,0,0,0.25)" transform="translate(3,5) scale(0.97)" className="opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                      <path d={blob} fill={`url(#${gradId})`} className="transition-all duration-300" />
                      <path d={blob} fill={`url(#${sheenId})`} opacity="0.12" className="group-hover:opacity-22 transition-opacity duration-300" />
                    </svg>
                    <span className="absolute inset-0 flex flex-col items-center justify-center text-white text-center leading-tight px-3 drop-shadow-sm">
                      <span className="text-sm md:text-base font-bold">{cat}</span>
                      <span className="text-[10px] md:text-xs mt-1 opacity-70">{goals.length} {goals.length === 1 ? 'goal' : 'goals'}</span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs mt-10 md:mt-16" style={{ color: 'var(--color-text-dim)' }}>
            Click a category to explore its goals.
          </p>
        </div>
      </div>
    );
  }

  // ── LEVEL 2 — Goals within selected category ──────────────────────────────
  const ci = catIdx(selectedCategory);
  const grad = CAT_GRADIENTS[ci % CAT_GRADIENTS.length];
  const categoryGoals = goalsForCategory(selectedCategory);

  return (
    <div
      className="absolute inset-0 z-20 overflow-y-auto pt-navbar pb-20"
      style={{ background: 'var(--mesh-canvas, var(--color-bg))' }}
    >
      {shared}
      {/* Category-tinted ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: `radial-gradient(ellipse 60% 40% at 50% 30%, ${grad.from}14 0%, transparent 70%)` }}
      />

      <div className="relative max-w-5xl mx-auto px-5 py-10 md:py-16">
        {/* Breadcrumb / back nav */}
        <div className="mb-10 flex items-center gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2 text-sm font-medium transition hover:opacity-80"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Categories
          </button>
          <span style={{ color: 'var(--color-text-dim)' }}>/</span>
          <span className="text-sm font-bold" style={{ color: grad.from }}>{selectedCategory}</span>
        </div>

        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: grad.from + 'cc' }}>
            {selectedCategory}
          </p>
          <h1 className="text-3xl md:text-5xl font-bold mb-3" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
            Your Goals
          </h1>
          <p className="text-sm md:text-base" style={{ color: 'var(--color-text-muted)' }}>
            {categoryGoals.length === 0
              ? 'No goals in this category yet.'
              : 'Click a goal to see its activities and details.'}
          </p>
        </div>

        {categoryGoals.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
              <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <p className="text-sm font-medium mb-6" style={{ color: 'var(--color-text-muted)' }}>
              No goals yet in {selectedCategory}.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4 md:gap-8" role="list" aria-label={`Goals in ${selectedCategory}`}>
            {categoryGoals.map((goal, gIdx) => {
              const blob = FTUE_BLOB_PATHS[(gIdx + 1) % 4];
              const gradId = `lvl2-grad-${ci}-${gIdx}`;
              const sheenId = `lvl2-sheen-${ci}-${gIdx}`;
              const delay = `${(gIdx * 0.45).toFixed(2)}s`;
              const animCls = gIdx % 2 === 0 ? 'bycat-float' : 'bycat-float-slow';
              const acts = roadmap.activities.filter(a => a.connectedGoalIds.includes(goal.id));
              const done = acts.filter(a => a.completed).length;
              return (
                <div key={goal.id} role="listitem" className={animCls} style={{ animationDelay: delay }}>
                  <button
                    onClick={() => onOpenGoal(goal.id)}
                    aria-label={`Open goal: ${goal.title}`}
                    className="group relative focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400 rounded-full"
                  >
                    <svg viewBox="0 0 100 100" className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 transition-transform duration-300 group-hover:scale-110 group-active:scale-95" aria-hidden>
                      <defs>
                        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={grad.from} />
                          <stop offset="100%" stopColor={grad.to} />
                        </linearGradient>
                        <radialGradient id={sheenId} cx="30%" cy="25%" r="50%">
                          <stop offset="0%" stopColor="white" />
                          <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                      </defs>
                      <path d={blob} fill="rgba(0,0,0,0.25)" transform="translate(3,5) scale(0.97)" className="opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                      <path d={blob} fill={`url(#${gradId})`} className="transition-all duration-300" />
                      <path d={blob} fill={`url(#${sheenId})`} opacity="0.12" className="group-hover:opacity-22 transition-opacity duration-300" />
                    </svg>
                    <span className="absolute inset-0 flex flex-col items-center justify-center text-white text-center leading-tight px-3 drop-shadow-sm">
                      <span className="text-[11px] md:text-sm font-bold leading-snug">
                        {goal.title.length > 24 ? goal.title.slice(0, 22) + '…' : goal.title}
                      </span>
                      {acts.length > 0 && (
                        <span className="text-[9px] md:text-[10px] mt-1 opacity-70">{done}/{acts.length} activities</span>
                      )}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function MobileGoalCard({ goal, activityCount, doneCount, onEdit, onDelete }: {
  goal: Goal;
  activityCount: number;
  doneCount: number;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
}) {
  const hue = goal.connectedCategories[0] ? stringToHue(goal.connectedCategories[0]) : 270;
  const totalActivities = activityCount;
  const doneActivities = doneCount;

  return (
    <div
      className="rounded-2xl p-5 text-white relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, hsl(${hue},65%,45%), hsl(${(hue + 28) % 360},75%,32%))` }}
    >
      <h3 className="font-bold text-lg mb-1 pr-10">{goal.title}</h3>
      {goal.why && <p className="text-white/70 text-sm mb-2 line-clamp-2">{goal.why}</p>}
      <div className="flex items-center gap-3 flex-wrap">
        {goal.connectedCategories.map(cat => (
          <span key={cat} className="bg-white/20 text-white text-xs font-medium px-2.5 py-1 rounded-full">{cat}</span>
        ))}
        {totalActivities > 0 && (
          <span className="text-white/60 text-xs ml-auto">{doneActivities}/{totalActivities} done</span>
        )}
      </div>
      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={() => onEdit(goal)}
          className="text-white/70 hover:text-white text-xs bg-white/10 px-2 py-1 rounded-lg transition">Edit</button>
        <button onClick={() => { if (window.confirm(`Delete "${goal.title}"?`)) onDelete(goal.id); }}
          className="text-red-300 hover:text-red-200 text-xs bg-white/10 px-2 py-1 rounded-lg transition">Delete</button>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BubbleCanvas({
  roadmap,
  savedValues,
  savedInterests,
  onAddGoal,
  onAddActivity,
  onEditGoal,
  onDeleteGoal,
  onPositionChange,
  onOpenGoal,
  onReviewAll,
}: BubbleCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [viewMode, setViewMode] = useState<'canvas' | 'byCategory'>('canvas');
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredGoalId, setHoveredGoalId] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<{ goalId: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const update = () => {
      const w = containerRef.current?.offsetWidth ?? window.innerWidth;
      const h = window.innerHeight;
      setCanvasSize({ width: w, height: h });
      setIsMobile(window.innerWidth < 768);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const activeGoals = useMemo(
    () => roadmap.goals.filter(g => g.status === 'active'),
    [roadmap.goals]
  );

  const positions = useMemo(
    () => computeLayout(activeGoals, canvasSize.width, canvasSize.height),
    [activeGoals, canvasSize]
  );

  const canvasHeight = useMemo(
    () => computeCanvasHeight(positions, canvasSize.height),
    [positions, canvasSize.height]
  );

  // Generate ambient orb positions for values and interests.
  // These are scattered around the edges so they don't overlap goal bubbles.
  const ambientOrbs = useMemo(() => {
    const orbs: Array<{
      label: string; hue: number; size: number;
      x: number; y: number; delay: number; kind: 'value' | 'interest';
    }> = [];

    const w = canvasSize.width;
    const h = canvasHeight;

    savedValues.forEach((v, i) => {
      const hue = stringToHue(v);
      // Place along left and right edges
      const side = i % 2 === 0 ? 30 + Math.random() * 60 : w - 120 + Math.random() * 60;
      const top = 120 + (i / savedValues.length) * (h - 240) + Math.random() * 40;
      orbs.push({
        label: v,
        hue,
        size: 52 + (i % 3) * 8,
        x: side,
        y: top,
        delay: i * 0.7,
        kind: 'value',
      });
    });

    savedInterests.forEach((interest, i) => {
      const hue = stringToHue(interest);
      // Scatter in upper and lower bands
      const band = i % 2 === 0 ? 80 + Math.random() * 100 : h - 200 + Math.random() * 80;
      const left = 60 + (i / savedInterests.length) * (w - 200) + Math.random() * 40;
      orbs.push({
        label: interest,
        hue,
        size: 48 + (i % 4) * 6,
        x: left,
        y: band,
        delay: savedValues.length * 0.7 + i * 0.5,
        kind: 'interest',
      });
    });

    return orbs;
  }, [savedValues, savedInterests, canvasSize.width, canvasHeight]);

  // ── Fly-to handler: animate canvas toward clicked bubble, then open detail ──
  const handleFlyToGoal = (goalId: string) => {
    if (reducedMotion || isMobile) {
      // Skip animation on mobile or reduced-motion
      onOpenGoal(goalId);
      return;
    }
    const pos = positions.get(goalId);
    if (!pos) { onOpenGoal(goalId); return; }
    setFlyTo({ goalId, x: pos.x, y: pos.y });
    // After animation finishes, open the detail view
    setTimeout(() => {
      onOpenGoal(goalId);
      // Reset after detail view mounts
      setTimeout(() => setFlyTo(null), 100);
    }, 480);
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen pt-navbar"
      style={{ background: 'var(--mesh-canvas)' }}
    >
      {/* Ambient drift animation */}
      <style>{`
        @keyframes amb-drift {
          0%, 100% { transform: translate(0, 0); opacity: 0.7; }
          25%      { transform: translate(3px, -5px); opacity: 0.9; }
          50%      { transform: translate(-2px, -8px); opacity: 0.6; }
          75%      { transform: translate(4px, -3px); opacity: 0.8; }
        }
        .amb-drift { animation: amb-drift 12s ease-in-out infinite; }
      `}</style>

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {activeGoals.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
          <div className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full mb-6" style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            All goals completed or removed
          </div>
          <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>Your canvas is clear</h2>
          <p className="mb-8 max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
            Start your journey by adding a broad goal, or jump straight into a specific activity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => onAddActivity()}
              className="bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full transition shadow-lg flex items-center justify-center gap-2"
            >
              <span className="text-lg leading-none">+</span> Add an activity
            </button>
            <button
              onClick={onAddGoal}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-6 py-3 rounded-full hover:from-purple-700 hover:to-indigo-700 transition shadow-lg flex items-center justify-center gap-2"
            >
              <span className="text-lg leading-none">+</span> Add a goal
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile: card list ────────────────────────────────────────── */}
      {activeGoals.length > 0 && isMobile && (
        <div className="px-4 py-8 space-y-4 pb-32">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Your Goals</h1>
            <div className="flex gap-2">
              <button onClick={onReviewAll}
                className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-sm font-semibold px-3 py-2 rounded-full transition">
                Review All
              </button>
              <button onClick={() => onAddActivity()}
                className="bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-sm font-semibold px-3 py-2 rounded-full transition">
                + Activity
              </button>
              <button onClick={onAddGoal}
                className="bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-3 py-2 rounded-full transition">
                + Goal
              </button>
            </div>
          </div>

          {/* Values & Interests chips — mobile */}
          {(savedValues.length > 0 || savedInterests.length > 0) && (
            <div className="mb-6 space-y-3">
              {savedValues.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgb(96,165,250)' }}>Your Values</p>
                  <div className="flex flex-wrap gap-1.5">
                    {savedValues.map(v => (
                      <span key={v} className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: 'rgb(96,165,250)', border: '1px solid rgba(59,130,246,0.2)' }}>{v}</span>
                    ))}
                  </div>
                </div>
              )}
              {savedInterests.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgb(251,113,133)' }}>Your Interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {savedInterests.map(v => (
                      <span key={v} className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(244,63,94,0.15)', color: 'rgb(251,113,133)', border: '1px solid rgba(244,63,94,0.2)' }}>{v}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeGoals.map(goal => {
            const goalActivities = roadmap.activities.filter(a => a.connectedGoalIds.includes(goal.id));
            return (
              <MobileGoalCard
                key={goal.id}
                goal={goal}
                activityCount={goalActivities.length}
                doneCount={goalActivities.filter(a => a.completed).length}
                onEdit={onEditGoal}
                onDelete={onDeleteGoal}
              />
            );
          })}
        </div>
      )}

      {/* ── Desktop: bubble canvas ───────────────────────────────────── */}
      {activeGoals.length > 0 && !isMobile && (
        <div
          className="relative w-full"
          style={{
            height: canvasHeight,
            overflowX: 'auto',
            overflowY: 'hidden',
            transition: flyTo ? 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease' : 'none',
            transform: flyTo
              ? `scale(2.5) translate(${(canvasSize.width / 2 - flyTo.x) * 0.3}px, ${(canvasSize.height / 2 - flyTo.y) * 0.3}px)`
              : 'scale(1) translate(0, 0)',
            opacity: flyTo ? 0 : 1,
            transformOrigin: flyTo ? `${flyTo.x}px ${flyTo.y}px` : 'center center',
          }}
        >
          {/* Add goal FAB — always visible on desktop when not mobile */}
          <div className="fixed top-20 right-6 z-40 flex gap-2 items-center">
            {/* View toggle */}
            <div
              className="flex rounded-full overflow-hidden"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <button
                onClick={() => setViewMode('canvas')}
                className="px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer"
                style={viewMode === 'canvas'
                  ? { background: 'var(--color-surface-2)', color: 'var(--color-text)' }
                  : { color: 'var(--color-text-muted)' }
                }
              >
                Canvas
              </button>
              <button
                onClick={() => setViewMode('byCategory')}
                className="px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer"
                style={viewMode === 'byCategory'
                  ? { background: 'var(--color-surface-2)', color: 'var(--color-text)' }
                  : { color: 'var(--color-text-muted)' }
                }
              >
                By Category
              </button>
            </div>
            <button
              onClick={onReviewAll}
              aria-label="Review all activities and goals"
              className="backdrop-blur-sm font-semibold text-sm px-4 py-2.5 rounded-full transition shadow-lg flex items-center gap-2 cursor-pointer hover:opacity-90 active:scale-95"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              Review All
            </button>
            <button
              onClick={() => onAddActivity(hoveredGoalId)}
              aria-label="Add a new activity"
              className="bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold text-sm px-4 py-2.5 rounded-full transition shadow-lg shadow-emerald-900/40 flex items-center gap-2"
              title={hoveredGoalId ? 'Add activity to hovered goal' : 'Add activity'}
            >
              <span className="text-lg leading-none">+</span>
              Add activity
            </button>
            <button
              onClick={onAddGoal}
              aria-label="Add a new goal"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm px-4 py-2.5 rounded-full hover:from-purple-700 hover:to-indigo-700 transition shadow-lg shadow-purple-900/40 flex items-center gap-2"
            >
              <span className="text-lg leading-none">+</span>
              Add goal
            </button>
          </div>

          {/* By-Category view overlay */}
          {viewMode === 'byCategory' && (
            <ByCategoryView roadmap={roadmap} onOpenGoal={onOpenGoal} />
          )}

          {/* Radial glow center */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 40% at 50% 45%, rgba(139,92,246,0.12) 0%, transparent 70%)',
            }}
          />

          {/* Ambient value/interest orbs — decorative, behind goals */}
          <div className="absolute inset-0 pointer-events-none z-0">
            {ambientOrbs.map((orb, i) => {
              const hoveredGoal = hoveredGoalId ? activeGoals.find(g => g.id === hoveredGoalId) : null;
              const isHighlighted = hoveredGoal 
                ? (orb.kind === 'value' && hoveredGoal.connectedValues.includes(orb.label)) || 
                  (orb.kind === 'interest' && hoveredGoal.connectedInterests.includes(orb.label))
                : false;
              const highlightHue = hoveredGoal?.connectedCategories[0] 
                ? stringToHue(hoveredGoal.connectedCategories[0]) 
                : 270;

              return (
                <AmbientOrb 
                  key={`${orb.kind}-${i}`} 
                  {...orb} 
                  reducedMotion={reducedMotion}
                  isHighlighted={isHighlighted}
                  highlightHue={highlightHue}
                />
              );
            })}
          </div>

          {/* Goal bubbles */}
          {activeGoals.map((goal, i) => {
            const pos = positions.get(goal.id) ?? { x: 0, y: 0 };
            const goalActs = roadmap.activities.filter(a => a.connectedGoalIds.includes(goal.id));
            return (
              <GoalBubble
                key={goal.id}
                goal={goal}
                position={pos}
                animIndex={i}
                reducedMotion={reducedMotion}
                activityCount={goalActs.length}
                doneCount={goalActs.filter(a => a.completed).length}
                onOpen={handleFlyToGoal}
                onEdit={onEditGoal}
                onDelete={onDeleteGoal}
                onPositionChange={onPositionChange}
                onHoverStart={setHoveredGoalId}
                onHoverEnd={() => setHoveredGoalId(null)}
              />
            );
          })}

          {/* Goal count — bottom-left */}
          <div className="absolute bottom-6 left-6 pointer-events-none">
            <span className="text-white/30 text-xs font-medium">
              {activeGoals.length} {activeGoals.length === 1 ? 'goal' : 'goals'}
            </span>
          </div>

          {/* Legend — bottom-right */}
          <div className="absolute bottom-6 right-6 pointer-events-none flex gap-4">
            {savedValues.length > 0 && (
              <span className="text-blue-300/40 text-[10px] font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400/30" /> Values
              </span>
            )}
            {savedInterests.length > 0 && (
              <span className="text-rose-300/40 text-[10px] font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400/30" /> Interests
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
