'use client';

/**
 * NodeBubble.tsx — Phase 3
 *
 * A single sub-goal or activity blob in the goal detail tree.
 * Smaller than GoalBubble, completable via checkbox overlay.
 *
 * Design:
 *   - Organic SVG blob shape (same 4 variants, scaled down)
 *   - Sub-goals: purple-ish gradient, can have children
 *   - Activities: green-ish gradient, leaf nodes, completable checkbox
 *   - Completed nodes: desaturated + strikethrough title
 *   - "Include today" toggle on activities (the includeToday flag)
 *   - Hover: slight lift + tooltip with full title if truncated
 *   - Click: if sub_goal → expand/collapse children; if activity → toggle complete
 */

import { useState } from 'react';
import type { GoalNode } from '@/lib/roadmap-types';

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOB_PATHS = [
  'M 52,9 C 76,6 94,24 91,50 C 88,76 68,95 44,91 C 20,87 6,67 9,43 C 12,19 31,12 52,9 Z',
  'M 50,8 C 74,5 93,22 94,46 C 95,70 78,92 54,92 C 30,92 7,76 8,52 C 9,28 29,11 50,8 Z',
  'M 46,9 C 70,6 90,26 88,52 C 86,78 64,96 40,91 C 16,86 5,65 9,41 C 13,17 26,12 46,9 Z',
  'M 56,8 C 79,9 94,30 91,54 C 88,78 69,95 45,91 C 21,87 5,68 9,44 C 13,20 35,7 56,8 Z',
];

function stringToHue(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h) % 360;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface NodeBubbleProps {
  node: GoalNode;
  size: number; // px
  blobVariant: number;
  reducedMotion: boolean;
  onToggleComplete: (nodeId: string, completed: boolean) => void;
  onToggleIncludeToday?: (nodeId: string, includeToday: boolean) => void;
  onDelete: (nodeId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NodeBubble({
  node,
  size,
  blobVariant,
  reducedMotion,
  onToggleComplete,
  onToggleIncludeToday,
  onDelete,
}: NodeBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const blobPath = BLOB_PATHS[blobVariant % BLOB_PATHS.length];

  // Sub-goals: use a hue derived from the node title for variety
  // Activities: green-ish base
  const hue = node.type === 'activity' ? 145 : stringToHue(node.title);
  const sat = node.completed ? '25%' : '60%';
  const light1 = node.completed ? '45%' : '52%';
  const light2 = node.completed ? '35%' : '38%';
  const gradFrom = `hsl(${hue}, ${sat}, ${light1})`;
  const gradTo = `hsl(${(hue + 25) % 360}, ${sat}, ${light2})`;

  const gradId = `ngrad-${node.id.slice(0, 8)}`;

  return (
    <div
      className="relative select-none"
      style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowMenu(false); }}
    >
      {/* SVG blob */}
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className={`transition-transform duration-200 ${isHovered ? 'scale-110' : 'scale-100'}`}
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradFrom} />
            <stop offset="100%" stopColor={gradTo} />
          </linearGradient>
          <radialGradient id={`nsheen-${node.id.slice(0,8)}`} cx="30%" cy="25%" r="50%">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <path d={blobPath} fill="rgba(0,0,0,0.2)" transform="translate(2, 4) scale(0.97)" />
        <path d={blobPath} fill={`url(#${gradId})`} />
        <path d={blobPath} fill={`url(#nsheen-${node.id.slice(0,8)})`}
          opacity={isHovered ? 0.2 : 0.1} className="transition-opacity duration-200" />
      </svg>

      {/* Text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2">
        {/* Type icon */}
        <span className="text-[10px] mb-0.5 opacity-60">
          {node.type === 'sub_goal' ? '🎯' : '✓'}
        </span>
        <p
          className={`text-white text-[10px] font-semibold text-center leading-tight ${
            node.completed ? 'line-through opacity-50' : ''
          }`}
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
        >
          {node.title.length > 30 ? node.title.slice(0, 28) + '…' : node.title}
        </p>
      </div>

      {/* Completion checkbox overlay (activities) */}
      {node.type === 'activity' && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleComplete(node.id, !node.completed); }}
          aria-label={node.completed ? 'Mark incomplete' : 'Mark complete'}
          className={`absolute -top-1 -left-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
            node.completed
              ? 'bg-green-500 border-green-400 text-white'
              : 'bg-white/90 border-white/50 text-transparent hover:border-green-400'
          }`}
        >
          <span className="text-[10px]">✓</span>
        </button>
      )}

      {/* Include today toggle (activities) */}
      {node.type === 'activity' && onToggleIncludeToday && isHovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleIncludeToday(node.id, !node.includeToday); }}
          aria-label={node.includeToday ? 'Remove from today' : 'Include today'}
          title={node.includeToday ? 'In today\'s list' : 'Add to today\'s list'}
          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0.5 rounded-full transition font-medium ${
            node.includeToday
              ? 'bg-amber-500/80 text-white'
              : 'bg-white/20 text-white/60 hover:bg-white/30'
          }`}
        >
          {node.includeToday ? '★ today' : '☆ today'}
        </button>
      )}

      {/* Context menu */}
      {isHovered && (
        <div className="absolute -top-1 -right-1">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(m => !m); }}
            aria-label="Node options"
            className="w-5 h-5 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition text-white text-[10px]"
          >
            ⋮
          </button>
          {showMenu && (
            <div className="absolute right-0 top-6 w-28 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
              {node.type === 'sub_goal' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onToggleComplete(node.id, !node.completed);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  {node.completed ? 'Reopen' : 'Complete'}
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  if (window.confirm(`Delete "${node.title}"?`)) onDelete(node.id);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
