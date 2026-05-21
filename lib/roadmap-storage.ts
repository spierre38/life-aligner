/**
 * roadmap-storage.ts
 *
 * All database I/O for the Roadmap feature lives here.
 * Nothing in this file touches the DOM or React — it's pure async functions
 * that any component or API route can import.
 *
 * Three public exports:
 *   loadRoadmap(supabase, userId)          — safe read with migration
 *   saveRoadmap(supabase, userId, data, seqRef) — race-safe upsert
 *   normalizeGoal(raw)                     — defensive shape coercion
 *
 * Design rules:
 *   - Never throw. Errors come back as { ok: false, error: string }.
 *   - Never trust the JSONB column. Every field is validated on read.
 *   - Writes upgrade old schema; reads never mutate the database.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { emptyRoadmapData, type Goal, type GoalNode, type RoadmapData } from './roadmap-types';

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Safely reads a named field from an unknown value.
 * Returns undefined rather than throwing if the input is not an object.
 */
function field(obj: unknown, key: string): unknown {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return undefined;
  return (obj as Record<string, unknown>)[key];
}

/**
 * Coerces unknown input into a string, or returns the fallback.
 */
function asString(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : fallback;
}

/**
 * Coerces unknown input into a boolean, or returns the fallback.
 */
function asBool(val: unknown, fallback = false): boolean {
  return typeof val === 'boolean' ? val : fallback;
}

/**
 * Coerces unknown input into an array of strings (filters non-strings out).
 */
function asStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === 'string');
}

/**
 * Validates that a value is one of the allowed status strings.
 * Falls back to 'active' for any unrecognised value so goals
 * never silently disappear.
 */
function asGoalStatus(val: unknown): Goal['status'] {
  if (val === 'completed' || val === 'deleted') return val;
  return 'active';
}

/**
 * Validates a blob variant (0–3), defaulting to 0.
 */
function asBlobVariant(val: unknown): 0 | 1 | 2 | 3 {
  if (val === 0 || val === 1 || val === 2 || val === 3) return val;
  return 0;
}

// ─── normalizeGoalNode ───────────────────────────────────────────────────────

/**
 * Recursively normalizes an unknown tree node from the database.
 * Returns null if the input is fundamentally malformed (not an object).
 * Missing fields are filled with safe defaults rather than discarded.
 */
function normalizeGoalNode(raw: unknown, depth = 0): GoalNode | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const type = field(raw, 'type');
  const nodeType: GoalNode['type'] = type === 'activity' ? 'activity' : 'sub_goal';

  // Activities cannot have children regardless of what's in the DB.
  // Sub-goals can, but we cap recursion at depth 2 (Goal→Sub-goal→Activity).
  const rawChildren = nodeType === 'sub_goal' && depth < 2
    ? field(raw, 'children')
    : undefined;

  const children: GoalNode[] = Array.isArray(rawChildren)
    ? (rawChildren.map(c => normalizeGoalNode(c, depth + 1)).filter(Boolean) as GoalNode[])
    : [];

  return {
    id: asString(field(raw, 'id')) || crypto.randomUUID(),
    type: nodeType,
    title: asString(field(raw, 'title')),
    completed: asBool(field(raw, 'completed')),
    completedAt: asString(field(raw, 'completedAt')) || undefined,
    // Only include children key when there are children to keep the object lean.
    ...(children.length > 0 ? { children } : {}),
  };
}

// ─── normalizeGoal ───────────────────────────────────────────────────────────

/**
 * Normalizes a raw, unknown value from the JSONB column into a valid Goal.
 * Returns null only if the input is not an object at all.
 *
 * Every field is coerced defensively:
 *   - Missing strings → empty string or undefined
 *   - Missing arrays  → empty array
 *   - Invalid status  → 'active' (so goals never silently vanish)
 *   - Invalid blob    → 0
 *   - Invalid AI cache → stripped out entirely
 */
export function normalizeGoal(raw: unknown): Goal | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;

  // Normalize children tree.
  const rawChildren = field(raw, 'children');
  const children: GoalNode[] = Array.isArray(rawChildren)
    ? (rawChildren.map(c => normalizeGoalNode(c, 0)).filter(Boolean) as GoalNode[])
    : [];

  // Normalize position (only keep if both x and y are finite numbers).
  const rawPos = field(raw, 'position');
  const rawX = field(rawPos, 'x');
  const rawY = field(rawPos, 'y');
  const position =
    typeof rawX === 'number' && isFinite(rawX) &&
    typeof rawY === 'number' && isFinite(rawY)
      ? { x: rawX, y: rawY }
      : undefined;

  // Normalize AI cache — all four fields must be present and valid strings,
  // otherwise strip the whole block so stale/partial caches don't slip through.
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
    children,
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

// ─── loadRoadmap ─────────────────────────────────────────────────────────────

export type LoadRoadmapResult =
  | { ok: true; data: RoadmapData; migrated: boolean }
  | { ok: false; error: string };

/**
 * Loads the user's roadmap from Supabase and normalizes it defensively.
 *
 * Migration policy (matches plan spec):
 *   - No row found          → return empty v2 document (migrated: false — nothing to migrate)
 *   - schema_version < 2    → return empty v2 document, set migrated: true so
 *                             the caller can show the "We updated Roadmap" toast
 *   - schema_version === 2  → parse and normalize, never throw
 *
 * The migration (wipe) only takes effect on the next *save* — this function
 * never writes to the database. That keeps reads side-effect free.
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
      .maybeSingle(); // maybeSingle returns null (not error) when no row exists

    if (error) {
      console.error('[roadmap-storage] loadRoadmap DB error:', error);
      return { ok: false, error: 'Failed to load your Roadmap. Please try again.' };
    }

    // No row yet — first time on the roadmap page.
    if (!row || row.content === null) {
      return { ok: true, data: emptyRoadmapData(), migrated: false };
    }

    const raw = row.content as unknown;

    // Check schema version. Anything missing or < 2 is old data that needs wiping.
    const version = field(raw, 'schema_version');
    if (typeof version !== 'number' || version < 2) {
      // Return a blank v2 document. The caller saves this on next interaction,
      // which is what actually performs the migration in the DB.
      return { ok: true, data: emptyRoadmapData(), migrated: true };
    }

    // v2 data — normalize every goal defensively.
    const rawGoals = field(raw, 'goals');
    const goals: Goal[] = Array.isArray(rawGoals)
      ? (rawGoals.map(normalizeGoal).filter(Boolean) as Goal[])
      : [];

    const updatedAt = asString(field(raw, 'updated_at')) || new Date().toISOString();

    return {
      ok: true,
      data: { schema_version: 2, goals, updated_at: updatedAt },
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
 *
 * Race protection pattern (matches the existing roadmap page):
 *   - seqRef.current is incremented before the await
 *   - After the await, if seqRef.current has moved past our seq, a newer
 *     save has already fired — we discard our result silently
 *
 * This prevents an earlier slow save from overwriting a later fast save.
 *
 * The caller owns the seqRef so multiple save calls from the same component
 * share the same counter. Pass a React.MutableRefObject<number>.
 *
 * Also stamps updated_at on every save so the DB reflects the real write time.
 */
export async function saveRoadmap(
  supabase: SupabaseClient,
  userId: string,
  data: RoadmapData,
  seqRef: { current: number }
): Promise<SaveRoadmapResult> {
  // Stamp the current time and take our sequence number.
  const stamped: RoadmapData = { ...data, updated_at: new Date().toISOString() };
  const seq = ++seqRef.current;

  try {
    const { error } = await supabase
      .from('workbook_entries')
      .upsert(
        { user_id: userId, category: 'roadmap', content: stamped },
        { onConflict: 'user_id,category' }
      );

    // If a newer save has already completed, ignore our stale result.
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
