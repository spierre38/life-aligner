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
import { showToast } from '@/lib/toast';
import { useTheme } from '@/app/components/ThemeProvider';

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

function AiCoachPanel({ 
  goal, 
  onCreateActivityInline 
}: { 
  goal: Goal; 
  onCreateActivityInline: (goalId: string, title: string, includeToday: boolean) => void; 
}) {
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
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
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
      const isStale = new Date(content.generatedAt).toDateString() !== new Date().toDateString();
      if (isStale) {
        fetchCoaching(true);
      } else {
        setStatus('done');
      }
    }
  }, [goal.id, content]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="hidden lg:flex w-80 flex-shrink-0 flex-col border-l border-white/5 bg-slate-950/50 backdrop-blur-sm">
      <div className="px-6 py-8 flex-1 flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {SPARKLE_ICON}
            <h3 className="text-white font-bold text-sm">Coaching</h3>
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
                    <li key={i} className="flex flex-col gap-1.5 group">
                      <div className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-400/50 rounded-full mt-1.5 flex-shrink-0" />
                        <span className="text-white/70 text-sm leading-relaxed">{idea}</span>
                      </div>
                      <div className="flex items-center gap-2 pl-3.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onCreateActivityInline(goal.id, idea, false)}
                          className="text-[10px] font-semibold text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition"
                        >
                          + Activity
                        </button>
                        <button
                          onClick={() => onCreateActivityInline(goal.id, idea, true)}
                          className="text-[10px] font-semibold text-amber-200 hover:text-amber-100 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-1 rounded transition"
                        >
                          + To-Do
                        </button>
                      </div>
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
  onEditActivity: (activity: Activity) => void;
  onCreateActivityInline: (goalId: string, title: string, includeToday: boolean) => void;
  onEditGoal: (goal: Goal) => void;
  /** Mark the goal complete — opens CompletionModal */
  onCompleteGoal: (goal: Goal) => void;
  /** Soft-delete the goal after confirmation */
  onDeleteGoal: (goalId: string) => void;
  /** Add a journal entry to this goal (images are File objects to upload) */
  onAddReflection: (goalId: string, text: string, mood?: 'great' | 'okay' | 'hard', images?: File[]) => void;
}

// ─── Branch line SVG ──────────────────────────────────────────────────────────

function BranchLine({
  x1, y1, x2, y2,
}: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="var(--color-border)"
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
  isSelected,
  onSelect,
  onToggleComplete,
  onToggleIncludeToday,
  onEdit,
  onDelete,
}: {
  activity: Activity;
  size: number;
  blobVariant: number;
  reducedMotion: boolean;
  goalCount: number;
  isSelected: boolean;
  onSelect: (activityId: string) => void;
  onToggleComplete: (activityId: string, completed: boolean) => void;
  onToggleIncludeToday: (activityId: string, includeToday: boolean) => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
}) {
  const hue = stringToHue(activity.title);
  const blob = NODE_BLOBS[blobVariant % NODE_BLOBS.length];

  return (
    <div
      className={`relative ${reducedMotion ? '' : 'detail-float'}`}
      style={{ width: size, height: size, animationDelay: `${blobVariant * 0.2}s` }}
      onClick={(e) => { e.stopPropagation(); onSelect(activity.id); }}
    >
      {/* Selection ring */}
      {isSelected && (
        <div
          className="absolute rounded-full border-2 border-white/60 animate-pulse pointer-events-none"
          style={{ inset: -4 }}
        />
      )}
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden className="cursor-pointer">
        <defs>
          <linearGradient id={`act-grad-${activity.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`hsl(${hue}, 60%, ${activity.completed ? 30 : 55}%)`} />
            <stop offset="100%" stopColor={`hsl(${(hue + 25) % 360}, 70%, ${activity.completed ? 22 : 42}%)`} />
          </linearGradient>
          <filter id={`act-shadow-${activity.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feOffset dx="1" dy="4" result="offset" />
            <feFlood floodColor="rgba(0,0,0,0.25)" result="color" />
            <feComposite in="color" in2="offset" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d={blob} fill={`url(#act-grad-${activity.id})`} filter={`url(#act-shadow-${activity.id})`} opacity={activity.completed ? 0.5 : 1} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2">
        <p className={`text-white text-xs font-bold text-center leading-tight ${activity.completed ? 'line-through opacity-50' : ''}`}
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
          {activity.title.length > 30 ? activity.title.slice(0, 28) + '…' : activity.title}
        </p>
        {goalCount > 1 && (
          <span className="bg-white/20 text-white/80 text-[8px] font-medium px-1.5 py-0.5 rounded-full mt-1">
            +{goalCount - 1} goal{goalCount > 2 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Action buttons — visible when selected (click to select, stays visible) */}
      {isSelected && (
        <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleComplete(activity.id, !activity.completed); }}
            className="bg-white/25 hover:bg-white/40 text-white text-[11px] px-2.5 py-1.5 rounded-full transition shadow-lg backdrop-blur-sm"
            title={activity.completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {activity.completed ? '↩ Undo' : '✓ Done'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleIncludeToday(activity.id, !activity.includeToday); }}
            className={`text-[11px] px-2.5 py-1.5 rounded-full transition shadow-lg backdrop-blur-sm ${
              activity.includeToday
                ? 'bg-emerald-500/50 text-emerald-100 hover:bg-emerald-500/70'
                : 'bg-white/25 hover:bg-white/40 text-white'
            }`}
            title={activity.includeToday ? 'Remove from To-Do' : 'Add to To-Do'}
          >
            📋 {activity.includeToday ? 'On list' : 'To-Do'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(activity); }}
            className="bg-blue-500/25 hover:bg-blue-500/50 text-blue-200 text-[11px] px-2.5 py-1.5 rounded-full transition shadow-lg backdrop-blur-sm"
            title="Edit activity"
          >
            ✎ Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              showToast.confirm(`Delete "${activity.title}"?`, () => onDelete(activity.id));
            }}
            className="bg-red-500/25 hover:bg-red-500/50 text-red-200 text-[11px] px-2.5 py-1.5 rounded-full transition shadow-lg backdrop-blur-sm"
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
  onEditActivity,
  onCreateActivityInline,
  onEditGoal,
  onCompleteGoal,
  onDeleteGoal,
  onAddReflection,
} : GoalDetailViewProps) {
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  // Reflect tab state
  const [rightTab, setRightTab] = useState<'ai' | 'reflect'>('ai');
  const [reflectionText, setReflectionText] = useState('');
  const [reflectionMood, setReflectionMood] = useState<'great' | 'okay' | 'hard' | undefined>(undefined);
  const [savingReflection, setSavingReflection] = useState(false);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Detect mobile
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Hide bottom nav while this overlay is open
  useEffect(() => {
    document.body.dataset.modalOpen = 'true';
    return () => { delete document.body.dataset.modalOpen; };
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
      className="fixed inset-0 z-50 overflow-auto detail-warp-in"
      style={{ background: 'var(--mesh-canvas)' }}
    >
      <style>{`
        @keyframes detail-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        .detail-float { animation: detail-float 4s ease-in-out infinite; }
      `}</style>

      {/* ── Top bar ──────────────────────────────────────── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl"
        style={{
          background: isDark ? 'rgba(5,5,5,0.82)' : 'rgba(255,255,255,0.88)',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`,
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Row 1: Back + Goal title */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 transition text-sm font-medium"
            style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back to Goals</span>
            <span className="sm:hidden">Back</span>
          </button>
          <span className="text-xs font-medium truncate max-w-[50%] text-right" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>{goal.title}</span>
        </div>

        {/* Row 2: Action buttons — scrollable on mobile */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pb-2.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onAddActivity(goal.id)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition whitespace-nowrap flex-shrink-0"
            style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            + Activity
          </button>
          <button
            onClick={() => onEditGoal(goal)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition whitespace-nowrap flex-shrink-0"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
          >
            Edit
          </button>
          <button
            id="complete-goal-btn"
            onClick={() => onCompleteGoal(goal)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition whitespace-nowrap flex-shrink-0"
            style={{ background: 'var(--color-text)', color: 'var(--color-bg)', border: 'none' }}
            title="Mark this goal complete and archive it as a Life Chapter"
          >
            ✔ Complete
          </button>
          <button
            id="delete-goal-btn"
            onClick={() => {
              showToast.confirm(`Delete "${goal.title}"? This cannot be undone.`, () => onDeleteGoal(goal.id));
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition whitespace-nowrap flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}
            title="Permanently delete this goal"
          >
            ✕ Delete
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen pt-navbar pb-32">

        {/* ── MOBILE: Card-based layout ─────────────────────────── */}
        {isMobile && (
          <div className="flex-1 overflow-auto px-4 py-5" style={{ paddingTop: 'calc(var(--navbar-height, 100px) + 8px)' }}>

            {/* Goal header card */}
            <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>{goal.title}</h2>
              {goal.why && (
                <p className="text-sm italic mb-3 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>"{goal.why}"</p>
              )}
              {goal.connectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {goal.connectedCategories.map(cat => (
                    <span key={cat} className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                      style={{ background: `hsla(${stringToHue(cat)}, 55%, 50%, 0.15)`, color: `hsl(${stringToHue(cat)}, 55%, 65%)`, border: `1px solid hsla(${stringToHue(cat)}, 55%, 50%, 0.25)` }}>
                      {cat}
                    </span>
                  ))}
                  {(goal.connectedSubcategories ?? []).map(sub => (
                    <span key={sub} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-dim)', border: '1px solid var(--color-border)' }}>{sub}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Progress summary */}
            {activities.length > 0 && (() => {
              const done = activities.filter(a => a.completed).length;
              const pct = Math.round((done / activities.length) * 100);
              return (
                <div className="flex items-center gap-3 mb-4 px-1">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-2)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `hsl(${hue}, 65%, 52%)` }} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-dim)' }}>{done}/{activities.length}</span>
                </div>
              );
            })()}

            {/* Activities header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Activities ({activities.length})</h3>
              <button
                onClick={() => onAddActivity(goal.id)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}
              >
                + Add
              </button>
            </div>

            {/* Activity cards */}
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm mb-3" style={{ color: 'var(--color-text-dim)' }}>No activities yet</p>
                <button
                  onClick={() => onAddActivity(goal.id)}
                  className="text-sm font-semibold px-5 py-2.5 rounded-full transition"
                  style={{ background: `hsla(${hue}, 65%, 52%, 0.2)`, color: `hsl(${hue}, 65%, 65%)`, border: `1px solid hsla(${hue}, 65%, 52%, 0.3)` }}
                >
                  + Add your first activity
                </button>
              </div>
            ) : (
              <div className="space-y-2 mb-6">
                {activities.map(activity => {
                  const isExpanded = expandedActivities.has(activity.id);
                  const hasSubs = activity.subActivities.length > 0;
                  const doneSubs = activity.subActivities.filter(s => s.completed).length;
                  return (
                    <div key={activity.id} className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      {/* Activity row */}
                      <div className="flex items-start gap-3 p-3.5">
                        <button
                          onClick={() => onToggleActivityComplete(activity.id, !activity.completed)}
                          className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                          style={{
                            borderColor: activity.completed ? `hsl(${hue}, 65%, 52%)` : 'var(--color-border)',
                            background: activity.completed ? `hsl(${hue}, 65%, 52%)` : 'transparent',
                          }}
                        >
                          {activity.completed && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium leading-snug ${activity.completed ? 'line-through opacity-50' : ''}`} style={{ color: 'var(--color-text)' }}>
                            {activity.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {activity.includeToday && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Today</span>
                            )}
                            {hasSubs && (
                              <span className="text-[10px]" style={{ color: 'var(--color-text-dim)' }}>{doneSubs}/{activity.subActivities.length} subs</span>
                            )}
                            {activity.connectedGoalIds.length > 1 && (
                              <span className="text-[10px]" style={{ color: 'var(--color-text-dim)' }}>↔ {activity.connectedGoalIds.length} goals</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => onToggleActivityIncludeToday(activity.id, !activity.includeToday)}
                            className="p-1.5 rounded-lg transition" style={{ color: activity.includeToday ? '#10b981' : 'var(--color-text-dim)' }} title={activity.includeToday ? 'Remove from today' : 'Add to today'}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </button>
                          <button onClick={() => onEditActivity(activity)}
                            className="p-1.5 rounded-lg transition" style={{ color: 'var(--color-text-dim)' }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                        </div>
                      </div>
                      {/* Sub-activities (expandable) */}
                      {hasSubs && (
                        <>
                          <button onClick={() => toggleExpand(activity.id)} className="w-full px-3.5 py-2 text-[11px] font-medium flex items-center gap-1.5 transition" style={{ color: 'var(--color-text-dim)', borderTop: '1px solid var(--color-border)' }}>
                            <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            {activity.subActivities.length} sub-activities
                          </button>
                          {isExpanded && (
                            <div className="px-3.5 pb-3 space-y-1.5">
                              {activity.subActivities.map(sub => (
                                <div key={sub.id} className="flex items-center gap-2.5 pl-3">
                                  <button
                                    onClick={() => onToggleSubActivityComplete(activity.id, sub.id, !sub.completed)}
                                    className="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all"
                                    style={{
                                      borderColor: sub.completed ? `hsl(${hue}, 65%, 52%)` : 'var(--color-border)',
                                      background: sub.completed ? `hsl(${hue}, 65%, 52%)` : 'transparent',
                                    }}
                                  >
                                    {sub.completed && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                  </button>
                                  <span className={`text-xs ${sub.completed ? 'line-through opacity-50' : ''}`} style={{ color: 'var(--color-text-muted)' }}>{sub.title}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mobile Reflect section (inline) */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <span>📝</span> Reflect
              </h3>
              {/* Mood */}
              <div className="flex gap-2 mb-3">
                {(['great', 'okay', 'hard'] as const).map(m => (
                  <button key={m} onClick={() => setReflectionMood(prev => prev === m ? undefined : m)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: reflectionMood === m ? (m === 'great' ? 'rgba(0,200,100,0.15)' : m === 'hard' ? 'rgba(255,80,80,0.15)' : 'var(--color-surface-2)') : 'var(--color-surface-2)',
                      border: `1px solid ${reflectionMood === m ? (m === 'great' ? 'rgba(0,200,100,0.3)' : m === 'hard' ? 'rgba(255,80,80,0.3)' : 'var(--color-border)') : 'var(--color-border)'}`,
                      color: reflectionMood === m ? (m === 'great' ? '#34d399' : m === 'hard' ? '#f87171' : 'var(--color-text)') : 'var(--color-text-dim)',
                    }}>
                    {m === 'great' ? '✦ Great' : m === 'hard' ? '⊘ Hard' : '~ Okay'}
                  </button>
                ))}
              </div>
              <textarea
                value={reflectionText}
                onChange={e => setReflectionText(e.target.value)}
                placeholder="How's this goal going?"
                rows={3}
                className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none mb-2"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
              <button
                disabled={!reflectionText.trim() || savingReflection}
                onClick={async () => {
                  if (!reflectionText.trim()) return;
                  setSavingReflection(true);
                  onAddReflection(goal.id, reflectionText.trim(), reflectionMood, undefined);
                  setReflectionText('');
                  setReflectionMood(undefined);
                  await new Promise(r => setTimeout(r, 300));
                  setSavingReflection(false);
                }}
                className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
                style={{ background: 'var(--color-text)', color: 'var(--color-bg)' }}>
                {savingReflection ? 'Saving…' : 'Save Entry'}
              </button>
              {goal.reflections && goal.reflections.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>Past ({goal.reflections.length})</p>
                  {[...goal.reflections].reverse().slice(0, 5).map(r => (
                    <div key={r.id} className="p-3 rounded-xl text-xs" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ color: 'var(--color-text-dim)' }}>{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        {r.mood && <span className="px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: r.mood === 'great' ? 'rgba(0,200,100,0.15)' : r.mood === 'hard' ? 'rgba(255,80,80,0.15)' : 'var(--color-surface-2)', color: r.mood === 'great' ? '#34d399' : r.mood === 'hard' ? '#f87171' : 'var(--color-text-muted)' }}>{r.mood === 'great' ? '✦ Great' : r.mood === 'hard' ? '⊘ Hard' : '~ Okay'}</span>}
                      </div>
                      <p style={{ color: 'var(--color-text-muted)' }} className="leading-relaxed">{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── DESKTOP: Tree area (left) ────────────────────────────────────── */}
        {!isMobile && <div className="flex-1 relative overflow-auto" style={{ minHeight: '100vh' }}
          onClick={() => setSelectedActivityId(null)}
        >
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
              <p className="text-lg font-bold text-center leading-tight text-white"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                {goal.title}
              </p>
              {goal.connectedCategories.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap justify-center">
                  {goal.connectedCategories.slice(0, 2).map(cat => (
                    <span key={cat} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)', color: isDark ? '#fff' : '#333', textShadow: isDark ? '0 1px 2px rgba(0,0,0,0.3)' : 'none' }}>
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
                    <stop offset="0%" stopColor={rootGrad.from} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={rootGrad.to} stopOpacity="0.6" />
                  </linearGradient>
                </defs>
                <path d={WHY_BLOB} fill="url(#why-grad)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-[11px] font-bold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>why</span>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 text-xs rounded-xl px-4 py-3 shadow-2xl z-10"
                style={{ background: isDark ? 'rgba(30,30,40,0.95)' : '#fff', color: isDark ? '#e2e8f0' : '#333', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
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
                  <ActivityBubble
                    activity={activity}
                    size={ACTIVITY_SIZE}
                    blobVariant={i % 4}
                    reducedMotion={reducedMotion}
                    goalCount={goalCount}
                    isSelected={selectedActivityId === activity.id}
                    onSelect={(id) => {
                      setSelectedActivityId(prev => prev === id ? null : id);
                      if (hasSubs) toggleExpand(activity.id);
                    }}
                    onToggleComplete={onToggleActivityComplete}
                    onToggleIncludeToday={onToggleActivityIncludeToday}
                    onEdit={onEditActivity}
                    onDelete={onDeleteActivity}
                  />

                  {hasSubs && (
                    <button
                      onClick={() => toggleExpand(activity.id)}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center transition text-[10px]"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
                        color: 'var(--color-text)',
                      }}
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
              <p className="text-sm mb-3" style={{ color: 'var(--color-text-dim)' }}>No activities yet</p>
              <button
                onClick={() => onAddActivity(goal.id)}
                className="bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-sm font-semibold px-4 py-2 rounded-full transition"
              >
                + Add your first activity
              </button>
            </div>
          )}
        </div>}

        {/* ── Right panel: AI coach + Reflect tabs ──────────── */}
        <div className="hidden lg:flex flex-col w-96 shrink-0 overflow-y-auto"
          style={{ maxHeight: '100vh', paddingTop: '64px', borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}
        >
          {/* Tab switcher */}
          <div className="flex gap-1 px-4 pt-4 pb-2">
            {(['ai', 'reflect'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: rightTab === tab
                    ? isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
                    : 'transparent',
                  color: rightTab === tab
                    ? 'var(--color-text)'
                    : 'var(--color-text-dim)',
                }}
              >
                {tab === 'ai' ? '✨ AI Coach' : '📝 Reflect'}
              </button>
            ))}
          </div>

          {rightTab === 'ai' ? (
            <AiCoachPanel goal={goal} onCreateActivityInline={onCreateActivityInline} />
          ) : (
            <div className="px-4 py-3 flex flex-col gap-4">
              {/* New entry form */}
              <div
                className="rounded-2xl p-4"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-dim)' }}>New Entry</p>
                {/* Mood selector */}
                <div className="flex gap-2 mb-3">
                  {(['great', 'okay', 'hard'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setReflectionMood(prev => prev === m ? undefined : m)}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                      style={{
                        background: reflectionMood === m
                          ? m === 'great' ? 'rgba(0,200,100,0.18)' : m === 'hard' ? 'rgba(255,80,80,0.15)' : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
                          : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        color: reflectionMood === m
                          ? m === 'great' ? '#10b981' : m === 'hard' ? '#ef4444' : 'var(--color-text)'
                          : 'var(--color-text-dim)',
                        border: reflectionMood === m ? `1px solid ${m === 'great' ? 'rgba(0,200,100,0.35)' : m === 'hard' ? 'rgba(255,80,80,0.3)' : 'var(--color-border)'}` : '1px solid var(--color-border)',
                      }}
                    >
                      {m === 'great' ? '✦ Great' : m === 'hard' ? '⊘ Hard' : '~ Okay'}
                    </button>
                  ))}
                </div>
                <textarea
                  id="reflection-entry-textarea"
                  value={reflectionText}
                  onChange={e => setReflectionText(e.target.value)}
                  placeholder="How's this goal going? What's on your mind..."
                  rows={4}
                  className="w-full rounded-xl p-3 resize-none text-xs leading-relaxed focus:outline-none transition-all"
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    letterSpacing: '-0.01em',
                  }}
                />

                {/* Image attachment zone */}
                <div className="mt-2">
                  {pendingImages.length > 0 && (
                    <div className="flex gap-2 mb-2">
                      {pendingImages.map((file, i) => (
                        <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Attachment ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => setPendingImages(prev => prev.filter((_, j) => j !== i))}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <span className="text-white text-xs">✕</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {pendingImages.length < 3 && (
                    <label
                      className="flex items-center gap-2 text-[10px] font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                      style={{ color: 'var(--color-text-dim)', border: `1px dashed var(--color-border)` }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Add photo{pendingImages.length > 0 ? ` (${3 - pendingImages.length} left)` : 's'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={e => {
                          const files = Array.from(e.target.files ?? []);
                          const remaining = 3 - pendingImages.length;
                          setPendingImages(prev => [...prev, ...files.slice(0, remaining)]);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>

                <button
                  id="save-reflection-btn"
                  disabled={!reflectionText.trim() || savingReflection}
                  onClick={async () => {
                    if (!reflectionText.trim()) return;
                    setSavingReflection(true);
                    onAddReflection(goal.id, reflectionText.trim(), reflectionMood, pendingImages.length > 0 ? pendingImages : undefined);
                    setReflectionText('');
                    setReflectionMood(undefined);
                    setPendingImages([]);
                    await new Promise(r => setTimeout(r, 300));
                    setSavingReflection(false);
                  }}
                  className="w-full mt-2 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-30"
                  style={{ background: 'var(--color-text)', color: 'var(--color-bg)' }}
                >
                  {savingReflection ? 'Saving…' : 'Save Entry'}
                </button>
              </div>

              {/* Past entries */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-dim)' }}>Past Entries ({goal.reflections?.length ?? 0})</p>
                {(!goal.reflections || goal.reflections.length === 0) ? (
                  <p className="text-xs italic" style={{ color: 'var(--color-text-dim)' }}>No entries yet. Write your first reflection above.</p>
                ) : (
                  <div className="space-y-3">
                    {[...goal.reflections].reverse().map(r => (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl text-xs"
                        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span style={{ color: 'var(--color-text-dim)' }}>{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          {r.mood && (
                            <span
                              className="px-2 py-0.5 rounded-full"
                              style={{
                                background: r.mood === 'great' ? 'rgba(0,200,100,0.15)' : r.mood === 'hard' ? 'rgba(255,80,80,0.15)' : 'var(--color-surface-2)',
                                color: r.mood === 'great' ? '#34d399' : r.mood === 'hard' ? '#f87171' : 'var(--color-text-muted)',
                              }}
                            >
                              {r.mood === 'great' ? '✦ Great' : r.mood === 'hard' ? '⊘ Hard' : '~ Okay'}
                            </span>
                          )}
                        </div>
                        <p className="leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{r.text}</p>
                        {/* Images attached to this entry */}
                        {r.images && r.images.length > 0 && (
                          <div className="flex gap-1.5 mt-2">
                            {r.images.map((url, i) => (
                              <div key={i} className="w-14 h-14 rounded-lg overflow-hidden">
                                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>


      </div>
    </div>
  );
}
