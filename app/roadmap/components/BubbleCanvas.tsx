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
  const iconColor = kind === 'value' ? 'text-blue-300/50' : 'text-rose-300/50';
  const textColor = isHighlighted ? 'text-white font-bold drop-shadow-md' : iconColor;
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
            : `radial-gradient(circle, hsla(${displayHue},50%,60%,0.15) 0%, hsla(${displayHue},50%,40%,0.05) 70%, transparent 100%)`,
          border: isHighlighted
            ? `2px solid hsla(${displayHue},100%,80%,0.9)`
            : `1px solid hsla(${displayHue},40%,70%,0.1)`,
          boxShadow: isHighlighted ? `0 0 35px hsla(${displayHue},90%,60%,0.8), inset 0 0 15px hsla(${displayHue},100%,80%,0.5)` : 'none',
        }}
      >
        <span className={`transition-all duration-300 ${textColor} text-center leading-tight px-1 ${isHighlighted ? 'text-[11px]' : 'text-[9px] font-medium'}`}>
          {label}
        </span>
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
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredGoalId, setHoveredGoalId] = useState<string | null>(null);

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

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 pt-16"
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
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/60 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            All goals completed or removed
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Your canvas is clear</h2>
          <p className="text-slate-400 mb-8 max-w-sm">
            Add a new goal to get started on your next chapter.
          </p>
          <button
            onClick={onAddGoal}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-full font-semibold hover:from-purple-700 hover:to-indigo-700 transition shadow-lg"
          >
            + Add a goal
          </button>
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
                  <p className="text-blue-300/60 text-[10px] font-bold uppercase tracking-wider mb-1">Your Values</p>
                  <div className="flex flex-wrap gap-1.5">
                    {savedValues.map(v => (
                      <span key={v} className="bg-blue-500/15 text-blue-300/70 text-[10px] font-medium px-2 py-0.5 rounded-full border border-blue-400/10">{v}</span>
                    ))}
                  </div>
                </div>
              )}
              {savedInterests.length > 0 && (
                <div>
                  <p className="text-rose-300/60 text-[10px] font-bold uppercase tracking-wider mb-1">Your Interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {savedInterests.map(v => (
                      <span key={v} className="bg-rose-500/15 text-rose-300/70 text-[10px] font-medium px-2 py-0.5 rounded-full border border-rose-400/10">{v}</span>
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
          style={{ height: canvasHeight }}
        >
          {/* Add goal FAB */}
          <div className="fixed top-20 right-6 z-40 flex gap-2">
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
                onOpen={onOpenGoal}
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
