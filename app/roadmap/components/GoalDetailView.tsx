'use client';

/**
 * GoalDetailView.tsx — v3: Activities as first-class entities
 *
 * Full-screen overlay when a user clicks a goal bubble.
 * Now renders activities from the flat array (filtered by connectedGoalIds)
 * instead of walking a tree of GoalNode children.
 *
 * Layout:
 *   - Central large goal blob (the "root")
 *   - "Why" satellite off the root
 *   - Activities radiate outward as smaller blobs
 *   - Sub-activities appear when an activity is expanded
 *   - "Add activity" button
 *   - AI coaching sidebar (right, lg+ only)
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Goal, Activity } from '@/lib/roadmap-types';

// ─── Visual constants ─────────────────────────────────────────────────────────

const ROOT_SIZE = 180;
const ACTIVITY_SIZE = 90;
const SUB_SIZE = 70;

const ROOT_BLOB = 'M 52,9 C 76,6 94,24 91,50 C 88,76 68,95 44,91 C 20,87 6,67 9,43 C 12,19 31,12 52,9 Z';
const WHY_BLOB = 'M 50,12 C 72,8 90,28 86,52 C 82,76 60,90 40,84 C 20,78 8,58 14,38 C 20,18 32,16 50,12 Z';
const NODE_BLOBS = [
  'M 50,8 C 75,5 92,25 90,50 C 88,75 65,92 42,88 C 19,84 5,65 10,42 C 15,19 28,11 50,8 Z',
  'M 48,6 C 74,10 95,30 88,55 C 81,80 58,95 35,86 C 12,77 3,52 12,30 C 21,8 26,3 48,6 Z',
  'M 55,7 C 78,12 93,35 87,58 C 81,81 57,93 36,84 C 15,75 5,50 15,28 C 25,6 35,3 55,7 Z',
  'M 47,10 C 70,4 92,22 91,48 C 90,74 72,94 46,90 C 20,86 4,68 8,44 C 12,20 27,16 47,10 Z',
];

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
        const errDetail = data.debug ? `\n\nDebug: ${data.debug}` : '';
        setErrorMsg((data.error || 'Something went wrong.') + errDetail);
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

        {status === 'done' && content && (
          <div className="space-y-5">
            <div>
              <p className="text-amber-300/60 text-[10px] font-bold uppercase tracking-wider mb-2">Why this goal matters for you</p>
              <p className="text-white/80 text-sm leading-relaxed">{content.whyItHelps}</p>
            </div>
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
            <div className="pt-2 border-t border-white/5">
              <p className="text-white/20 text-[10px]">
                {cached ? 'Cached result' : 'Fresh result'} · {new Date(content.generatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

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
  activities: Activity[];         // Activities connected to this goal
  allActivities: Activity[];      // All activities (to show shared count)
  reducedMotion: boolean;
  onClose: () => void;
  onToggleActivityComplete: (activityId: string, completed: boolean) => void;
  onToggleActivityIncludeToday: (activityId: string, includeToday: boolean) => void;
  onToggleSubActivityComplete: (activityId: string, subActivityId: string, completed: boolean) => void;
  onDeleteActivity: (activityId: string) => void;
  onAddActivity: (goalId: string) => void;
  onEditGoal: (goal: Goal) => void;
}

// ─── Branch line SVG ──────────────────────────────────────────────────────────

function BranchLine({
  x1, y1, x2, y2,
}: { x1: number; y1: number; x2: number; y2: number }) {
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

// ─── Activity Bubble ──────────────────────────────────────────────────────────

function ActivityBubble({
  activity,
  size,
  blobVariant,
  reducedMotion,
  goalCount,
  onToggleComplete,
  onToggleIncludeToday,
  onDelete,
}: {
  activity: Activity;
  size: number;
  blobVariant: number;
  reducedMotion: boolean;
  goalCount: number;
  onToggleComplete: (activityId: string, completed: boolean) => void;
  onToggleIncludeToday: (activityId: string, includeToday: boolean) => void;
  onDelete: (activityId: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const hue = stringToHue(activity.title);
  const blob = NODE_BLOBS[blobVariant % NODE_BLOBS.length];

  return (
    <div
      className={`relative group ${reducedMotion ? '' : 'detail-float'}`}
      style={{ width: size, height: size, animationDelay: `${blobVariant * 0.2}s` }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
        <defs>
          <linearGradient id={`act-grad-${activity.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`hsl(${hue}, 55%, ${activity.completed ? 25 : 48}%)`} />
            <stop offset="100%" stopColor={`hsl(${(hue + 25) % 360}, 65%, ${activity.completed ? 18 : 35}%)`} />
          </linearGradient>
        </defs>
        <path d={blob} fill={`url(#act-grad-${activity.id})`} opacity={activity.completed ? 0.5 : 1} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2">
        <p className={`text-white text-[10px] font-bold text-center leading-tight ${activity.completed ? 'line-through opacity-50' : ''}`}
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          {activity.title.length > 30 ? activity.title.slice(0, 28) + '…' : activity.title}
        </p>
        {goalCount > 1 && (
          <span className="bg-white/20 text-white/80 text-[8px] font-medium px-1.5 py-0.5 rounded-full mt-1">
            +{goalCount - 1} goal{goalCount > 2 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Action buttons on hover */}
      {showActions && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1 z-20">
          <button
            onClick={() => onToggleComplete(activity.id, !activity.completed)}
            className="bg-white/20 hover:bg-white/30 text-white text-[10px] px-2 py-1 rounded-full transition"
            title={activity.completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {activity.completed ? '↩' : '✓'}
          </button>
          <button
            onClick={() => onToggleIncludeToday(activity.id, !activity.includeToday)}
            className={`text-[10px] px-2 py-1 rounded-full transition ${
              activity.includeToday
                ? 'bg-emerald-500/40 text-emerald-200'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title={activity.includeToday ? 'Remove from To-Do' : 'Add to To-Do'}
          >
            📋
          </button>
          <button
            onClick={() => onDelete(activity.id)}
            className="bg-red-500/20 hover:bg-red-500/40 text-red-300 text-[10px] px-2 py-1 rounded-full transition"
            title="Delete"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Activity Bubble ──────────────────────────────────────────────────────

function SubActivityBubble({
  subActivity,
  activityId,
  size,
  blobVariant,
  onToggleComplete,
}: {
  subActivity: { id: string; title: string; completed: boolean; includeToday: boolean };
  activityId: string;
  size: number;
  blobVariant: number;
  onToggleComplete: (activityId: string, subActivityId: string, completed: boolean) => void;
}) {
  const hue = stringToHue(subActivity.title);
  const blob = NODE_BLOBS[blobVariant % NODE_BLOBS.length];

  return (
    <div className="relative cursor-pointer" style={{ width: size, height: size }}
      onClick={() => onToggleComplete(activityId, subActivity.id, !subActivity.completed)}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
        <defs>
          <linearGradient id={`sub-grad-${subActivity.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`hsl(${hue}, 45%, ${subActivity.completed ? 22 : 42}%)`} />
            <stop offset="100%" stopColor={`hsl(${(hue + 20) % 360}, 55%, ${subActivity.completed ? 15 : 30}%)`} />
          </linearGradient>
        </defs>
        <path d={blob} fill={`url(#sub-grad-${subActivity.id})`} opacity={subActivity.completed ? 0.4 : 0.8} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-2">
        <p className={`text-white text-[9px] font-medium text-center leading-tight ${subActivity.completed ? 'line-through opacity-50' : ''}`}
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          {subActivity.title.length > 25 ? subActivity.title.slice(0, 23) + '…' : subActivity.title}
        </p>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GoalDetailView({
  goal,
  activities,
  allActivities,
  reducedMotion,
  onClose,
  onToggleActivityComplete,
  onToggleActivityIncludeToday,
  onToggleSubActivityComplete,
  onDeleteActivity,
  onAddActivity,
  onEditGoal,
}: GoalDetailViewProps) {
  const [mounted, setMounted] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const toggleExpand = (activityId: string) => {
    setExpandedActivities(prev => {
      const next = new Set(prev);
      if (next.has(activityId)) next.delete(activityId);
      else next.add(activityId);
      return next;
    });
  };

  const hue = goal.connectedCategories[0] ? stringToHue(goal.connectedCategories[0]) : 270;
  const rootGrad = {
    from: `hsl(${hue}, 65%, 52%)`,
    to: `hsl(${(hue + 28) % 360}, 75%, 38%)`,
  };

  const centerX = 400;
  const centerY = 340;
  const activityRadius = 200;

  // Compute activity positions radially around center
  const activityPositions = useMemo(() => {
    const count = activities.length;
    if (count === 0) return [];
    const startAngle = -Math.PI / 2;
    const spread = Math.min(Math.PI * 1.5, (count - 1) * 0.6 + 0.8);
    const baseAngle = count === 1 ? startAngle : startAngle - spread / 2;
    const step = count === 1 ? 0 : spread / (count - 1);

    return activities.map((_, i) => {
      const angle = baseAngle + i * step;
      return {
        x: centerX + Math.cos(angle) * activityRadius,
        y: centerY + Math.sin(angle) * activityRadius,
        angle,
      };
    });
  }, [activities.length, centerX, centerY]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 overflow-auto transition-all duration-500 ${
        mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
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
            onClick={() => onAddActivity(goal.id)}
            className="bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-full transition"
          >
            + Add activity
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
            {/* Root → activity lines */}
            {activityPositions.map((pos, i) => (
              <BranchLine
                key={`line-${i}`}
                x1={centerX}
                y1={centerY}
                x2={pos.x}
                y2={pos.y}
              />
            ))}

            {/* Activity → sub-activity lines */}
            {activities.map((activity, i) => {
              if (!expandedActivities.has(activity.id) || activity.subActivities.length === 0) return null;
              const parentPos = activityPositions[i];
              if (!parentPos) return null;

              const subRadius = 120;
              const subCount = activity.subActivities.length;
              const subStartAngle = parentPos.angle - 0.4;
              const subStep = subCount === 1 ? 0 : 0.8 / (subCount - 1);

              return activity.subActivities.map((_, si) => {
                const subAngle = subStartAngle + si * subStep;
                const subX = parentPos.x + Math.cos(subAngle) * subRadius;
                const subY = parentPos.y + Math.sin(subAngle) * subRadius;
                return (
                  <BranchLine
                    key={`sub-line-${activity.id}-${si}`}
                    x1={parentPos.x}
                    y1={parentPos.y}
                    x2={subX}
                    y2={subY}
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
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-slate-800/95 text-white text-xs rounded-xl px-4 py-3 shadow-2xl border border-white/10 z-10">
                <p className="leading-relaxed italic">"{goal.why}"</p>
              </div>
            </div>
          )}

          {/* ── Activity nodes ─────────────────────────────────────── */}
          {activities.map((activity, i) => {
            const pos = activityPositions[i];
            if (!pos) return null;

            const isExpanded = expandedActivities.has(activity.id);
            const hasSubs = activity.subActivities.length > 0;
            const goalCount = activity.connectedGoalIds.length;

            return (
              <div key={activity.id}>
                {/* Activity bubble */}
                <div
                  className="absolute"
                  style={{
                    left: pos.x - ACTIVITY_SIZE / 2,
                    top: pos.y - ACTIVITY_SIZE / 2,
                    zIndex: 10,
                  }}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      if (hasSubs) toggleExpand(activity.id);
                    }}
                  >
                    <ActivityBubble
                      activity={activity}
                      size={ACTIVITY_SIZE}
                      blobVariant={i % 4}
                      reducedMotion={reducedMotion}
                      goalCount={goalCount}
                      onToggleComplete={onToggleActivityComplete}
                      onToggleIncludeToday={onToggleActivityIncludeToday}
                      onDelete={onDeleteActivity}
                    />
                  </div>

                  {hasSubs && (
                    <button
                      onClick={() => toggleExpand(activity.id)}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition text-white text-[10px]"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? '−' : `+${activity.subActivities.length}`}
                    </button>
                  )}
                </div>

                {/* Sub-activities (if expanded) */}
                {isExpanded && activity.subActivities.map((sa, si) => {
                  const subRadius = 120;
                  const subCount = activity.subActivities.length;
                  const subStartAngle = pos.angle - 0.4;
                  const subStep = subCount === 1 ? 0 : 0.8 / (subCount - 1);
                  const subAngle = subStartAngle + si * subStep;
                  const subX = pos.x + Math.cos(subAngle) * subRadius;
                  const subY = pos.y + Math.sin(subAngle) * subRadius;

                  return (
                    <div
                      key={sa.id}
                      className="absolute"
                      style={{
                        left: subX - SUB_SIZE / 2,
                        top: subY - SUB_SIZE / 2,
                        zIndex: 10,
                      }}
                    >
                      <SubActivityBubble
                        subActivity={sa}
                        activityId={activity.id}
                        size={SUB_SIZE}
                        blobVariant={(i + si) % 4}
                        onToggleComplete={onToggleSubActivityComplete}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Empty state */}
          {activities.length === 0 && (
            <div
              className="absolute text-center"
              style={{ left: centerX - 100, top: centerY + ROOT_SIZE / 2 + 30, width: 200 }}
            >
              <p className="text-white/40 text-sm mb-3">No activities yet</p>
              <button
                onClick={() => onAddActivity(goal.id)}
                className="bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-sm font-semibold px-4 py-2 rounded-full transition"
              >
                + Add your first activity
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
