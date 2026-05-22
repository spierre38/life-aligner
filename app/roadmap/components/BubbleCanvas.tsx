'use client';

/**
 * BubbleCanvas.tsx — Phase 2
 *
 * The main roadmap canvas. Renders all active goals as floating organic bubbles
 * on a dark gradient background, matching the FTUE screen's visual language so
 * the two screens feel like one continuous space.
 *
 * Layout:
 *   - Desktop (≥ 768px): bubbles absolutely positioned via computeLayout()
 *   - Mobile (< 768px): vertical scrolling card list (bubbles are too small
 *     to interact with comfortably on a phone)
 *
 * Drag: GoalBubble handles its own pointer events and calls onPositionChange
 *       when the user drops a bubble in a new spot.
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import type { Goal, RoadmapData } from '@/lib/roadmap-types';
import { computeLayout, computeCanvasHeight, BUBBLE_SIZE } from '@/lib/roadmap-layout';
import GoalBubble from './GoalBubble';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BubbleCanvasProps {
  roadmap: RoadmapData;
  onAddGoal: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onPositionChange: (goalId: string, position: { x: number; y: number }) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stringToHue(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h) % 360;
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function MobileGoalCard({ goal, onEdit, onDelete }: {
  goal: Goal;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
}) {
  const hue = goal.connectedCategories[0] ? stringToHue(goal.connectedCategories[0]) : 270;
  const totalActivities = countFlat(goal.children, 'activity');
  const doneActivities = countFlatDone(goal.children, 'activity');

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
      {/* Menu */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => onEdit(goal)}
          className="text-white/70 hover:text-white text-xs bg-white/10 px-2 py-1 rounded-lg transition"
        >Edit</button>
        <button
          onClick={() => {
            if (window.confirm(`Delete "${goal.title}"?`)) onDelete(goal.id);
          }}
          className="text-red-300 hover:text-red-200 text-xs bg-white/10 px-2 py-1 rounded-lg transition"
        >Delete</button>
      </div>
    </div>
  );
}

function countFlat(nodes: import('@/lib/roadmap-types').GoalNode[], type: string): number {
  let n = 0;
  for (const node of nodes) {
    if (node.type === type) n++;
    if (node.children) n += countFlat(node.children, type);
  }
  return n;
}
function countFlatDone(nodes: import('@/lib/roadmap-types').GoalNode[], type: string): number {
  let n = 0;
  for (const node of nodes) {
    if (node.type === type && node.completed) n++;
    if (node.children) n += countFlatDone(node.children, type);
  }
  return n;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BubbleCanvas({
  roadmap,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onPositionChange,
}: BubbleCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Measure canvas size + detect mobile on mount and resize.
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

  // Respect prefers-reduced-motion.
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

  // Positions for desktop layout.
  const positions = useMemo(
    () => computeLayout(activeGoals, canvasSize.width, canvasSize.height),
    [activeGoals, canvasSize]
  );

  const canvasHeight = useMemo(
    () => computeCanvasHeight(positions, canvasSize.height),
    [positions, canvasSize.height]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 pt-16"
    >
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
        <div className="px-4 py-8 space-y-4 pb-48">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Your Goals</h1>
            <button
              onClick={onAddGoal}
              className="bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full transition"
            >
              + Add
            </button>
          </div>
          {activeGoals.map(goal => (
            <MobileGoalCard
              key={goal.id}
              goal={goal}
              onEdit={onEditGoal}
              onDelete={onDeleteGoal}
            />
          ))}
        </div>
      )}

      {/* ── Desktop: bubble canvas ───────────────────────────────────── */}
      {activeGoals.length > 0 && !isMobile && (
        <div
          className="relative w-full overflow-hidden"
          style={{ height: canvasHeight }}
        >
          {/* "Add goal" button — fixed top-right */}
          <button
            onClick={onAddGoal}
            aria-label="Add a new goal"
            className="
              fixed top-20 right-6 z-40
              bg-gradient-to-r from-purple-600 to-indigo-600
              text-white font-semibold text-sm
              px-4 py-2.5 rounded-full
              hover:from-purple-700 hover:to-indigo-700
              transition shadow-lg shadow-purple-900/40
              flex items-center gap-2
            "
          >
            <span className="text-lg leading-none">+</span>
            Add goal
          </button>

          {/* Subtle radial glow in the center */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 40% at 50% 45%, rgba(139,92,246,0.12) 0%, transparent 70%)',
            }}
          />

          {/* Goal bubbles */}
          {activeGoals.map((goal, i) => {
            const pos = positions.get(goal.id) ?? { x: 0, y: 0 };
            return (
              <GoalBubble
                key={goal.id}
                goal={goal}
                position={pos}
                animIndex={i}
                reducedMotion={reducedMotion}
                onOpen={(id) => {
                  // Phase 3 will open the detail view; for now a no-op
                  console.log('[Phase 3] Open detail for goal:', id);
                }}
                onEdit={onEditGoal}
                onDelete={onDeleteGoal}
                onPositionChange={onPositionChange}
              />
            );
          })}

          {/* Goal count indicator — bottom-left */}
          <div className="absolute bottom-6 left-6 pointer-events-none">
            <span className="text-white/30 text-xs font-medium">
              {activeGoals.length} {activeGoals.length === 1 ? 'goal' : 'goals'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
