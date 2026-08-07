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
  onAddActivity: () => void;
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

// ─── By-Category bubble view ──────────────────────────────────────────────────

const BLOB_PATHS_MINI = [
  'M 52,9 C 76,6 94,24 91,50 C 88,76 68,95 44,91 C 20,87 6,67 9,43 C 12,19 31,12 52,9 Z',
  'M 50,8 C 74,5 93,22 94,46 C 95,70 78,92 54,92 C 30,92 7,76 8,52 C 9,28 29,11 50,8 Z',
  'M 46,9 C 70,6 90,26 88,52 C 86,78 64,96 40,91 C 16,86 5,65 9,41 C 13,17 26,12 46,9 Z',
  'M 56,8 C 79,9 94,30 91,54 C 88,78 69,95 45,91 C 21,87 5,68 9,44 C 13,20 35,7 56,8 Z',
];

function GoalMicroBubble({
  goal,
  hue,
  idx,
  activities,
  done,
  onOpen,
}: {
  goal: Goal;
  hue: number;
  idx: number;
  activities: number;
  done: number;
  onOpen: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const blobPath = BLOB_PATHS_MINI[goal.blobVariant ?? (idx % 4)];
  const gradId = `cat-grad-${goal.id.slice(0, 8)}`;
  const BSIZE = 100;

  return (
    <div className="relative flex flex-col items-center" style={{ width: BSIZE + 24 }}>
      <style>{`
        @keyframes micro-float-${idx % 3} {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(${-4 - (idx % 3) * 2}px); }
        }
        .micro-float-${idx % 3} { animation: micro-float-${idx % 3} ${3.5 + (idx % 3) * 0.8}s ease-in-out infinite; }
      `}</style>
      <button
        onClick={() => onOpen(goal.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative cursor-pointer micro-float-${idx % 3} transition-transform duration-200 ${hovered ? 'scale-110' : 'scale-100'}`}
        style={{ width: BSIZE, height: BSIZE, background: 'none', border: 'none', padding: 0 }}
        aria-label={`Open goal: ${goal.title}`}
      >
        <svg viewBox="0 0 100 100" width={BSIZE} height={BSIZE} aria-hidden>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={`hsl(${hue}, 65%, ${hovered ? 60 : 52}%)`} />
              <stop offset="100%" stopColor={`hsl(${(hue + 28) % 360}, 75%, ${hovered ? 45 : 38}%)`} />
            </linearGradient>
            <radialGradient id={`sheen-c-${goal.id.slice(0,6)}`} cx="30%" cy="25%" r="50%">
              <stop offset="0%" stopColor="white" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <path d={blobPath} fill={`url(#${gradId})`} />
          <path d={blobPath} fill={`url(#sheen-c-${goal.id.slice(0,6)})`} opacity={hovered ? 0.22 : 0.1} />
        </svg>
        {/* Title overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2"
        >
          <p className="text-white text-[10px] font-bold text-center leading-tight drop-shadow-sm"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)', maxWidth: '80%' }}>
            {goal.title.length > 28 ? goal.title.slice(0, 26) + '…' : goal.title}
          </p>
          {activities > 0 && (
            <p className="text-white/70 text-[8px] font-medium mt-0.5">{done}/{activities}</p>
          )}
        </div>
      </button>
      {/* Hover tooltip */}
      {hovered && goal.connectedCategories.length > 1 && (
        <div
          className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[9px] font-semibold px-2 py-1 rounded-lg z-50 whitespace-nowrap pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.8)', color: '#fff' }}
        >
          {goal.connectedCategories.slice(1).join(' · ')}
        </div>
      )}
    </div>
  );
}

function ByCategoryView({
  roadmap,
  onOpenGoal,
}: {
  roadmap: RoadmapData;
  onOpenGoal: (id: string) => void;
}) {
  const activeGoals = roadmap.goals.filter(g => g.status === 'active');

  // Group goals by their first connected category (or 'Uncategorized')
  const grouped: Record<string, Goal[]> = {};
  for (const goal of activeGoals) {
    const cat = goal.connectedCategories[0] ?? 'Uncategorized';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(goal);
  }
  const sections = Object.entries(grouped).sort(([a], [b]) =>
    a === 'Uncategorized' ? 1 : b === 'Uncategorized' ? -1 : a.localeCompare(b)
  );

  function catHue(name: string): number {
    let h = 5381;
    for (let i = 0; i < name.length; i++) h = (h * 33) ^ name.charCodeAt(i);
    return Math.abs(h) % 360;
  }

  return (
    <div
      className="absolute inset-0 z-20 overflow-y-auto pt-20 pb-16"
      style={{ background: 'var(--mesh-canvas, var(--color-bg))' }}
    >
      {/* Radial glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(139,92,246,0.07) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-6xl mx-auto px-4">
        {/* Grid of category zones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map(([cat, goals]) => {
            const hue = cat !== 'Uncategorized' ? catHue(cat) : 240;
            let globalIdx = 0;
            return (
              <div
                key={cat}
                className="rounded-3xl overflow-hidden"
                style={{
                  background: `radial-gradient(ellipse 80% 60% at 50% 20%, hsla(${hue},60%,40%,0.12) 0%, transparent 70%), var(--color-surface)`,
                  border: `1px solid hsla(${hue},50%,50%,0.2)`,
                  boxShadow: `0 0 40px hsla(${hue},60%,40%,0.08)`,
                  minHeight: 180,
                }}
              >
                {/* Zone header */}
                <div
                  className="px-5 py-4 flex items-center justify-between"
                  style={{
                    borderBottom: `1px solid hsla(${hue},50%,50%,0.15)`,
                    background: `hsla(${hue},60%,40%,0.08)`,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: `hsl(${hue},65%,55%)`, boxShadow: `0 0 8px hsl(${hue},65%,55%)` }}
                    />
                    <h2
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: `hsl(${hue},55%,65%)` }}
                    >
                      {cat}
                    </h2>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `hsla(${hue},60%,50%,0.15)`, color: `hsl(${hue},55%,65%)` }}
                  >
                    {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
                  </span>
                </div>

                {/* Bubble cluster */}
                <div className="p-4 flex flex-wrap gap-3 justify-center">
                  {goals.map((goal, i) => {
                    const acts = roadmap.activities.filter(a => a.connectedGoalIds.includes(goal.id));
                    const done = acts.filter(a => a.completed).length;
                    const nodeIdx = globalIdx++;
                    return (
                      <GoalMicroBubble
                        key={goal.id}
                        goal={goal}
                        hue={hue}
                        idx={nodeIdx}
                        activities={acts.length}
                        done={done}
                        onOpen={onOpenGoal}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
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
              onClick={onAddActivity}
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
              <button onClick={onAddActivity}
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
          className="relative w-full overflow-hidden"
          style={{
            height: canvasHeight,
            transition: flyTo ? 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease' : 'none',
            transform: flyTo
              ? `scale(2.5) translate(${(canvasSize.width / 2 - flyTo.x) * 0.3}px, ${(canvasSize.height / 2 - flyTo.y) * 0.3}px)`
              : 'scale(1) translate(0, 0)',
            opacity: flyTo ? 0 : 1,
            transformOrigin: flyTo ? `${flyTo.x}px ${flyTo.y}px` : 'center center',
          }}
        >
          {/* Add goal FAB */}
          <div className="fixed top-20 right-6 z-40 flex gap-2 items-center">
            {/* View toggle */}
            <div
              className="flex rounded-full overflow-hidden"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <button
                onClick={() => setViewMode('canvas')}
                className="px-3 py-2 text-xs font-semibold transition-all"
                style={viewMode === 'canvas'
                  ? { background: 'rgba(255,255,255,0.12)', color: 'var(--color-text)' }
                  : { color: 'var(--color-text-dim)' }
                }
              >
                Canvas
              </button>
              <button
                onClick={() => setViewMode('byCategory')}
                className="px-3 py-2 text-xs font-semibold transition-all"
                style={viewMode === 'byCategory'
                  ? { background: 'rgba(168,85,247,0.2)', color: '#c4b5fd' }
                  : { color: 'var(--color-text-dim)' }
                }
              >
                By Category
              </button>
            </div>
            <button
              onClick={onReviewAll}
              aria-label="Review all activities and goals"
              className="bg-slate-800/80 backdrop-blur-sm border border-white/10 hover:bg-slate-800 text-white font-semibold text-sm px-4 py-2.5 rounded-full transition shadow-lg shadow-black/40 flex items-center gap-2"
            >
              Review All
            </button>
            <button
              onClick={onAddActivity}
              aria-label="Add a new activity"
              className="bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold text-sm px-4 py-2.5 rounded-full transition shadow-lg shadow-emerald-900/40 flex items-center gap-2"
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
