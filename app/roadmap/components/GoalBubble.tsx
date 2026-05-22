'use client';

/**
 * GoalBubble.tsx — Phase 2.1 (refined)
 *
 * A single organic blob bubble representing one Goal on the canvas.
 *
 * Refinements from sketches:
 *   - "Why" satellite: a small connected blob orbiting the main bubble,
 *     visible whenever goal.why is set. Click it to see the full text.
 *   - Hover card: instead of just scaling, shows a mini-index tooltip
 *     listing sub-goal count, activity count, and connected categories.
 *   - Softer float with slight lateral drift for organic feel.
 *   - Three-dot menu, drag-to-reposition preserved from Phase 2.
 */

import { useState, useRef } from 'react';
import type { Goal, GoalNode } from '@/lib/roadmap-types';
import { BUBBLE_SIZE } from '@/lib/roadmap-layout';

// ─── Visual constants ─────────────────────────────────────────────────────────

const BLOB_PATHS = [
  'M 52,9 C 76,6 94,24 91,50 C 88,76 68,95 44,91 C 20,87 6,67 9,43 C 12,19 31,12 52,9 Z',
  'M 50,8 C 74,5 93,22 94,46 C 95,70 78,92 54,92 C 30,92 7,76 8,52 C 9,28 29,11 50,8 Z',
  'M 46,9 C 70,6 90,26 88,52 C 86,78 64,96 40,91 C 16,86 5,65 9,41 C 13,17 26,12 46,9 Z',
  'M 56,8 C 79,9 94,30 91,54 C 88,78 69,95 45,91 C 21,87 5,68 9,44 C 13,20 35,7 56,8 Z',
];

// Small blob for the "why" satellite
const WHY_BLOB = 'M 50,12 C 72,8 90,28 86,52 C 82,76 60,90 40,84 C 20,78 8,58 14,38 C 20,18 32,16 50,12 Z';

function stringToHue(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h) % 360;
}

function categoryToGradient(categoryName: string): { from: string; to: string } {
  const hue = stringToHue(categoryName);
  return {
    from: `hsl(${hue}, 65%, 52%)`,
    to: `hsl(${(hue + 28) % 360}, 75%, 38%)`,
  };
}

const DEFAULT_GRADIENT = { from: '#7C3AED', to: '#4F46E5' };

// ─── Tree counting ────────────────────────────────────────────────────────────

function countNodes(nodes: GoalNode[]): { subGoals: number; activities: number; done: number } {
  let subGoals = 0, activities = 0, done = 0;
  for (const node of nodes) {
    if (node.type === 'sub_goal') subGoals++;
    if (node.type === 'activity') {
      activities++;
      if (node.completed) done++;
    }
    if (node.children) {
      const sub = countNodes(node.children);
      subGoals += sub.subGoals;
      activities += sub.activities;
      done += sub.done;
    }
  }
  return { subGoals, activities, done };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface GoalBubbleProps {
  goal: Goal;
  position: { x: number; y: number };
  animIndex: number;
  reducedMotion: boolean;
  onOpen: (goalId: string) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onPositionChange: (goalId: string, position: { x: number; y: number }) => void;
}

// ─── Satellite positions by blob variant ──────────────────────────────────────
// These offset the "why" bubble relative to the main bubble's top-left.
const WHY_OFFSETS: Record<number, { x: number; y: number }> = {
  0: { x: BUBBLE_SIZE - 20, y: -10 },     // upper-right
  1: { x: -24, y: BUBBLE_SIZE - 35 },      // lower-left
  2: { x: BUBBLE_SIZE - 15, y: BUBBLE_SIZE - 30 }, // lower-right
  3: { x: -20, y: -5 },                     // upper-left
};

const WHY_SIZE = 56;

// ─── Component ────────────────────────────────────────────────────────────────

export default function GoalBubble({
  goal,
  position,
  animIndex,
  reducedMotion,
  onOpen,
  onEdit,
  onDelete,
  onPositionChange,
}: GoalBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showWhyTooltip, setShowWhyTooltip] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [localPos, setLocalPos] = useState(position);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  const blobPath = BLOB_PATHS[goal.blobVariant ?? 0];
  const grad = goal.connectedCategories[0]
    ? categoryToGradient(goal.connectedCategories[0])
    : DEFAULT_GRADIENT;

  const { subGoals, activities, done } = countNodes(goal.children);

  const gradId = `grad-${goal.id.slice(0, 8)}`;
  const shadowId = `shadow-${goal.id.slice(0, 8)}`;
  const whyGradId = `wgrad-${goal.id.slice(0, 8)}`;

  // Float animation
  const animDelay = reducedMotion ? '0s' : `${(animIndex * 0.4).toFixed(2)}s`;
  const animClass = reducedMotion
    ? ''
    : animIndex % 3 === 0 ? 'gb-drift' : animIndex % 3 === 1 ? 'gb-float' : 'gb-float-slow';

  const hasWhy = Boolean(goal.why?.trim());
  const whyOffset = WHY_OFFSETS[goal.blobVariant ?? 0] ?? WHY_OFFSETS[0];

  // ── Drag handlers ─────────────────────────────────────────────────────────

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('button')) return;
    if ((e.target as Element).closest('[data-satellite]')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOffset.current = { x: e.clientX - localPos.x, y: e.clientY - localPos.y };
    hasDragged.current = false;
    setIsDragging(true);
    setShowMenu(false);
    setShowWhyTooltip(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    hasDragged.current = true;
    setLocalPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (hasDragged.current) {
      onPositionChange(goal.id, localPos);
    } else {
      onOpen(goal.id);
    }
  };

  // Total container size needs to be larger than BUBBLE_SIZE to accommodate satellites
  const containerPad = 40;
  const containerSize = BUBBLE_SIZE + containerPad * 2;

  return (
    <>
      <style>{`
        @keyframes gb-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-9px); }
        }
        @keyframes gb-float-slow {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes gb-drift {
          0%, 100% { transform: translate(0px, 0px); }
          33%      { transform: translate(4px, -7px); }
          66%      { transform: translate(-3px, -4px); }
        }
        @keyframes gb-why-bob {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-3px) scale(1.04); }
        }
        .gb-float      { animation: gb-float 3.8s ease-in-out infinite; }
        .gb-float-slow { animation: gb-float-slow 5.1s ease-in-out infinite; }
        .gb-drift      { animation: gb-drift 6s ease-in-out infinite; }
        .gb-why-bob    { animation: gb-why-bob 2.6s ease-in-out infinite; }
      `}</style>

      <div
        role="button"
        aria-label={`Goal: ${goal.title}. Click to open.`}
        tabIndex={0}
        className={`absolute select-none ${animClass} ${isDragging ? 'cursor-grabbing z-30' : 'cursor-grab z-10 hover:z-20'}`}
        style={{
          left: localPos.x - containerPad,
          top: localPos.y - containerPad,
          width: containerSize,
          height: containerSize,
          animationDelay: animDelay,
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setShowMenu(false); setShowWhyTooltip(false); }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onOpen(goal.id); }}
      >
        {/* ── Main SVG blob ────────────────────────────────────────── */}
        <svg
          viewBox="0 0 100 100"
          width={BUBBLE_SIZE}
          height={BUBBLE_SIZE}
          className={`transition-transform duration-300 ${isHovered && !isDragging ? 'scale-110' : 'scale-100'}`}
          style={{
            position: 'absolute',
            left: containerPad,
            top: containerPad,
            filter: isDragging ? 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))' : undefined,
          }}
          aria-hidden
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={grad.from} />
              <stop offset="100%" stopColor={grad.to} />
            </linearGradient>
            <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
              <feOffset dx="2" dy="5" result="offset" />
              <feFlood floodColor="rgba(0,0,0,0.35)" result="color" />
              <feComposite in="color" in2="offset" operator="in" result="shadow" />
              <feMerge>
                <feMergeNode in="shadow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id={`sheen-${goal.id.slice(0,8)}`} cx="30%" cy="25%" r="50%">
              <stop offset="0%" stopColor="white" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <path d={blobPath} fill={`url(#${gradId})`} filter={`url(#${shadowId})`} />
          <path d={blobPath} fill={`url(#sheen-${goal.id.slice(0,8)})`}
            opacity={isHovered ? 0.2 : 0.1} className="transition-opacity duration-200" />
        </svg>

        {/* ── Text overlay ──────────────────────────────────────────── */}
        <div
          className="absolute flex flex-col items-center justify-center pointer-events-none"
          style={{
            left: containerPad,
            top: containerPad,
            width: BUBBLE_SIZE,
            height: BUBBLE_SIZE,
          }}
        >
          <p
            className="text-white text-sm font-bold text-center leading-tight drop-shadow-sm px-4"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
          >
            {goal.title}
          </p>
          {activities > 0 && (
            <p className="text-white/70 text-[10px] font-medium mt-1"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              {done}/{activities} done
            </p>
          )}
        </div>

        {/* ── "Why" satellite blob ──────────────────────────────────── */}
        {hasWhy && (
          <div
            data-satellite="why"
            className={`absolute pointer-events-auto ${reducedMotion ? '' : 'gb-why-bob'}`}
            style={{
              left: containerPad + whyOffset.x,
              top: containerPad + whyOffset.y,
              width: WHY_SIZE,
              height: WHY_SIZE,
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setShowWhyTooltip(v => !v); }}
              aria-label={`Why: ${goal.why}`}
              className="group/why w-full h-full relative"
            >
              <svg viewBox="0 0 100 100" width={WHY_SIZE} height={WHY_SIZE} aria-hidden>
                <defs>
                  <linearGradient id={whyGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={grad.from} stopOpacity="0.7" />
                    <stop offset="100%" stopColor={grad.to} stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                <path d={WHY_BLOB} fill={`url(#${whyGradId})`}
                  className="transition-transform duration-200 group-hover/why:scale-110 origin-center" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold opacity-80">
                why
              </span>
            </button>
            {/* Why tooltip */}
            {showWhyTooltip && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 bg-slate-800 text-white text-xs rounded-xl px-4 py-3 shadow-2xl border border-white/10 z-50">
                <p className="leading-relaxed">{goal.why}</p>
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-slate-800" />
              </div>
            )}
          </div>
        )}

        {/* ── Hover mini-index card ─────────────────────────────────── */}
        {isHovered && !isDragging && !showWhyTooltip && (
          <div
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-40"
            style={{ top: containerPad + BUBBLE_SIZE + 8 }}
          >
            <div className="bg-slate-800/95 backdrop-blur-sm text-white text-xs rounded-xl px-4 py-3 shadow-2xl border border-white/10 min-w-[140px]">
              {subGoals > 0 && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>{subGoals} sub-goal{subGoals !== 1 ? 's' : ''}</span>
                </div>
              )}
              {activities > 0 && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span>{done}/{activities} activities done</span>
                </div>
              )}
              {goal.connectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {goal.connectedCategories.map(cat => (
                    <span key={cat} className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] font-medium">{cat}</span>
                  ))}
                </div>
              )}
              {subGoals === 0 && activities === 0 && goal.connectedCategories.length === 0 && (
                <span className="text-white/50">Click to add details</span>
              )}
            </div>
          </div>
        )}

        {/* ── Three-dot menu ────────────────────────────────────────── */}
        {isHovered && !isDragging && (
          <div
            className="absolute pointer-events-auto"
            style={{ right: containerPad - 2, top: containerPad + 2 }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(m => !m); }}
              aria-label="Goal options"
              className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition"
            >
              <span className="text-white text-lg leading-none select-none">⋮</span>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 w-36 bg-white rounded-xl shadow-2xl border border-gray-200 py-1 z-50">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(goal); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Edit goal
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    if (window.confirm(`Delete "${goal.title}"? This cannot be undone.`)) {
                      onDelete(goal.id);
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete goal
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
