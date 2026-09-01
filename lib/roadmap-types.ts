/**
 * roadmap-types.ts — v3
 *
 * Single source of truth for every TypeScript type used across the
 * Roadmap feature. v3 adopts Tim's many-to-many model:
 *
 *   - Activities are first-class entities (not tree children)
 *   - An Activity connects to one or many Goals via connectedGoalIds[]
 *   - Sub-Activities nest under Activities (one level only)
 *   - "Personal" activities have connectedGoalIds: []
 *
 * NO logic lives here — pure types only. This file will never import
 * anything from the rest of the codebase.
 */

// ─── Sub-Activity ─────────────────────────────────────────────────────────────

/**
 * A concrete action step nested under an Activity.
 * Tim's example: "Call Gil about running group" under the Activity
 * "Join Tuesday night running group".
 *
 * Sub-activities can individually be flagged for the To-Do list.
 */
export interface SubActivity {
  id: string;
  title: string;

  /** Whether this sub-activity has been checked off. */
  completed: boolean;

  /** ISO-8601 timestamp set when completed flips to true. */
  completedAt?: string;

  /**
   * If true, this sub-activity appears on the To-Do page.
   * Tim's notes: "For each Activity and Sub-Activity, provide option
   * for it to be added to the To Do List."
   */
  includeToday: boolean;

  /** ISO-8601 timestamp of creation. */
  createdAt: string;
}

// ─── Activity ─────────────────────────────────────────────────────────────────

/**
 * A first-class action item that can connect to one or many Goals.
 *
 * Tim's example: "Run Tough Farmer obstacle course at Meredith Farm"
 * connects to: Lose Weight, Connect with Son, Join Communities,
 * Improve Farm, Work Outdoors.
 *
 * Activities with connectedGoalIds: [] are "personal" activities
 * (standalone, not tied to any goal).
 */
export interface Activity {
  /** Stable UUID — generated with crypto.randomUUID() at creation time. */
  id: string;

  title: string;

  /**
   * Goal IDs this activity is connected to. Many-to-many.
   * Empty array = personal/standalone activity.
   */
  connectedGoalIds: string[];

  /** Whether this activity has been checked off. */
  completed: boolean;

  /** ISO-8601 timestamp set when completed flips to true. */
  completedAt?: string;

  /**
   * If true, this activity appears on the To-Do page.
   * Tim's notes: "For each Activity that is entered, allow entry
   * of Sub-Activity... provide option for it to be added to the To Do List."
   */
  includeToday: boolean;

  /**
   * Concrete action steps under this activity.
   * Tim's example: Activity "Join gym that does HIIT classes" has
   * Sub-Activity "Attend free HIIT class at Pulse Fit to check it out".
   */
  subActivities: SubActivity[];

  /** ISO-8601 timestamp of creation. */
  createdAt: string;

  /** ISO-8601 timestamp of last update. */
  updatedAt: string;

  /**
   * Task recurrence type.
   * - 'daily': resets to incomplete each day (behavior change)
   * - 'one-time': done once, stays completed (default if absent)
   */
  taskType?: 'daily' | 'one-time';

  /** ISO date (YYYY-MM-DD) deadline for one-time tasks. */
  due_date?: string;
}

// ─── Goal ────────────────────────────────────────────────────────────────────

/**
 * A top-level goal on the user's roadmap canvas.
 *
 * In v3, goals no longer own activities as children. Activities are
 * stored at the top level of RoadmapData and reference goals via
 * connectedGoalIds[]. To find a goal's activities:
 *   activities.filter(a => a.connectedGoalIds.includes(goal.id))
 */
export interface Goal {
  /** Stable UUID — generated with crypto.randomUUID() at creation time. */
  id: string;

  title: string;

  /**
   * Single rich-text field answering "why does this goal matter to me?"
   * Displayed in the "Why" branch of the detail view.
   */
  why?: string;

  // ── Multi-connections ──────────────────────────────────────────────────────
  // These store display names (not IDs) so the UI can render chips without
  // cross-referencing another table. Populated from the user's LifeFrame.

  /** Life category names drawn from life_categories.categories[].name */
  connectedCategories: string[];

  /** Subcategory names within the connected categories (e.g. "Mental Health" under "Health"). */
  connectedSubcategories?: string[];

  /** Value names drawn from values.selected_values[].name */
  connectedValues: string[];

  /** Interest names drawn from interests.existing or interests.exploring */
  connectedInterests: string[];

  // ── Canvas placement ───────────────────────────────────────────────────────

  /**
   * Manual canvas position, only saved when the user explicitly drags
   * the bubble. Undefined means auto-layout applies.
   */
  position?: { x: number; y: number };

  /**
   * Which organic blob SVG shape to use for this bubble (0–3).
   * Assigned at creation, stable for the goal's lifetime.
   */
  blobVariant?: 0 | 1 | 2 | 3;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * - 'active'    → visible on the canvas
   * - 'completed' → moved to Reflections, hidden from canvas
   * - 'deleted'   → soft-deleted
   */
  status: 'active' | 'completed' | 'deleted';

  /** ISO-8601 timestamp set when status becomes 'completed'. */
  completedAt?: string;

  /** ISO-8601 timestamp set when status becomes 'deleted'. */
  deletedAt?: string;

  // ── AI cache ───────────────────────────────────────────────────────────────

  /**
   * Cached AI coaching output for this goal (Phase 4).
   *
   * We store the profileHash that was used to generate the content so we
   * can skip the API call when the user's profile hasn't changed.
   */
  aiContent?: {
    /** One paragraph explaining how this goal connects to the user's values. */
    whyItHelps: string;

    /** 2–4 concrete daily actions the user could take toward this goal. */
    dailyIdeas: string[];

    /** ISO-8601 timestamp of when this AI content was generated. */
    generatedAt: string;

    /**
     * SHA-256 hex digest of the user's profile snapshot at generation time.
     * Used to decide whether to use the cache or regenerate.
     */
    profileHash: string;
  };

  /** ISO-8601 timestamp of when this goal was first created. */
  createdAt: string;

  /** ISO-8601 timestamp of the most recent update to this goal. */
  updatedAt: string;

  // ── Journaling & Reflections ─────────────────────────────────────────────

  /**
   * Time-stamped journal entries written by the user while this goal is active.
   * These are displayed in the "Reflect" section of GoalDetailView and
   * carried forward to the Chapters / Reflections page on completion.
   */
  reflections?: Reflection[];

  /**
   * Written at completion time ("What did you learn from this chapter?").
   * Displayed as the headline insight on the ChapterCard in the Reflections page.
   */
  finalReflection?: string;

  // ── Chapter customization ───────────────────────────────────────────────

  /**
   * Optional custom cover image URL (Supabase Storage) for the chapter card.
   * When set, replaces the default mesh gradient in the ChapterCard header.
   */
  coverImageUrl?: string;

  /**
   * A user-chosen quote or one-liner that represents this chapter.
   * Displayed prominently on the chapter card.
   */
  chapterQuote?: string;
}

// ─── Reflection (journal entry) ──────────────────────────────────────────────

/**
 * A single journal entry written during or after a goal's lifetime.
 * Stored inside Goal.reflections[].
 */
export interface Reflection {
  /** Stable UUID. */
  id: string;
  /** The journal entry text. */
  text: string;
  /** ISO-8601 timestamp. */
  date: string;
  /** Optional mood indicator. */
  mood?: 'great' | 'okay' | 'hard';
  /** Optional image URLs (Supabase Storage). Up to 3 per entry. */
  images?: string[];
}

// ─── Legacy types (for migration) ────────────────────────────────────────────

/**
 * v2 GoalNode — used only for migration from schema_version 2.
 * DO NOT use in new code.
 * @deprecated Use Activity + SubActivity instead.
 */
export interface LegacyGoalNode {
  id: string;
  type: 'sub_goal' | 'activity';
  title: string;
  completed: boolean;
  completedAt?: string;
  children?: LegacyGoalNode[];
  includeToday?: boolean;
}

/**
 * v2 Goal shape — used only for migration.
 * @deprecated
 */
export interface LegacyGoal extends Omit<Goal, 'createdAt' | 'updatedAt'> {
  children: LegacyGoalNode[];
  createdAt: string;
  updatedAt: string;
}

// ─── Top-level container ─────────────────────────────────────────────────────

/**
 * The full roadmap document stored in workbook_entries.content
 * for category='roadmap'.
 *
 * schema_version is used to detect and migrate old data:
 *   - Missing or < 2 → wipe to a clean v3 blank
 *   - 2              → auto-migrate to v3 (flatten GoalNode trees)
 *   - 3              → current format, use as-is
 */
export interface RoadmapData {
  /** Always 3 for data written by this version of the app. */
  schema_version: 3;

  /** All goals — active, completed, and deleted. Filter in the UI. */
  goals: Goal[];

  /**
   * All activities — connected to goals via connectedGoalIds[].
   * Activities with connectedGoalIds: [] are personal/standalone.
   * Filter by includeToday for the To-Do page.
   */
  activities: Activity[];

  /** ISO-8601 timestamp of the most recent save. */
  updated_at: string;
}

// ─── Convenience factory ──────────────────────────────────────────────────────

/**
 * Returns a fresh, empty RoadmapData document.
 * Use this instead of writing the literal everywhere — if the shape
 * ever changes, there's one place to update.
 */
export function emptyRoadmapData(): RoadmapData {
  return {
    schema_version: 3,
    goals: [],
    activities: [],
    updated_at: new Date().toISOString(),
  };
}
