/**
 * lib/todos.ts — v3
 *
 * Data layer for the To-Do page. Now reads from v3 RoadmapData:
 *   - Activities with includeToday === true are "roadmap todos"
 *   - SubActivities with includeToday === true also appear
 *   - Manual todos are Activities with connectedGoalIds: [] and includeToday: true
 *
 * All mutations go through the same roadmap content in workbook_entries.
 */

import { supabase } from './supabase';
import { logActivity } from './accountability';
import type { RoadmapData, Activity, SubActivity, Goal } from './roadmap-types';

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
  category?: string;
  priority?: number;
  due_date?: string;
  notes?: string;
  sub_goals?: SubGoal[];
  // v3 additions
  activityId?: string;      // back-reference for mutations
  isSubActivity?: boolean;  // true if this todo comes from a SubActivity
  parentActivityId?: string; // for sub-activities
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function field(obj: unknown, key: string): unknown {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return undefined;
  return (obj as Record<string, unknown>)[key];
}

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
  const version = raw?.schema_version;

  // Only v3 is supported for todo operations
  if (version !== 3) {
    return { data: null, userId: user.id, error: null };
  }

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

// ===================================
// GET ALL TODOS
// ===================================

export async function getAllTodos(): Promise<{ data: TodoItem[] | null; error: any }> {
  try {
    const { data: roadmap, userId, error } = await loadRoadmapContent();

    if (error) return { data: null, error };
    if (!roadmap) return { data: [], error: null };

    const todos: TodoItem[] = [];
    const goals = roadmap.goals ?? [];
    const activities = roadmap.activities ?? [];

    // Build a goal lookup for titles
    const goalMap = new Map<string, Goal>();
    for (const g of goals) {
      goalMap.set(g.id, g);
    }

    let priority = 1;

    for (const activity of activities) {
      if (!activity.includeToday) continue;

      // Determine goal title for display
      const connectedGoal = activity.connectedGoalIds.length > 0
        ? goalMap.get(activity.connectedGoalIds[0])
        : undefined;
      const goalTitle = connectedGoal?.title;
      const category = connectedGoal?.connectedCategories?.[0];

      // Map sub-activities to SubGoals for the UI
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
        sub_goals: subGoals,
        activityId: activity.id,
      });
    }

    // Also include sub-activities that have includeToday but whose parent activity doesn't
    for (const activity of activities) {
      if (activity.includeToday) continue; // already included via parent
      for (const sa of activity.subActivities ?? []) {
        if (!sa.includeToday) continue;

        const connectedGoal = activity.connectedGoalIds.length > 0
          ? goalMap.get(activity.connectedGoalIds[0])
          : undefined;

        todos.push({
          id: sa.id,
          text: sa.title,
          completed: sa.completed,
          completed_at: sa.completedAt ?? null,
          hidden: false,
          source: 'roadmap',
          goal_title: connectedGoal?.title,
          category: connectedGoal?.connectedCategories?.[0],
          priority: priority++,
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
    console.error('Error in getAllTodos:', err);
    return { data: null, error: err };
  }
}

// ===================================
// TOGGLE TODO COMPLETION
// ===================================

export async function toggleTodoCompletion(todoId: string, source: 'roadmap' | 'manual') {
  try {
    const { data: roadmap, userId, error: loadErr } = await loadRoadmapContent();
    if (loadErr || !roadmap || !userId) return { error: loadErr || { message: 'No roadmap' } };

    const now = new Date().toISOString();
    let updated = false;
    let logText = '';
    let logGoal = '';

    // Check if it's a regular activity
    roadmap.activities = roadmap.activities.map(a => {
      if (a.id === todoId) {
        updated = true;
        const newCompleted = !a.completed;
        logText = a.title;
        // Find goal title for logging
        const goalId = a.connectedGoalIds[0];
        if (goalId) {
          const goal = roadmap.goals.find(g => g.id === goalId);
          logGoal = goal?.title ?? 'Roadmap Goal';
        }
        return {
          ...a,
          completed: newCompleted,
          completedAt: newCompleted ? now : undefined,
          updatedAt: now,
        };
      }

      // Check sub-activities
      const updatedSubs = a.subActivities.map(sa => {
        if (sa.id === todoId) {
          updated = true;
          const newCompleted = !sa.completed;
          logText = sa.title;
          return {
            ...sa,
            completed: newCompleted,
            completedAt: newCompleted ? now : undefined,
          };
        }
        return sa;
      });

      if (updatedSubs !== a.subActivities) {
        return { ...a, subActivities: updatedSubs, updatedAt: now };
      }
      return a;
    });

    if (!updated) return { error: { message: 'Todo not found' } };

    const { error: saveErr } = await saveRoadmapContent(userId, roadmap);

    if (!saveErr && logText) {
      logActivity('goal_completed', {
        activity_text: logText,
        goal_title: logGoal || 'Manual Todo',
      }).catch(console.error);
    }

    return { error: saveErr };
  } catch (err) {
    console.error('Error toggling todo:', err);
    return { error: err };
  }
}

// ===================================
// TOGGLE TODO VISIBILITY (HIDE/UNHIDE)
// ===================================

export async function toggleTodoVisibility(todoId: string, source: 'roadmap' | 'manual') {
  try {
    const { data: roadmap, userId, error: loadErr } = await loadRoadmapContent();
    if (loadErr || !roadmap || !userId) return { error: loadErr || { message: 'No roadmap' } };

    let updated = false;

    // Toggle includeToday to hide/show
    roadmap.activities = roadmap.activities.map(a => {
      if (a.id === todoId) {
        updated = true;
        return { ...a, includeToday: !a.includeToday, updatedAt: new Date().toISOString() };
      }

      // Check sub-activities
      const updatedSubs = a.subActivities.map(sa => {
        if (sa.id === todoId) {
          updated = true;
          return { ...sa, includeToday: !sa.includeToday };
        }
        return sa;
      });
      return { ...a, subActivities: updatedSubs };
    });

    if (!updated) return { error: { message: 'Todo not found' } };

    const { error: saveErr } = await saveRoadmapContent(userId, roadmap);
    return { error: saveErr };
  } catch (err) {
    console.error('Error toggling todo visibility:', err);
    return { error: err };
  }
}

// ===================================
// TOGGLE SUB-GOAL COMPLETION
// ===================================

export async function toggleSubGoalCompletion(todoId: string, subGoalId: string, source: 'roadmap' | 'manual') {
  try {
    const { data: roadmap, userId, error: loadErr } = await loadRoadmapContent();
    if (loadErr || !roadmap || !userId) return { error: loadErr || { message: 'No roadmap' } };

    const now = new Date().toISOString();
    let updated = false;

    roadmap.activities = roadmap.activities.map(a => {
      if (a.id === todoId) {
        return {
          ...a,
          updatedAt: now,
          subActivities: a.subActivities.map(sa => {
            if (sa.id === subGoalId) {
              updated = true;
              const newCompleted = !sa.completed;
              return {
                ...sa,
                completed: newCompleted,
                completedAt: newCompleted ? now : undefined,
              };
            }
            return sa;
          }),
        };
      }
      return a;
    });

    if (!updated) return { error: { message: 'Sub-goal not found' } };

    const { error: saveErr } = await saveRoadmapContent(userId, roadmap);
    return { error: saveErr };
  } catch (err) {
    console.error('Error toggling sub-goal:', err);
    return { error: err };
  }
}

// ===================================
// ADD SUB-GOAL
// ===================================

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
      if (a.id === todoId) {
        updated = true;
        return {
          ...a,
          updatedAt: now,
          subActivities: [...a.subActivities, newSub],
        };
      }
      return a;
    });

    if (!updated) return { error: { message: 'Todo not found' } };

    const { error: saveErr } = await saveRoadmapContent(userId, roadmap);
    return {
      data: { id: newSub.id, text: newSub.title, completed: false, completed_at: null },
      error: saveErr,
    };
  } catch (err) {
    console.error('Error adding sub-goal:', err);
    return { error: err };
  }
}

// ===================================
// ADD MANUAL TODO
// ===================================

export async function addManualTodo(text: string, options?: {
  priority?: number;
  due_date?: string;
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
      // Initialize v3 if needed
      content = {
        schema_version: 3,
        goals: [],
        activities: [],
        updated_at: now,
      };
    } else {
      content = row.content as unknown as RoadmapData;
    }

    // Create a new Activity with no connected goals (manual/personal)
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      title: text,
      connectedGoalIds: [],
      completed: false,
      includeToday: true,
      subActivities: [],
      createdAt: now,
      updatedAt: now,
    };

    content.activities.push(newActivity);

    const { error: updateError } = await supabase
      .from('workbook_entries')
      .upsert({
        user_id: user.id,
        category: 'roadmap',
        content: { ...content, updated_at: now },
      }, {
        onConflict: 'user_id,category',
      });

    return {
      data: {
        id: newActivity.id,
        text: newActivity.title,
        completed: false,
        completed_at: null,
        source: 'manual' as const,
        priority: content.activities.length,
        sub_goals: [],
      },
      error: updateError,
    };
  } catch (err) {
    console.error('Error adding manual todo:', err);
    return { error: err };
  }
}

// ===================================
// DELETE MANUAL TODO
// ===================================

export async function deleteManualTodo(todoId: string) {
  try {
    const { data: roadmap, userId, error: loadErr } = await loadRoadmapContent();
    if (loadErr || !roadmap || !userId) return { error: loadErr || { message: 'No roadmap' } };

    roadmap.activities = roadmap.activities.filter(a => a.id !== todoId);

    const { error: saveErr } = await saveRoadmapContent(userId, roadmap);
    return { error: saveErr };
  } catch (err) {
    console.error('Error deleting todo:', err);
    return { error: err };
  }
}

// ===================================
// UPDATE TODO ORDER
// ===================================

export async function updateTodoOrder(orderedTodos: TodoItem[]) {
  // Order is now implicit in the array position of activities.
  // For now, this is a no-op since v3 activities don't have a priority field.
  // The To-Do page can sort by createdAt or user-defined order in the future.
  return { error: null };
}
