'use client';

/**
 * ReviewActivitiesView.tsx — Tim's Section III
 *
 * Full-screen overlay showing ALL goals and ALL activities together with
 * visual connection lines (Tim's Approach #1) and stacked cards (Approach #3).
 *
 * Layout:
 *   - Goals as colored pill chips across the top
 *   - SVG connection lines from goal pills to activity cards
 *   - Activity cards with always-visible action buttons
 *   - "Unconnected" section for personal activities
 *   - Goal filter: click a goal to filter activities
 *   - Mobile: stacked list (no SVG lines)
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Goal, Activity } from '@/lib/roadmap-types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stringToHue(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h) % 360;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewActivitiesViewProps {
  goals: Goal[];
  activities: Activity[];
  onClose: () => void;
  onToggleActivityComplete: (activityId: string, completed: boolean) => void;
  onToggleActivityIncludeToday: (activityId: string, includeToday: boolean) => void;
  onDeleteActivity: (activityId: string) => void;
  onAddGoal: () => void;
  onAddActivity: () => void;
}

// ─── Goal Chip ────────────────────────────────────────────────────────────────

function GoalChip({
  goal,
  isSelected,
  onToggle,
  chipRef,
}: {
  goal: Goal;
  isSelected: boolean;
  onToggle: () => void;
  chipRef: (el: HTMLDivElement | null) => void;
}) {
  const hue = goal.connectedCategories[0] ? stringToHue(goal.connectedCategories[0]) : 270;

  return (
    <div
      ref={chipRef}
      onClick={onToggle}
      className={`cursor-pointer px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 flex-shrink-0 select-none ${
        isSelected
          ? 'ring-2 ring-white/60 shadow-lg scale-105'
          : 'opacity-70 hover:opacity-100 hover:scale-102'
      }`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 65%, 48%), hsl(${(hue + 28) % 360}, 75%, 35%))`,
        color: 'white',
      }}
    >
      {goal.title}
      {isSelected && <span className="ml-1.5 text-white/60 text-xs">✕</span>}
    </div>
  );
}

// ─── Activity Card ────────────────────────────────────────────────────────────

function ActivityCard({
  activity,
  goals,
  onToggleComplete,
  onToggleIncludeToday,
  onDelete,
  cardRef,
}: {
  activity: Activity;
  goals: Goal[];
  onToggleComplete: (activityId: string, completed: boolean) => void;
  onToggleIncludeToday: (activityId: string, includeToday: boolean) => void;
  onDelete: (activityId: string) => void;
  cardRef: (el: HTMLDivElement | null) => void;
}) {
  const connectedGoals = goals.filter(g => activity.connectedGoalIds.includes(g.id));
  const completedSubs = activity.subActivities.filter(s => s.completed).length;
  const totalSubs = activity.subActivities.length;

  return (
    <div
      ref={cardRef}
      data-activity-id={activity.id}
      className={`bg-slate-800/60 backdrop-blur-sm border rounded-2xl p-4 transition-all duration-200 hover:bg-slate-800/80 ${
        activity.completed ? 'border-white/5 opacity-60' : 'border-white/10'
      }`}
    >
      {/* Title + status */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className={`text-white font-semibold text-sm leading-tight flex-1 ${
          activity.completed ? 'line-through opacity-60' : ''
        }`}>
          {activity.title}
        </h4>
        {activity.includeToday && (
          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0">
            📋 To-Do
          </span>
        )}
      </div>

      {/* Connected goal tags */}
      {connectedGoals.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {connectedGoals.map(g => {
            const hue = g.connectedCategories[0] ? stringToHue(g.connectedCategories[0]) : 270;
            return (
              <span
                key={g.id}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: `hsla(${hue}, 55%, 45%, 0.25)`,
                  color: `hsl(${hue}, 70%, 75%)`,
                }}
              >
                {g.title}
              </span>
            );
          })}
        </div>
      )}

      {/* Sub-activities preview */}
      {totalSubs > 0 && (
        <div className="mb-3">
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
            Sub-activities ({completedSubs}/{totalSubs})
          </p>
          <div className="space-y-1">
            {activity.subActivities.slice(0, 3).map(sa => (
              <div key={sa.id} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  sa.completed ? 'bg-emerald-400' : 'bg-white/20'
                }`} />
                <span className={`text-xs ${sa.completed ? 'text-white/40 line-through' : 'text-white/60'}`}>
                  {sa.title}
                </span>
              </div>
            ))}
            {totalSubs > 3 && (
              <p className="text-white/30 text-[10px] ml-3.5">+{totalSubs - 3} more</p>
            )}
          </div>
        </div>
      )}

      {/* Always-visible action buttons */}
      <div className="flex gap-2 pt-1 border-t border-white/5">
        <button
          onClick={() => onToggleComplete(activity.id, !activity.completed)}
          className={`text-[11px] font-medium px-3 py-1.5 rounded-full transition ${
            activity.completed
              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
          }`}
        >
          {activity.completed ? '↩ Undo' : '✓ Done'}
        </button>
        <button
          onClick={() => onToggleIncludeToday(activity.id, !activity.includeToday)}
          className={`text-[11px] font-medium px-3 py-1.5 rounded-full transition ${
            activity.includeToday
              ? 'bg-emerald-500/30 text-emerald-200 hover:bg-emerald-500/40'
              : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
          }`}
        >
          📋 {activity.includeToday ? 'On list' : 'To-Do'}
        </button>
        <button
          onClick={() => { if (window.confirm(`Delete "${activity.title}"?`)) onDelete(activity.id); }}
          className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-red-500/10 text-red-300/60 hover:bg-red-500/20 hover:text-red-300 transition ml-auto"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Connection Lines ─────────────────────────────────────────────────────────

function ConnectionLines({
  goals,
  activities,
  goalRefs,
  activityRefs,
  containerRef,
  filterGoalId,
}: {
  goals: Goal[];
  activities: Activity[];
  goalRefs: Map<string, HTMLDivElement>;
  activityRefs: Map<string, HTMLDivElement>;
  containerRef: HTMLDivElement | null;
  filterGoalId: string | null;
}) {
  const [lines, setLines] = useState<Array<{
    x1: number; y1: number; x2: number; y2: number; hue: number; goalId: string; activityId: string;
  }>>([]);

  // Recalculate lines when refs or layout changes
  useEffect(() => {
    if (!containerRef) return;

    const compute = () => {
      const containerRect = containerRef.getBoundingClientRect();
      const containerScroll = containerRef.scrollTop;
      const newLines: typeof lines = [];

      for (const activity of activities) {
        const actEl = activityRefs.get(activity.id);
        if (!actEl) continue;
        const actRect = actEl.getBoundingClientRect();
        const actX = actRect.left + actRect.width / 2 - containerRect.left;
        const actY = actRect.top - containerRect.top + containerScroll;

        for (const goalId of activity.connectedGoalIds) {
          if (filterGoalId && filterGoalId !== goalId) continue;
          const goalEl = goalRefs.get(goalId);
          if (!goalEl) continue;
          const goalRect = goalEl.getBoundingClientRect();
          const goalX = goalRect.left + goalRect.width / 2 - containerRect.left;
          const goalY = goalRect.bottom - containerRect.top + containerScroll;

          const goal = goals.find(g => g.id === goalId);
          const hue = goal?.connectedCategories[0] ? stringToHue(goal.connectedCategories[0]) : 270;

          newLines.push({ x1: goalX, y1: goalY, x2: actX, y2: actY, hue, goalId, activityId: activity.id });
        }
      }

      setLines(newLines);
    };

    compute();

    // Recompute on resize/scroll
    const ro = new ResizeObserver(compute);
    ro.observe(containerRef);
    containerRef.addEventListener('scroll', compute, { passive: true });

    return () => {
      ro.disconnect();
      containerRef.removeEventListener('scroll', compute);
    };
  }, [goals, activities, goalRefs, activityRefs, containerRef, filterGoalId]);

  if (lines.length === 0) return null;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
      {lines.map((line, i) => {
        const midY = (line.y1 + line.y2) / 2;
        return (
          <path
            key={`${line.goalId}-${line.activityId}-${i}`}
            d={`M ${line.x1} ${line.y1} C ${line.x1} ${midY}, ${line.x2} ${midY}, ${line.x2} ${line.y2}`}
            stroke={`hsla(${line.hue}, 55%, 55%, 0.35)`}
            strokeWidth="2"
            fill="none"
            strokeDasharray="6 4"
            className="transition-all duration-300"
          />
        );
      })}
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReviewActivitiesView({
  goals,
  activities,
  onClose,
  onToggleActivityComplete,
  onToggleActivityIncludeToday,
  onDeleteActivity,
  onAddGoal,
  onAddActivity,
}: ReviewActivitiesViewProps) {
  const [mounted, setMounted] = useState(false);
  const [filterGoalId, setFilterGoalId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs for connection line endpoints
  const goalRefsMap = useRef(new Map<string, HTMLDivElement>());
  const activityRefsMap = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const activeGoals = useMemo(() => goals.filter(g => g.status === 'active'), [goals]);

  // Filter activities by selected goal or show all
  const filteredActivities = useMemo(() => {
    if (!filterGoalId) return activities;
    return activities.filter(a => a.connectedGoalIds.includes(filterGoalId));
  }, [activities, filterGoalId]);

  // Split into connected and unconnected
  const connectedActivities = useMemo(
    () => filteredActivities.filter(a => a.connectedGoalIds.length > 0),
    [filteredActivities]
  );
  const unconnectedActivities = useMemo(
    () => filterGoalId ? [] : activities.filter(a => a.connectedGoalIds.length === 0),
    [activities, filterGoalId]
  );

  // Stats
  const totalActivities = activities.length;
  const completedActivities = activities.filter(a => a.completed).length;

  const setGoalRef = useCallback((goalId: string) => (el: HTMLDivElement | null) => {
    if (el) goalRefsMap.current.set(goalId, el);
    else goalRefsMap.current.delete(goalId);
  }, []);

  const setActivityRef = useCallback((actId: string) => (el: HTMLDivElement | null) => {
    if (el) activityRefsMap.current.set(actId, el);
    else activityRefsMap.current.delete(actId);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 overflow-hidden transition-all duration-500 ${
        mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      {/* ── Top bar ────────────────────────────────────────────────── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-950/80 backdrop-blur-md border-b border-white/5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white/70 hover:text-white transition text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Back to Goals</span>
          <span className="sm:hidden">Back</span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-white/30 text-xs">
            {completedActivities}/{totalActivities} done
          </span>
          <button
            onClick={onAddActivity}
            className="bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-full transition"
          >
            + Activity
          </button>
          <button
            onClick={onAddGoal}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition"
          >
            + Goal
          </button>
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────────────── */}
      <div ref={containerRef} className="h-full overflow-y-auto relative" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 64px)' }}>
        {/* ── Goals row ────────────────────────────────────────────── */}
        <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-white/5 px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-white font-bold text-lg">Goals</h2>
            {filterGoalId && (
              <button
                onClick={() => setFilterGoalId(null)}
                className="text-[10px] text-white/40 hover:text-white/60 font-medium px-2 py-0.5 rounded-full border border-white/10 transition"
              >
                Show all ✕
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {activeGoals.map(goal => (
              <GoalChip
                key={goal.id}
                goal={goal}
                isSelected={filterGoalId === goal.id}
                onToggle={() => setFilterGoalId(prev => prev === goal.id ? null : goal.id)}
                chipRef={setGoalRef(goal.id)}
              />
            ))}
            {activeGoals.length === 0 && (
              <p className="text-white/30 text-sm italic">No goals yet</p>
            )}
          </div>
        </div>

        {/* ── Connection lines (desktop only) ──────────────────────── */}
        {!isMobile && (
          <ConnectionLines
            goals={activeGoals}
            activities={connectedActivities}
            goalRefs={goalRefsMap.current}
            activityRefs={activityRefsMap.current}
            containerRef={containerRef.current}
            filterGoalId={filterGoalId}
          />
        )}

        {/* ── Activities grid ──────────────────────────────────────── */}
        <div className="px-6 py-6 relative z-10">
          {connectedActivities.length > 0 && (
            <div className="mb-8">
              <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-4">
                {filterGoalId ? 'Filtered Activities' : 'Connected Activities'}
                <span className="text-white/30 ml-2">{connectedActivities.length}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {connectedActivities.map(activity => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    goals={activeGoals}
                    onToggleComplete={onToggleActivityComplete}
                    onToggleIncludeToday={onToggleActivityIncludeToday}
                    onDelete={onDeleteActivity}
                    cardRef={setActivityRef(activity.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {unconnectedActivities.length > 0 && (
            <div className="mb-8">
              <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-4">
                Personal Activities
                <span className="text-white/30 ml-2">{unconnectedActivities.length}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unconnectedActivities.map(activity => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    goals={activeGoals}
                    onToggleComplete={onToggleActivityComplete}
                    onToggleIncludeToday={onToggleActivityIncludeToday}
                    onDelete={onDeleteActivity}
                    cardRef={setActivityRef(activity.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {connectedActivities.length === 0 && unconnectedActivities.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
              <p className="text-white/40 text-sm mb-4">
                {filterGoalId ? 'No activities connected to this goal' : 'No activities yet'}
              </p>
              <button
                onClick={onAddActivity}
                className="bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-sm font-semibold px-5 py-2.5 rounded-full transition"
              >
                + Add your first activity
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
