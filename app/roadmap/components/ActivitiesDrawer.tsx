'use client';

/**
 * ActivitiesDrawer.tsx — Phase 2
 *
 * A bottom drawer that shows today's activity list across all goals.
 * This is John's "Your Activities" daily action loop, preserved from the
 * old roadmap but elevated into the new canvas experience.
 *
 * "Today's activities" = GoalNode entries where:
 *   - type === 'activity'
 *   - includeToday === true   (user opted in per-activity)
 * Plus all PersonalActivity entries (always shown).
 *
 * Design:
 *   - Fixed to bottom of viewport, z-50 so it floats above the canvas
 *   - Collapsed: thin handle showing count ("Your Activities · 3 remaining")
 *   - Expanded: scrollable list grouped by goal, with personal section at bottom
 *   - Checkbox to complete activities (optimistic update)
 *   - Completed items show strikethrough but stay visible (John's request)
 *   - "Add personal activity" inline input at bottom of personal section
 *   - Persists expanded/collapsed in localStorage
 */

import { useState, useEffect, useRef } from 'react';
import type { Goal, GoalNode, PersonalActivity, RoadmapData } from '@/lib/roadmap-types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TodayActivity {
  id: string;
  title: string;
  completed: boolean;
  goalId: string;
  goalTitle: string;
  isPersonal: boolean;
}

interface ActivitiesDrawerProps {
  roadmap: RoadmapData;
  onCompleteActivity: (goalId: string, nodeId: string, completed: boolean) => void;
  onTogglePersonalActivity: (activityId: string, completed: boolean) => void;
  onAddPersonalActivity: (title: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function collectTodayFromNodes(
  nodes: GoalNode[],
  goalId: string,
  goalTitle: string,
  acc: TodayActivity[]
) {
  for (const node of nodes) {
    if (node.type === 'activity' && node.includeToday) {
      acc.push({
        id: node.id,
        title: node.title,
        completed: node.completed,
        goalId,
        goalTitle,
        isPersonal: false,
      });
    }
    if (node.children) {
      collectTodayFromNodes(node.children, goalId, goalTitle, acc);
    }
  }
}

function buildTodayList(roadmap: RoadmapData): TodayActivity[] {
  const result: TodayActivity[] = [];
  for (const goal of roadmap.goals) {
    if (goal.status !== 'active') continue;
    collectTodayFromNodes(goal.children, goal.id, goal.title, result);
  }
  for (const pa of roadmap.personalActivities) {
    result.push({
      id: pa.id,
      title: pa.title,
      completed: pa.completed,
      goalId: 'personal',
      goalTitle: 'Personal',
      isPersonal: true,
    });
  }
  return result;
}

const LS_KEY = 'roadmap_drawer_expanded';

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActivitiesDrawer({
  roadmap,
  onCompleteActivity,
  onTogglePersonalActivity,
  onAddPersonalActivity,
}: ActivitiesDrawerProps) {
  const [expanded, setExpanded] = useState<boolean>(() => {
    try { return localStorage.getItem(LS_KEY) === 'true'; } catch { return false; }
  });
  const [newActivityText, setNewActivityText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist expanded state.
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, String(expanded)); } catch {}
  }, [expanded]);

  const todayList = buildTodayList(roadmap);
  const remaining = todayList.filter(a => !a.completed).length;

  // Group goal-activities by goal, keep personal separate.
  const goalActivities = todayList.filter(a => !a.isPersonal);
  const personalActivities = todayList.filter(a => a.isPersonal);

  // Group by goalTitle for display.
  const byGoal = goalActivities.reduce<Record<string, TodayActivity[]>>((acc, a) => {
    (acc[a.goalTitle] = acc[a.goalTitle] ?? []).push(a);
    return acc;
  }, {});

  const handleAddPersonal = (e: React.FormEvent) => {
    e.preventDefault();
    const t = newActivityText.trim();
    if (!t) return;
    onAddPersonalActivity(t);
    setNewActivityText('');
  };

  const hasAnything = todayList.length > 0 || roadmap.personalActivities.length === 0;

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-white/95 backdrop-blur-md
        border-t border-gray-200
        shadow-[0_-4px_24px_rgba(0,0,0,0.12)]
        transition-transform duration-300 ease-in-out
        ${expanded ? 'translate-y-0' : 'translate-y-0'}
      `}
      style={{ maxHeight: expanded ? '60vh' : 'auto' }}
    >
      {/* ── Handle / collapsed bar ───────────────────────────────────── */}
      <button
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        aria-controls="activities-drawer-body"
        className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition group"
      >
        <div className="flex items-center gap-3">
          {/* Drag pill */}
          <div className="w-8 h-1 bg-gray-300 rounded-full group-hover:bg-gray-400 transition" />
          <span className="font-semibold text-gray-900 text-sm">Your Activities</span>
          {remaining > 0 && (
            <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {remaining} left
            </span>
          )}
          {remaining === 0 && todayList.length > 0 && (
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              All done! 🎉
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Expanded body ────────────────────────────────────────────── */}
      {expanded && (
        <div
          id="activities-drawer-body"
          className="overflow-y-auto px-6 pb-8 pt-2"
          style={{ maxHeight: 'calc(60vh - 56px)' }}
        >
          {todayList.length === 0 && roadmap.personalActivities.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-1">No activities flagged for today yet.</p>
              <p className="text-gray-400 text-xs">
                Edit a goal and toggle "Include today" on an activity.
              </p>
            </div>
          )}

          {/* Goal-based activities grouped by goal */}
          {Object.entries(byGoal).map(([goalTitle, activities]) => (
            <div key={goalTitle} className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">
                {goalTitle}
              </p>
              <div className="space-y-2">
                {activities.map(activity => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    onToggle={(completed) =>
                      onCompleteActivity(activity.goalId, activity.id, completed)
                    }
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Personal activities */}
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">
              Personal
            </p>
            {personalActivities.length === 0 && (
              <p className="text-gray-400 text-xs mb-3">Add a one-off task below.</p>
            )}
            <div className="space-y-2 mb-3">
              {personalActivities.map(activity => (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                  onToggle={(completed) => onTogglePersonalActivity(activity.id, completed)}
                />
              ))}
            </div>

            {/* Add personal activity */}
            <form onSubmit={handleAddPersonal} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newActivityText}
                onChange={e => setNewActivityText(e.target.value)}
                placeholder="Add a personal task…"
                maxLength={120}
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={!newActivityText.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-40"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Activity row ─────────────────────────────────────────────────────────────

function ActivityRow({
  activity,
  onToggle,
}: {
  activity: TodayActivity;
  onToggle: (completed: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={activity.completed}
        onChange={e => onToggle(e.target.checked)}
        className="w-4 h-4 rounded accent-purple-600 cursor-pointer flex-shrink-0"
      />
      <span
        className={`text-sm flex-1 transition-colors ${
          activity.completed
            ? 'line-through text-gray-400'
            : 'text-gray-800 group-hover:text-gray-900'
        }`}
      >
        {activity.title}
      </span>
    </label>
  );
}
