'use client';

/**
 * GoalDetailView.tsx — Phase 3
 *
 * Full-screen overlay that shows when a user clicks a goal bubble.
 * Everything stays bubbly — the goal tree is rendered as organic blobs
 * branching outward from the central goal.
 *
 * Layout:
 *   - Central large goal blob (the "root")
 *   - "Why" branch: a small satellite off the root showing the why text
 *   - Children radiate outward as smaller blobs connected by curved SVG lines
 *   - Sub-goals can be expanded to show their own children
 *   - "Add step" button at each branch point
 *
 * Animation:
 *   - Zoom-in: the overlay scales from 0.8 → 1.0 with a fade
 *   - Nodes stagger in with a slight delay
 *
 * AI panel placeholder:
 *   - Right sidebar stub with "AI coaching coming soon" (Phase 4 fills this)
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Goal, GoalNode } from '@/lib/roadmap-types';
import NodeBubble from './NodeBubble';

// ─── Visual constants ─────────────────────────────────────────────────────────

const ROOT_SIZE = 180;
const CHILD_SIZE = 90;
const GRANDCHILD_SIZE = 70;

const ROOT_BLOB = 'M 52,9 C 76,6 94,24 91,50 C 88,76 68,95 44,91 C 20,87 6,67 9,43 C 12,19 31,12 52,9 Z';
const WHY_BLOB = 'M 50,12 C 72,8 90,28 86,52 C 82,76 60,90 40,84 C 20,78 8,58 14,38 C 20,18 32,16 50,12 Z';

const SPARKLE_ICON = (
  <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

function stringToHue(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h) % 360;
}

// ─── AI Coach Panel ───────────────────────────────────────────────────────────

interface AiCoachContent {
  whyItHelps: string;
  dailyIdeas: string[];
  generatedAt: string;
  profileHash: string;
}

function AiCoachPanel({ goal }: { goal: Goal }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [content, setContent] = useState<AiCoachContent | null>(goal.aiContent ?? null);
  const [errorMsg, setErrorMsg] = useState('');
  const [cached, setCached] = useState(false);

  const fetchCoaching = useCallback(async (forceRefresh = false) => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/roadmap/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: goal.id, forceRefresh }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong.');
        setStatus('error');
        return;
      }
      setContent(data.coaching);
      setCached(data.cached === true);
      setStatus('done');
    } catch (err) {
      setErrorMsg('Network error. Check your connection.');
      setStatus('error');
    }
  }, [goal.id]);

  // Auto-fetch on mount if no cached content
  useEffect(() => {
    if (!content) {
      fetchCoaching(false);
    } else {
      setStatus('done');
    }
  }, [goal.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="hidden lg:flex w-80 flex-shrink-0 flex-col border-l border-white/5 bg-slate-950/50 backdrop-blur-sm">
      <div className="px-6 py-8 flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {SPARKLE_ICON}
            <h3 className="text-white font-bold text-sm">Tim's Coaching</h3>
          </div>
          {status === 'done' && (
            <button
              onClick={() => fetchCoaching(true)}
              aria-label="Refresh coaching"
              className="text-white/30 hover:text-white/60 text-xs font-medium transition flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          )}
        </div>

        {/* Loading state */}
        {status === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center mb-4 animate-pulse">
              {SPARKLE_ICON}
            </div>
            <p className="text-white/60 text-xs">Tim is reading your profile...</p>
            <div className="mt-3 flex gap-1">
              <span className="w-1.5 h-1.5 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="w-1.5 h-1.5 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-1.5 h-1.5 bg-amber-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-400/20 flex items-center justify-center mb-4">
              <span className="text-red-400 text-lg">!</span>
            </div>
            <p className="text-white/60 text-xs mb-3">{errorMsg}</p>
            <button
              onClick={() => fetchCoaching(false)}
              className="text-amber-400 text-xs font-semibold hover:text-amber-300 transition"
            >
              Try again
            </button>
          </div>
        )}

        {/* Idle (no content yet, initial load not triggered) */}
        {status === 'idle' && !content && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <button
              onClick={() => fetchCoaching(false)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:from-amber-600 hover:to-amber-700 transition shadow-lg"
            >
              Ask Tim for coaching
            </button>
          </div>
        )}

        {/* Content */}
        {status === 'done' && content && (
          <div className="space-y-5">
            {/* Why it helps */}
            <div>
              <p className="text-amber-300/60 text-[10px] font-bold uppercase tracking-wider mb-2">Why this goal matters for you</p>
              <p className="text-white/80 text-sm leading-relaxed">{content.whyItHelps}</p>
            </div>

            {/* Daily ideas */}
            {content.dailyIdeas.length > 0 && (
              <div>
                <p className="text-amber-300/60 text-[10px] font-bold uppercase tracking-wider mb-2">Ideas for today</p>
                <ul className="space-y-2">
                  {content.dailyIdeas.map((idea, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-400/50 rounded-full mt-1.5 flex-shrink-0" />
                      <span className="text-white/70 text-sm leading-relaxed">{idea}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timestamp & cache indicator */}
            <div className="pt-2 border-t border-white/5">
              <p className="text-white/20 text-[10px]">
                {cached ? 'Cached result' : 'Fresh result'} · {new Date(content.generatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Connected values/interests — always visible */}
        {(goal.connectedValues.length > 0 || goal.connectedInterests.length > 0) && (
          <div className="border-t border-white/5 pt-4 mt-auto">
            {goal.connectedValues.length > 0 && (
              <div className="mb-3">
                <p className="text-blue-300/50 text-[10px] font-bold uppercase tracking-wider mb-1">Connected Values</p>
                <div className="flex flex-wrap gap-1">
                  {goal.connectedValues.map(v => (
                    <span key={v} className="bg-blue-500/15 text-blue-300/70 text-[10px] font-medium px-2 py-0.5 rounded-full">{v}</span>
                  ))}
                </div>
              </div>
            )}
            {goal.connectedInterests.length > 0 && (
              <div>
                <p className="text-rose-300/50 text-[10px] font-bold uppercase tracking-wider mb-1">Connected Interests</p>
                <div className="flex flex-wrap gap-1">
                  {goal.connectedInterests.map(v => (
                    <span key={v} className="bg-rose-500/15 text-rose-300/70 text-[10px] font-medium px-2 py-0.5 rounded-full">{v}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



// ─── Types ────────────────────────────────────────────────────────────────────

interface GoalDetailViewProps {
  goal: Goal;
  reducedMotion: boolean;
  onClose: () => void;
  onToggleComplete: (goalId: string, nodeId: string, completed: boolean) => void;
  onToggleIncludeToday: (goalId: string, nodeId: string, includeToday: boolean) => void;
  onDeleteNode: (goalId: string, nodeId: string) => void;
  onAddNode: (goalId: string, parentNodeId: string | null) => void;
  onEditGoal: (goal: Goal) => void;
}

// ─── Branch line SVG ──────────────────────────────────────────────────────────

function BranchLine({
  x1, y1, x2, y2,
}: { x1: number; y1: number; x2: number; y2: number }) {
  // Curved bezier line from parent to child
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const cpX = midX;
  const cpY1 = y1 + (y2 - y1) * 0.3;
  const cpY2 = y1 + (y2 - y1) * 0.7;

  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="rgba(255,255,255,0.12)"
      strokeWidth="2"
      strokeDasharray="6 4"
      className="transition-all duration-300"
    />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GoalDetailView({
  goal,
  reducedMotion,
  onClose,
  onToggleComplete,
  onToggleIncludeToday,
  onDeleteNode,
  onAddNode,
  onEditGoal,
}: GoalDetailViewProps) {
  const [mounted, setMounted] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  // Category hue for root blob
  const hue = goal.connectedCategories[0] ? stringToHue(goal.connectedCategories[0]) : 270;
  const rootGrad = {
    from: `hsl(${hue}, 65%, 52%)`,
    to: `hsl(${(hue + 28) % 360}, 75%, 38%)`,
  };

  // Compute child positions in a radial layout around the center
  const children = goal.children;
  const childCount = children.length;

  // Center of the tree area
  const centerX = 400;
  const centerY = 340;
  const childRadius = 200;

  // Start angle from top, distribute evenly
  const childPositions = useMemo(() => {
    if (childCount === 0) return [];
    const startAngle = -Math.PI / 2; // top
    const spread = Math.min(Math.PI * 1.5, (childCount - 1) * 0.6 + 0.8);
    const baseAngle = childCount === 1 ? startAngle : startAngle - spread / 2;
    const step = childCount === 1 ? 0 : spread / (childCount - 1);

    return children.map((_, i) => {
      const angle = baseAngle + i * step;
      return {
        x: centerX + Math.cos(angle) * childRadius,
        y: centerY + Math.sin(angle) * childRadius,
        angle,
      };
    });
  }, [childCount, children, centerX, centerY]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 overflow-auto transition-all duration-500 ${
        mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      {/* Float keyframes */}
      <style>{`
        @keyframes detail-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        .detail-float { animation: detail-float 4s ease-in-out infinite; }
      `}</style>

      {/* ── Top bar ────────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white/70 hover:text-white transition text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to canvas
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onAddNode(goal.id, null)}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition"
          >
            + Add step
          </button>
          <button
            onClick={() => onEditGoal(goal)}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition"
          >
            Edit goal
          </button>
        </div>
      </div>

      <div className="flex min-h-screen pt-16">
        {/* ── Tree area (left) ────────────────────────────────────── */}
        <div className="flex-1 relative overflow-auto" style={{ minHeight: '100vh' }}>
          {/* SVG connector lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {/* Root → children lines */}
            {childPositions.map((pos, i) => (
              <BranchLine
                key={`line-${i}`}
                x1={centerX}
                y1={centerY}
                x2={pos.x}
                y2={pos.y}
              />
            ))}

            {/* Children → grandchildren lines */}
            {children.map((child, i) => {
              if (!expandedNodes.has(child.id) || !child.children?.length) return null;
              const parentPos = childPositions[i];
              if (!parentPos) return null;

              const gcRadius = 120;
              const gcCount = child.children.length;
              const gcStartAngle = parentPos.angle - 0.4;
              const gcStep = gcCount === 1 ? 0 : 0.8 / (gcCount - 1);

              return child.children.map((_, gi) => {
                const gcAngle = gcStartAngle + gi * gcStep;
                const gcX = parentPos.x + Math.cos(gcAngle) * gcRadius;
                const gcY = parentPos.y + Math.sin(gcAngle) * gcRadius;
                return (
                  <BranchLine
                    key={`gc-line-${child.id}-${gi}`}
                    x1={parentPos.x}
                    y1={parentPos.y}
                    x2={gcX}
                    y2={gcY}
                  />
                );
              });
            })}

            {/* Root → why line */}
            {goal.why && (
              <BranchLine
                x1={centerX}
                y1={centerY}
                x2={centerX - 160}
                y2={centerY + 140}
              />
            )}
          </svg>

          {/* ── Root goal bubble ────────────────────────────────────── */}
          <div
            className={`absolute ${reducedMotion ? '' : 'detail-float'}`}
            style={{
              left: centerX - ROOT_SIZE / 2,
              top: centerY - ROOT_SIZE / 2,
              width: ROOT_SIZE,
              height: ROOT_SIZE,
            }}
          >
            <svg viewBox="0 0 100 100" width={ROOT_SIZE} height={ROOT_SIZE} aria-hidden>
              <defs>
                <linearGradient id="root-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={rootGrad.from} />
                  <stop offset="100%" stopColor={rootGrad.to} />
                </linearGradient>
                <radialGradient id="root-sheen" cx="30%" cy="25%" r="50%">
                  <stop offset="0%" stopColor="white" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <filter id="root-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
                  <feOffset dx="2" dy="6" result="offset" />
                  <feFlood floodColor="rgba(0,0,0,0.35)" result="color" />
                  <feComposite in="color" in2="offset" operator="in" result="shadow" />
                  <feMerge>
                    <feMergeNode in="shadow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path d={ROOT_BLOB} fill="url(#root-grad)" filter="url(#root-shadow)" />
              <path d={ROOT_BLOB} fill="url(#root-sheen)" opacity="0.12" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-5">
              <p className="text-white text-base font-bold text-center leading-tight drop-shadow-sm"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                {goal.title}
              </p>
              {goal.connectedCategories.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap justify-center">
                  {goal.connectedCategories.slice(0, 2).map(cat => (
                    <span key={cat} className="bg-white/20 text-white text-[9px] font-medium px-2 py-0.5 rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── "Why" branch ────────────────────────────────────────── */}
          {goal.why && (
            <div
              className={`absolute ${reducedMotion ? '' : 'detail-float'}`}
              style={{
                left: centerX - 160 - 35,
                top: centerY + 140 - 35,
                width: 70,
                height: 70,
                animationDelay: '0.6s',
              }}
            >
              <svg viewBox="0 0 100 100" width={70} height={70} aria-hidden>
                <defs>
                  <linearGradient id="why-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={rootGrad.from} stopOpacity="0.6" />
                    <stop offset="100%" stopColor={rootGrad.to} stopOpacity="0.4" />
                  </linearGradient>
                </defs>
                <path d={WHY_BLOB} fill="url(#why-grad)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white/80 text-[10px] font-bold">why</span>
              </div>
              {/* Why text tooltip — always visible in detail view */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-slate-800/95 text-white text-xs rounded-xl px-4 py-3 shadow-2xl border border-white/10 z-10">
                <p className="leading-relaxed italic">"{goal.why}"</p>
              </div>
            </div>
          )}

          {/* ── Child nodes ─────────────────────────────────────────── */}
          {children.map((child, i) => {
            const pos = childPositions[i];
            if (!pos) return null;

            const isExpanded = expandedNodes.has(child.id);
            const hasGrandchildren = (child.children?.length ?? 0) > 0;

            return (
              <div key={child.id}>
                {/* Child bubble */}
                <div
                  className="absolute"
                  style={{
                    left: pos.x - CHILD_SIZE / 2,
                    top: pos.y - CHILD_SIZE / 2,
                    zIndex: 10,
                  }}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      if (child.type === 'sub_goal' && hasGrandchildren) {
                        toggleExpand(child.id);
                      }
                    }}
                  >
                    <NodeBubble
                      node={child}
                      size={CHILD_SIZE}
                      blobVariant={i % 4}
                      reducedMotion={reducedMotion}
                      onToggleComplete={(nodeId, completed) => onToggleComplete(goal.id, nodeId, completed)}
                      onToggleIncludeToday={(nodeId, incl) => onToggleIncludeToday(goal.id, nodeId, incl)}
                      onDelete={(nodeId) => onDeleteNode(goal.id, nodeId)}
                    />
                  </div>

                  {/* Expand/collapse indicator for sub-goals with children */}
                  {child.type === 'sub_goal' && hasGrandchildren && (
                    <button
                      onClick={() => toggleExpand(child.id)}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition text-white text-[10px]"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? '−' : '+'}
                    </button>
                  )}

                  {/* "Add step" under each sub-goal */}
                  {child.type === 'sub_goal' && (
                    <button
                      onClick={() => onAddNode(goal.id, child.id)}
                      className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-white/30 hover:text-white/60 text-[10px] font-medium transition whitespace-nowrap"
                    >
                      + add step
                    </button>
                  )}
                </div>

                {/* Grandchildren (if expanded) */}
                {isExpanded && child.children && child.children.map((gc, gi) => {
                  const gcRadius = 120;
                  const gcCount = child.children!.length;
                  const gcStartAngle = pos.angle - 0.4;
                  const gcStep = gcCount === 1 ? 0 : 0.8 / (gcCount - 1);
                  const gcAngle = gcStartAngle + gi * gcStep;
                  const gcX = pos.x + Math.cos(gcAngle) * gcRadius;
                  const gcY = pos.y + Math.sin(gcAngle) * gcRadius;

                  return (
                    <div
                      key={gc.id}
                      className="absolute"
                      style={{
                        left: gcX - GRANDCHILD_SIZE / 2,
                        top: gcY - GRANDCHILD_SIZE / 2,
                        zIndex: 10,
                      }}
                    >
                      <NodeBubble
                        node={gc}
                        size={GRANDCHILD_SIZE}
                        blobVariant={(i + gi) % 4}
                        reducedMotion={reducedMotion}
                        onToggleComplete={(nodeId, completed) => onToggleComplete(goal.id, nodeId, completed)}
                        onToggleIncludeToday={(nodeId, incl) => onToggleIncludeToday(goal.id, nodeId, incl)}
                        onDelete={(nodeId) => onDeleteNode(goal.id, nodeId)}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Empty state for goals with no children */}
          {children.length === 0 && (
            <div
              className="absolute text-center"
              style={{ left: centerX - 100, top: centerY + ROOT_SIZE / 2 + 30, width: 200 }}
            >
              <p className="text-white/40 text-sm mb-3">No steps yet</p>
              <button
                onClick={() => onAddNode(goal.id, null)}
                className="bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full transition"
              >
                + Add your first step
              </button>
            </div>
          )}
        </div>

        {/* ── AI Coaching sidebar ─────────────────────────────────── */}
        <AiCoachPanel goal={goal} />
      </div>
    </div>
  );
}
