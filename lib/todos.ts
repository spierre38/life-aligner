/**
 * lib/todos.ts — v4
 *
 * Data layer for the Life Inbox (To-Do page).
 *
 * Deadline buckets:
 *   'today'     → due_date = today's ISO date
 *   'tomorrow'  → due_date = tomorrow's ISO date
 *   'this_week' → due_date = end of current week (Sunday)
 *   'someday'   → due_date = null / undefined
 *
 * Urgency levels (computed at read-time):
 *   'overdue'    → due_date < today, not completed
 *   'today'      → due_date = today, not completed
 *   'tomorrow'   → due_date = tomorrow
 *   'this_week'  → due_date this week
 *   'someday'    → no due_date
 */

import { supabase } from './supabase';
import { logActivity } from './accountability';
import type { RoadmapData, Activity, SubActivity, Goal } from './roadmap-types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeadlineBucket = 'today' | 'tomorrow' | 'this_week' | 'someday';
export type UrgencyLevel   = 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'someday';

export interface SubGoal {
  id: string;
  text: string;
  completed: boolean;
  completed_at?: string | null;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  completed_at?: string | null;
  hidden?: boolean;
  source: 'roadmap' | 'manual';
  goal_title?: string;
  /** Life Category slug, e.g. "Health", "Financial", "Community" */
  category?: string;
  priority?: number;
  /** ISO date string (YYYY-MM-DD) or undefined for someday */
  due_date?: string;
  notes?: string;
  sub_goals?: SubGoal[];
  urgency?: UrgencyLevel;
  // v3/v4 back-references
  activityId?: string;
  isSubActivity?: boolean;
  parentActivityId?: string;
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function endOfWeekISO(): string {
  const d = new Date();
  // Sunday = 0; push to next Sunday
  const daysUntilSunday = 7 - d.getDay();
  d.setDate(d.getDate() + (daysUntilSunday === 7 ? 0 : daysUntilSunday));
  return d.toISOString().split('T')[0];
}

export function bucketToDate(bucket: DeadlineBucket): string | undefined {
  switch (bucket) {
    case 'today':     return todayISO();
    case 'tomorrow':  return tomorrowISO();
    case 'this_week': return endOfWeekISO();
    case 'someday':   return undefined;
  }
}

export function computeUrgency(due_date: string | undefined, completed: boolean): UrgencyLevel {
  if (!due_date) return 'someday';
  const today = todayISO();
  const tomorrow = tomorrowISO();
  if (due_date < today && !completed) return 'overdue';
  if (due_date === today)             return 'today';
  if (due_date === tomorrow)          return 'tomorrow';
  return 'this_week';
}

export const URGENCY_ORDER: Record<UrgencyLevel, number> = {
  overdue:   0,
  today:     1,
  tomorrow:  2,
  this_week: 3,
  someday:   4,
};

export const URGENCY_LABEL: Record<UrgencyLevel, string> = {
  overdue:   'Overdue',
  today:     'Today',
  tomorrow:  'Tomorrow',
  this_week: 'This Week',
  someday:   'Someday',
};

export const URGENCY_COLOR: Record<UrgencyLevel, { bg: string; text: string; dot: string }> = {
  overdue:   { bg: 'rgba(239,68,68,0.15)',   text: 'rgb(239,68,68)',   dot: '#ef4444' },
  today:     { bg: 'rgba(249,115,22,0.15)',  text: 'rgb(249,115,22)',  dot: '#f97316' },
  tomorrow:  { bg: 'rgba(234,179,8,0.15)',   text: 'rgb(234,179,8)',   dot: '#eab308' },
  this_week: { bg: 'rgba(99,102,241,0.15)',  text: 'rgb(99,102,241)', dot: '#6366f1' },
  someday:   { bg: 'rgba(148,163,184,0.12)', text: 'rgb(148,163,184)', dot: '#94a3b8' },
};

// ─── Roadmap Helpers ──────────────────────────────────────────────────────────

async function loadRoadmapContent(): Promise<{ data: RoadmapData | null; userId: string | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, userId: null, error: null };

  const { data: row, error } = await supabase
    .from('workbook_entries')
    .select('content')
    .eq('user_id', user.id)
    .eq('category', 'roadmap')
    .maybeSingle();

  if (error) return { data: null, userId: user.id, error };
  if (!row?.content) return { data: null, userId: user.id, error: null };

  const raw = row.content as any;
  if (raw?.schema_version !== 3) return { data: null, userId: user.id, error: null };

  return { data: raw as RoadmapData, userId: user.id, error: null };
}

async function saveRoadmapContent(userId: string, content: RoadmapData): Promise<{ error: any }> {
  const { error } = await supabase
    .from('workbook_entries')
    .update({
      content: { ...content, updated_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('category', 'roadmap');
  return { error };
}

// ─── GET ALL TODOS ────────────────────────────────────────────────────────────

export async function getAllTodos(): Promise<{ data: TodoItem[] | null; error: any }> {
  try {
    const { data: roadmap, error } = await loadRoadmapContent();
    if (error) return { data: null, error };
    if (!roadmap) return { data: [], error: null };

    const todos: TodoItem[] = [];
    const goalMap = new Map<string, Goal>();
    for (const g of roadmap.goals ?? []) goalMap.set(g.id, g);

    let priority = 1;

    for (const activity of roadmap.activities ?? []) {
      if (!activity.includeToday) continue;

      const connectedGoal = activity.connectedGoalIds.length > 0
        ? goalMap.get(activity.connectedGoalIds[0])
        : undefined;
      const goalTitle = connectedGoal?.title;
      // Category: stored on activity (v4) or fall back to connected goal category
      const category = (activity as any).category
        || connectedGoal?.connectedCategories?.[0];

      const due_date = (activity as any).due_date as string | undefined;
      const urgency = computeUrgency(due_date, activity.completed);

      const subGoals: SubGoal[] = (activity.subActivities ?? []).map(sa => ({
        id: sa.id,
        text: sa.title,
        completed: sa.completed,
        completed_at: sa.completedAt ?? null,
      }));

      todos.push({
        id: activity.id,
        text: activity.title,
        completed: activity.completed,
        completed_at: activity.completedAt ?? null,
        hidden: false,
        source: activity.connectedGoalIds.length > 0 ? 'roadmap' : 'manual',
        goal_title: goalTitle,
        category,
        priority: priority++,
        due_date,
        urgency,
        sub_goals: subGoals,
        activityId: activity.id,
      });
    }

    // Sub-activities with includeToday but parent does not have it
    for (const activity of roadmap.activities ?? []) {
      if (activity.includeToday) continue;
      for (const sa of activity.subActivities ?? []) {
        if (!sa.includeToday) continue;
        const connectedGoal = activity.connectedGoalIds.length > 0
          ? goalMap.get(activity.connectedGoalIds[0])
          : undefined;
        const due_date = (sa as any).due_date as string | undefined;
        todos.push({
          id: sa.id,
          text: sa.title,
          completed: sa.completed,
          completed_at: sa.completedAt ?? null,
          hidden: false,
          source: 'roadmap',
          goal_title: connectedGoal?.title,
          category: (sa as any).category || connectedGoal?.connectedCategories?.[0],
          priority: priority++,
          due_date,
          urgency: computeUrgency(due_date, sa.completed),
          sub_goals: [],
          activityId: activity.id,
          isSubActivity: true,
          parentActivityId: activity.id,
        });
      }
    }

    todos.sort((a, b) => (a.priority || 9999) - (b.priority || 9999));
    return { data: todos, error: null };
  } catch (err) {
    console.error('getAllTodos error:', err);
    return { data: null, error: err };
  }
}

// ─── NOTIFICATION BADGE COUNT ─────────────────────────────────────────────────

/** Returns count of incomplete tasks that are overdue or due today */
export async function getUrgentTodoCount(): Promise<number> {
  const { data } = await getAllTodos();
  if (!data) return 0;
  return data.filter(t =>
    !t.completed && (t.urgency === 'overdue' || t.urgency === 'today')
  ).length;
}

// ─── TOGGLE TODO COMPLETION ───────────────────────────────────────────────────

export async function toggleTodoCompletion(todoId: string, source: 'roadmap' | 'manual') {
  try {
    const { data: roadmap, userId, error: loadErr } = await loadRoadmapContent();
    if (loadErr || !roadmap || !userId) return { error: loadErr || { message: 'No roadmap' } };

    const now = new Date().toISOString();
    let logText = '';
    let logGoal = '';

    roadmap.activities = roadmap.activities.map(a => {
      if (a.id === todoId) {
        const newCompleted = !a.completed;
        logText = a.title;
        const goal = roadmap.goals.find(g => g.id === a.connectedGoalIds[0]);
        logGoal = goal?.title ?? 'Manual Todo';
        return { ...a, completed: newCompleted, completedAt: newCompleted ? now : undefined, updatedAt: now };
      }
      const updatedSubs = a.subActivities.map(sa => {
        if (sa.id === todoId) {
          logText = sa.title;
          const newCompleted = !sa.completed;
          return { ...sa, completed: newCompleted, completedAt: newCompleted ? now : undefined };
        }
        return sa;
      });
      return { ...a, subActivities: updatedSubs, updatedAt: now };
    });

    const { error: saveErr } = await saveRoadmapContent(userId, roadmap);
    if (!saveErr && logText) {
      logActivity('goal_completed', { activity_text: logText, goal_title: logGoal }).catch(console.error);
    }
    return { error: saveErr };
  } catch (err) {
    return { error: err };
  }
}

// ─── TOGGLE VISIBILITY ────────────────────────────────────────────────────────

export async function toggleTodoVisibility(todoId: string, source: 'roadmap' | 'manual') {
  try {
    const { data: roadmap, userId, error: loadErr } = await loadRoadmapContent();
    if (loadErr || !roadmap || !userId) return { error: loadErr || { message: 'No roadmap' } };

    roadmap.activities = roadmap.activities.map(a => {
      if (a.id === todoId) return { ...a, includeToday: !a.includeToday, updatedAt: new Date().toISOString() };
      return {
        ...a,
        subActivities: a.subActivities.map(sa =>
          sa.id === todoId ? { ...sa, includeToday: !sa.includeToday } : sa
        ),
      };
    });

    const { error: saveErr } = await saveRoadmapContent(userId, roadmap);
    return { error: saveErr };
  } catch (err) {
    return { error: err };
  }
}

// ─── TOGGLE SUB-GOAL COMPLETION ───────────────────────────────────────────────

export async function toggleSubGoalCompletion(todoId: string, subGoalId: string, source: 'roadmap' | 'manual') {
  try {
    const { data: roadmap, userId, error: loadErr } = await loadRoadmapContent();
    if (loadErr || !roadmap || !userId) return { error: loadErr || { message: 'No roadmap' } };

    const now = new Date().toISOString();
    roadmap.activities = roadmap.activities.map(a => {
      if (a.id !== todoId) return a;
      return {
        ...a,
        updatedAt: now,
        subActivities: a.subActivities.map(sa => {
          if (sa.id !== subGoalId) return sa;
          const newCompleted = !sa.completed;
          return { ...sa, completed: newCompleted, completedAt: newCompleted ? now : undefined };
        }),
      };
    });

    const { error: saveErr } = await saveRoadmapContent(userId, roadmap);
    return { error: saveErr };
  } catch (err) {
    return { error: err };
  }
}

// ─── ADD SUB-GOAL ─────────────────────────────────────────────────────────────

export async function addSubGoal(todoId: string, subGoalText: string, source: 'roadmap' | 'manual') {
  try {
    const { data: roadmap, userId, error: loadErr } = await loadRoadmapContent();
    if (loadErr || !roadmap || !userId) return { error: loadErr || { message: 'No roadmap' } };

    const now = new Date().toISOString();
    const newSub: SubActivity = {
      id: crypto.randomUUID(),
      title: subGoalText,
      completed: false,
      includeToday: false,
      createdAt: now,
    };

    let updated = false;
    roadmap.activities = roadmap.activities.map(a => {
      if (a.id !== todoId) return a;
      updated = true;
      return { ...a, updatedAt: now, subActivities: [...a.subActivities, newSub] };
    });

    if (!updated) return { error: { message: 'Todo not found' } };
    const { error: saveErr } = await saveRoadmapContent(userId, roadmap);
    return { data: { id: newSub.id, text: newSub.title, completed: false, completed_at: null }, error: saveErr };
  } catch (err) {
    return { error: err };
  }
}

// ─── ADD MANUAL TODO (with category + deadline bucket) ────────────────────────

export async function addManualTodo(text: string, options?: {
  priority?: number;
  due_date?: string;
  bucket?: DeadlineBucket;
  category?: string;
  notes?: string;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    const { data: row, error: fetchError } = await supabase
      .from('workbook_entries')
      .select('content')
      .eq('user_id', user.id)
      .eq('category', 'roadmap')
      .maybeSingle();

    if (fetchError) return { error: fetchError };

    const now = new Date().toISOString();
    let content: RoadmapData;

    if (!row?.content || (row.content as any)?.schema_version !== 3) {
      content = { schema_version: 3, goals: [], activities: [], updated_at: now };
    } else {
      content = row.content as unknown as RoadmapData;
    }

    // Resolve due_date: explicit value takes priority, then bucket
    const due_date = options?.due_date
      ?? (options?.bucket ? bucketToDate(options.bucket) : undefined);

    const newActivity: Activity & { category?: string; due_date?: string } = {
      id: crypto.randomUUID(),
      title: text,
      connectedGoalIds: [],
      completed: false,
      includeToday: true,
      subActivities: [],
      createdAt: now,
      updatedAt: now,
      // v4 extras (stored as extra fields on the activity object)
      ...(options?.category && { category: options.category }),
      ...(due_date && { due_date }),
      ...(options?.notes && { notes: options.notes }),
    };

    content.activities.push(newActivity as Activity);

    const { error: updateError } = await supabase
      .from('workbook_entries')
      .upsert(
        { user_id: user.id, category: 'roadmap', content: { ...content, updated_at: now } },
        { onConflict: 'user_id,category' }
      );

    return {
      data: {
        id: newActivity.id,
        text: newActivity.title,
        completed: false,
        completed_at: null,
        source: 'manual' as const,
        category: options?.category,
        due_date,
        urgency: computeUrgency(due_date, false),
        priority: content.activities.length,
        sub_goals: [],
      },
      error: updateError,
    };
  } catch (err) {
    return { error: err };
  }
}

// ─── DELETE MANUAL TODO ───────────────────────────────────────────────────────

export async function deleteManualTodo(todoId: string) {
  try {
    const { data: roadmap, userId, error: loadErr } = await loadRoadmapContent();
    if (loadErr || !roadmap || !userId) return { error: loadErr || { message: 'No roadmap' } };
    roadmap.activities = roadmap.activities.filter(a => a.id !== todoId);
    const { error: saveErr } = await saveRoadmapContent(userId, roadmap);
    return { error: saveErr };
  } catch (err) {
    return { error: err };
  }
}

// ─── UPDATE ORDER (no-op for now) ─────────────────────────────────────────────

export async function updateTodoOrder(_orderedTodos: TodoItem[]) {
  return { error: null };
}
