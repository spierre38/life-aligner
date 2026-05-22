'use client';

/**
 * GoalBubble.tsx — Phase 2
 *
 * A single organic blob bubble representing one Goal on the canvas.
 *
 * Features:
 *   - Absolute positioned on the canvas at { x, y }
 *   - SVG blob shape with gradient fill derived from the first connected category
 *   - Title text centered inside the blob
 *   - Activity progress indicator: "3/7 done" (hidden when no activities)
 *   - Subtle float animation (staggered by index, same approach as FTUE)
 *   - Hover: lifts + slightly scales
 *   - Three-dot menu on hover: Edit / Delete
 *   - Drag-to-reposition with pointer events
 *   - prefers-reduced-motion: no float, still draggable
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

/**
 * Derives a consistent hue from a string using djb2 hash.
 * Same string → same hue every time, no lookup table needed.
 */
function stringToHue(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return Math.abs(h) % 360;
}

function categoryToGradient(categoryName: string): { from: string; to: string } {
  const hue = stringToHue(categoryName);
  return {
    from: `hsl(${hue}, 65%, 52%)`,
    to: `hsl(${(hue + 28) % 360}, 75%, 38%)`,
  };
}

// Default gradient when no category is connected.
const DEFAULT_GRADIENT = { from: '#7C3AED', to: '#4F46E5' };

// ─── Activity counting ────────────────────────────────────────────────────────

function countActivities(nodes: GoalNode[]): { total: number; done: number } {
  let total = 0;
  let done = 0;
  for (const node of nodes) {
    if (node.type === 'activity') {
      total++;
      if (node.completed) done++;
    }
    if (node.children) {
      const sub = countActivities(node.children);
      total += sub.total;
      done += sub.done;
    }
  }
  return { total, done };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface GoalBubbleProps {
  goal: Goal;
  position: { x: number; y: number };
  animIndex: number; // For staggering float animation
  reducedMotion: boolean;
  onOpen: (goalId: string) => void; // Phase 3 detail view
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onPositionChange: (goalId: string, position: { x: number; y: number }) => void;
}

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
  const [isDragging, setIsDragging] = useState(false);
  const [localPos, setLocalPos] = useState(position);
  const dragOffset = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  const blobPath = BLOB_PATHS[goal.blobVariant ?? 0];
  const grad = goal.connectedCategories[0]
    ? categoryToGradient(goal.connectedCategories[0])
    : DEFAULT_GRADIENT;

  const { total, done } = countActivities(goal.children);
  const hasActivities = total > 0;

  const gradId = `grad-${goal.id.slice(0, 8)}`;
  const shadowId = `shadow-${goal.id.slice(0, 8)}`;

  // Float animation delay — stagger by bubble index
  const animDelay = reducedMotion ? '0s' : `${(animIndex * 0.4).toFixed(2)}s`;
  const animClass = reducedMotion
    ? ''
    : animIndex % 2 === 0 ? 'gb-float' : 'gb-float-slow';

  // ── Drag handlers ─────────────────────────────────────────────────────────

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Don't initiate drag on button clicks
    if ((e.target as Element).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOffset.current = { x: e.clientX - localPos.x, y: e.clientY - localPos.y };
    hasDragged.current = false;
    setIsDragging(true);
    setShowMenu(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    hasDragged.current = true;
    setLocalPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    if (hasDragged.current) {
      onPositionChange(goal.id, localPos);
    } else {
      // Treat as click if barely moved
      onOpen(goal.id);
    }
  };

  const handleClick = () => {
    if (!hasDragged.current) onOpen(goal.id);
  };

  return (
    <>
      {/* Float keyframes — injected once per bubble, de-duped by browser */}
      <style>{`
        @keyframes gb-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-9px); }
        }
        @keyframes gb-float-slow {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        .gb-float      { animation: gb-float 3.8s ease-in-out infinite; }
        .gb-float-slow { animation: gb-float-slow 5.1s ease-in-out infinite; }
      `}</style>

      <div
        role="button"
        aria-label={`Goal: ${goal.title}. Click to open.`}
        tabIndex={0}
        className={`absolute select-none ${animClass} ${isDragging ? 'cursor-grabbing z-30' : 'cursor-grab z-10 hover:z-20'}`}
        style={{
          left: localPos.x,
          top: localPos.y,
          width: BUBBLE_SIZE,
          height: BUBBLE_SIZE,
          animationDelay: animDelay,
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setShowMenu(false); }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onOpen(goal.id); }}
      >
        {/* ── SVG blob ─────────────────────────────────────────────────── */}
        <svg
          viewBox="0 0 100 100"
          width={BUBBLE_SIZE}
          height={BUBBLE_SIZE}
          className={`transition-transform duration-200 ${isHovered && !isDragging ? 'scale-110' : 'scale-100'}`}
          style={{ filter: isDragging ? 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))' : undefined }}
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
          </defs>

          {/* Main blob */}
          <path
            d={blobPath}
            fill={`url(#${gradId})`}
            filter={`url(#${shadowId})`}
          />

          {/* Sheen overlay */}
          <path
            d={blobPath}
            fill="url(#sheen-blob)"
            opacity={isHovered ? 0.2 : 0.1}
            className="transition-opacity duration-200"
          />
          <defs>
            <radialGradient id="sheen-blob" cx="30%" cy="25%" r="50%">
              <stop offset="0%" stopColor="white" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
        </svg>

        {/* ── Text overlay ──────────────────────────────────────────────── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pointer-events-none">
          <p
            className="text-white text-sm font-bold text-center leading-tight drop-shadow-sm"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
          >
            {goal.title}
          </p>
          {hasActivities && (
            <p
              className="text-white/70 text-[10px] font-medium mt-1"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
            >
              {done}/{total} done
            </p>
          )}
        </div>

        {/* ── Three-dot menu ────────────────────────────────────────────── */}
        {isHovered && !isDragging && (
          <div className="absolute top-2 right-2 pointer-events-auto">
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
