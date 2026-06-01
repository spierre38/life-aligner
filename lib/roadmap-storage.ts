/**
 * roadmap-storage.ts — v3
 *
 * All database I/O for the Roadmap feature lives here.
 * Nothing in this file touches the DOM or React — it's pure async functions
 * that any component or API route can import.
 *
 * Public exports:
 *   loadRoadmap(supabase, userId)               — safe read with migration
 *   saveRoadmap(supabase, userId, data, seqRef) — race-safe upsert
 *   normalizeGoal(raw)                          — defensive shape coercion
 *   normalizeActivity(raw)                      — defensive shape coercion
 *
 * Migration: v2 → v3
 *   - GoalNode trees are flattened into top-level Activity[] entries
 *   - PersonalActivities become Activities with connectedGoalIds: []
 *   - Goal.children is removed
 *
 * Design rules:
 *   - Never throw. Errors come back as { ok: false, error: string }.
 *   - Never trust the JSONB column. Every field is validated on read.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  emptyRoadmapData,
  type Goal,
  type Activity,
  type SubActivity,
  type RoadmapData,
  type LegacyGoalNode,
} from './roadmap-types';

// ─── Internal helpers ────────────────────────────────────────────────────────

function field(obj: unknown, key: string): unknown {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return undefined;
  return (obj as Record<string, unknown>)[key];
}

function asString(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : fallback;
}

function asBool(val: unknown, fallback = false): boolean {
  return typeof val === 'boolean' ? val : fallback;
}

function asStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === 'string');
}

function asGoalStatus(val: unknown): Goal['status'] {
  if (val === 'completed' || val === 'deleted') return val;
  return 'active';
}

function asBlobVariant(val: unknown): 0 | 1 | 2 | 3 {
  if (val === 0 || val === 1 || val === 2 || val === 3) return val;
  return 0;
}

// ─── normalizeSubActivity ─────────────────────────────────────────────────────

function normalizeSubActivity(raw: unknown): SubActivity | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return {
    id: asString(field(raw, 'id')) || crypto.randomUUID(),
    title: asString(field(raw, 'title')),
    completed: asBool(field(raw, 'completed')),
    completedAt: asString(field(raw, 'completedAt')) || undefined,
    includeToday: asBool(field(raw, 'includeToday'), false),
    createdAt: asString(field(raw, 'createdAt')) || new Date().toISOString(),
  };
}

// ─── normalizeActivity ───────────────────────────────────────────────────────

export function normalizeActivity(raw: unknown): Activity | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const rawSubs = field(raw, 'subActivities');
  const subActivities: SubActivity[] = Array.isArray(rawSubs)
    ? (rawSubs.map(normalizeSubActivity).filter(Boolean) as SubActivity[])
    : [];

  return {
    id: asString(field(raw, 'id')) || crypto.randomUUID(),
    title: asString(field(raw, 'title')),
    connectedGoalIds: asStringArray(field(raw, 'connectedGoalIds')),
    completed: asBool(field(raw, 'completed')),
    completedAt: asString(field(raw, 'completedAt')) || undefined,
    includeToday: asBool(field(raw, 'includeToday'), false),
    subActivities,
    createdAt: asString(field(raw, 'createdAt')) || new Date().toISOString(),
    updatedAt: asString(field(raw, 'updatedAt')) || new Date().toISOString(),
  };
}

// ─── normalizeGoal (v3 — no children) ────────────────────────────────────────

export function normalizeGoal(raw: unknown): Goal | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const rawPos = field(raw, 'position');
  const rawX = field(rawPos, 'x');
  const rawY = field(rawPos, 'y');
  const position =
    typeof rawX === 'number' && isFinite(rawX) &&
    typeof rawY === 'number' && isFinite(rawY)
      ? { x: rawX, y: rawY }
      : undefined;

  const rawAi = field(raw, 'aiContent');
  const aiWhyItHelps = asString(field(rawAi, 'whyItHelps'));
  const aiDailyIdeas = asStringArray(field(rawAi, 'dailyIdeas'));
  const aiGeneratedAt = asString(field(rawAi, 'generatedAt'));
  const aiProfileHash = asString(field(rawAi, 'profileHash'));
  const aiContent =
    aiWhyItHelps && aiGeneratedAt && aiProfileHash
      ? { whyItHelps: aiWhyItHelps, dailyIdeas: aiDailyIdeas, generatedAt: aiGeneratedAt, profileHash: aiProfileHash }
      : undefined;

  return {
    id: asString(field(raw, 'id')) || crypto.randomUUID(),
    title: asString(field(raw, 'title')),
    why: asString(field(raw, 'why')) || undefined,
    connectedCategories: asStringArray(field(raw, 'connectedCategories')),
    connectedValues: asStringArray(field(raw, 'connectedValues')),
    connectedInterests: asStringArray(field(raw, 'connectedInterests')),
    position,
    blobVariant: asBlobVariant(field(raw, 'blobVariant')),
    status: asGoalStatus(field(raw, 'status')),
    completedAt: asString(field(raw, 'completedAt')) || undefined,
    deletedAt: asString(field(raw, 'deletedAt')) || undefined,
    aiContent,
    createdAt: asString(field(raw, 'createdAt')) || new Date().toISOString(),
    updatedAt: asString(field(raw, 'updatedAt')) || new Date().toISOString(),
  };
}

// ─── v2 → v3 Migration ──────────────────────────────────────────────────────

/**
 * Flattens a v2 GoalNode tree into Activity[] entries.
 *
 * Strategy:
 *   - type='activity' → Activity with empty subActivities
 *   - type='sub_goal' → Activity with its children as subActivities
 *     (sub_goal children that are activities become SubActivity;
 *      sub_goal children that are sub_goals are also flattened recursively)
 */
function flattenGoalNodeTree(
  nodes: unknown[],
  goalId: string,
  now: string
): Activity[] {
  const activities: Activity[] = [];

  for (const rawNode of nodes) {
    if (rawNode === null || typeof rawNode !== 'object' || Array.isArray(rawNode)) continue;

    const nodeId = asString(field(rawNode, 'id')) || crypto.randomUUID();
    const nodeTitle = asString(field(rawNode, 'title'));
    const nodeType = field(rawNode, 'type');
    const nodeCompleted = asBool(field(rawNode, 'completed'));
    const nodeCompletedAt = asString(field(rawNode, 'completedAt')) || undefined;
    const nodeIncludeToday = asBool(field(rawNode, 'includeToday'), false);
    const rawChildren = field(rawNode, 'children');
    const children = Array.isArray(rawChildren) ? rawChildren : [];

    if (nodeType === 'activity') {
      // Leaf activity → becomes a top-level Activity
      activities.push({
        id: nodeId,
        title: nodeTitle,
        connectedGoalIds: [goalId],
        completed: nodeCompleted,
        completedAt: nodeCompletedAt,
        includeToday: nodeIncludeToday,
        subActivities: [],
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // sub_goal → its children become SubActivities, and the sub_goal
      // itself becomes an Activity that contains them.
      const subActivities: SubActivity[] = [];
      const nestedActivities: Activity[] = [];

      for (const rawChild of children) {
        if (rawChild === null || typeof rawChild !== 'object' || Array.isArray(rawChild)) continue;
        const childType = field(rawChild, 'type');

        if (childType === 'activity') {
          // Activity child of a sub_goal → becomes a SubActivity
          subActivities.push({
            id: asString(field(rawChild, 'id')) || crypto.randomUUID(),
            title: asString(field(rawChild, 'title')),
            completed: asBool(field(rawChild, 'completed')),
            completedAt: asString(field(rawChild, 'completedAt')) || undefined,
            includeToday: asBool(field(rawChild, 'includeToday'), false),
            createdAt: now,
          });
        } else {
          // Nested sub_goal → flatten recursively as a separate Activity
          nestedActivities.push(...flattenGoalNodeTree([rawChild], goalId, now));
        }
      }

      activities.push({
        id: nodeId,
        title: nodeTitle,
        connectedGoalIds: [goalId],
        completed: nodeCompleted,
        completedAt: nodeCompletedAt,
        includeToday: nodeIncludeToday,
        subActivities,
        createdAt: now,
        updatedAt: now,
      });

      activities.push(...nestedActivities);
    }
  }

  return activities;
}

/**
 * Migrates a v2 RoadmapData document to v3.
 * - Flattens GoalNode trees into top-level Activity[]
 * - Converts PersonalActivities to Activities with empty connectedGoalIds
 * - Removes `children` from Goals
 */
function migrateV2ToV3(rawGoals: unknown[], rawPersonalActivities: unknown[], updatedAt: string): RoadmapData {
  const now = new Date().toISOString();
  const goals: Goal[] = [];
  const activities: Activity[] = [];

  // Migrate each v2 goal
  for (const rawGoal of rawGoals) {
    if (rawGoal === null || typeof rawGoal !== 'object' || Array.isArray(rawGoal)) continue;

    // Normalize the goal itself (v3 normalizer — no children)
    const goal = normalizeGoal(rawGoal);
    if (!goal) continue;
    goals.push(goal);

    // Flatten its children tree into activities
    const rawChildren = field(rawGoal, 'children');
    if (Array.isArray(rawChildren) && rawChildren.length > 0) {
      activities.push(...flattenGoalNodeTree(rawChildren, goal.id, now));
    }
  }

  // Migrate personal activities
  for (const rawPA of rawPersonalActivities) {
    if (rawPA === null || typeof rawPA !== 'object' || Array.isArray(rawPA)) continue;
    activities.push({
      id: asString(field(rawPA, 'id')) || crypto.randomUUID(),
      title: asString(field(rawPA, 'title')),
      connectedGoalIds: [],
      completed: asBool(field(rawPA, 'completed')),
      completedAt: asString(field(rawPA, 'completedAt')) || undefined,
      includeToday: asBool(field(rawPA, 'includeToday'), true),
      subActivities: [],
      createdAt: asString(field(rawPA, 'createdAt')) || now,
      updatedAt: now,
    });
  }

  return {
    schema_version: 3,
    goals,
    activities,
    updated_at: updatedAt || now,
  };
}

// ─── loadRoadmap ─────────────────────────────────────────────────────────────

export type LoadRoadmapResult =
  | { ok: true; data: RoadmapData; migrated: boolean }
  | { ok: false; error: string };

/**
 * Loads the user's roadmap from Supabase and normalizes it defensively.
 *
 * Migration policy:
 *   - No row found          → return empty v3 document
 *   - schema_version < 2    → return empty v3 document, migrated: true
 *   - schema_version === 2  → auto-migrate to v3 (flatten trees), migrated: true
 *   - schema_version === 3  → parse and normalize, use as-is
 *
 * On migration, the v3 data is saved immediately so we don't re-migrate on
 * every page load.
 */
export async function loadRoadmap(
  supabase: SupabaseClient,
  userId: string
): Promise<LoadRoadmapResult> {
  try {
    const { data: row, error } = await supabase
      .from('workbook_entries')
      .select('content')
      .eq('user_id', userId)
      .eq('category', 'roadmap')
      .maybeSingle();

    if (error) {
      console.error('[roadmap-storage] loadRoadmap DB error:', error);
      return { ok: false, error: 'Failed to load your Roadmap. Please try again.' };
    }

    // No row yet — first time on the roadmap page.
    if (!row || row.content === null) {
      return { ok: true, data: emptyRoadmapData(), migrated: false };
    }

    const raw = row.content as unknown;
    const version = field(raw, 'schema_version');

    // Ancient data (< v2) → wipe to clean v3
    if (typeof version !== 'number' || version < 2) {
      return { ok: true, data: emptyRoadmapData(), migrated: true };
    }

    // v2 → migrate to v3
    if (version === 2) {
      const rawGoals = field(raw, 'goals');
      const rawPA = field(raw, 'personalActivities');
      const updatedAt = asString(field(raw, 'updated_at'));

      const migrated = migrateV2ToV3(
        Array.isArray(rawGoals) ? rawGoals : [],
        Array.isArray(rawPA) ? rawPA : [],
        updatedAt
      );

      // Save the migrated data immediately so we don't re-migrate on every load
      await supabase
        .from('workbook_entries')
        .upsert(
          { user_id: userId, category: 'roadmap', content: migrated },
          { onConflict: 'user_id,category' }
        );

      console.log('[roadmap-storage] Migrated v2 → v3:', migrated.goals.length, 'goals,', migrated.activities.length, 'activities');
      return { ok: true, data: migrated, migrated: true };
    }

    // v3 data — normalize defensively
    const rawGoals = field(raw, 'goals');
    const goals: Goal[] = Array.isArray(rawGoals)
      ? (rawGoals.map(normalizeGoal).filter(Boolean) as Goal[])
      : [];

    const rawActivities = field(raw, 'activities');
    const activities: Activity[] = Array.isArray(rawActivities)
      ? (rawActivities.map(normalizeActivity).filter(Boolean) as Activity[])
      : [];

    const updatedAt = asString(field(raw, 'updated_at')) || new Date().toISOString();

    return {
      ok: true,
      data: { schema_version: 3, goals, activities, updated_at: updatedAt },
      migrated: false,
    };
  } catch (err) {
    console.error('[roadmap-storage] loadRoadmap unexpected error:', err);
    return { ok: false, error: 'Something went wrong loading your Roadmap.' };
  }
}

// ─── saveRoadmap ─────────────────────────────────────────────────────────────

export type SaveRoadmapResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Persists the roadmap to Supabase with optimistic race protection.
 */
export async function saveRoadmap(
  supabase: SupabaseClient,
  userId: string,
  data: RoadmapData,
  seqRef: { current: number }
): Promise<SaveRoadmapResult> {
  const stamped: RoadmapData = { ...data, updated_at: new Date().toISOString() };
  const seq = ++seqRef.current;

  try {
    const { error } = await supabase
      .from('workbook_entries')
      .upsert(
        { user_id: userId, category: 'roadmap', content: stamped },
        { onConflict: 'user_id,category' }
      );

    if (seq !== seqRef.current) return { ok: true };

    if (error) {
      console.error('[roadmap-storage] saveRoadmap DB error:', error);
      return { ok: false, error: 'Failed to save. Check your connection and try again.' };
    }

    return { ok: true };
  } catch (err) {
    console.error('[roadmap-storage] saveRoadmap unexpected error:', err);
    return { ok: false, error: 'Something went wrong saving your Roadmap.' };
  }
}
