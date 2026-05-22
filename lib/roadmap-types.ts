/**
 * roadmap-types.ts
 *
 * Single source of truth for every TypeScript type used across the new
 * Roadmap feature (Phases 0–6). Importing from here keeps page.tsx,
 * storage helpers, and API routes all in sync on the same shape.
 *
 * NO logic lives here — pure types only. This file will never import
 * anything from the rest of the codebase.
 */

// ─── Tree node ───────────────────────────────────────────────────────────────

/**
 * One node in the 3-level work tree underneath a Goal.
 *
 *   Goal (level 0 — see Goal interface below)
 *   └─ GoalNode type='sub_goal'   (level 1)
 *      └─ GoalNode type='activity' (level 2 — cannot have children)
 *
 * Max depth enforced in UI, not here, so data can always be read safely
 * even if it somehow has extra nesting.
 */
export interface GoalNode {
  id: string;

  /**
   * 'sub_goal' nodes can have children; 'activity' nodes cannot.
   * The UI enforces this — storage reads it defensively.
   */
  type: 'sub_goal' | 'activity';

  title: string;

  /** Whether this node has been checked off by the user. */
  completed: boolean;

  /** ISO-8601 timestamp set when `completed` flips to true. */
  completedAt?: string;

  /**
   * Only sub_goals can have children. Activities intentionally cannot.
   * May be undefined (treated the same as empty array).
   */
  children?: GoalNode[];

  /**
   * If true, this activity appears in the "Your Activities" daily drawer.
   * Only meaningful on nodes where type === 'activity'.
   * Defaults to false — users opt in per-activity (John's favourite feature).
   */
  includeToday?: boolean;
}

// ─── Goal ────────────────────────────────────────────────────────────────────

/**
 * A top-level goal on the user's roadmap canvas.
 *
 * Goals are stored inside RoadmapData.goals[]. Each one becomes a
 * floating bubble on the canvas (Phase 2) and expands into a full-screen
 * detail view (Phase 3) with its own GoalNode tree.
 */
export interface Goal {
  /** Stable UUID — generated with crypto.randomUUID() at creation time. */
  id: string;

  title: string;

  /**
   * Single rich-text field answering "why does this goal matter to me?"
   * Displayed in the "Why" branch of the detail view (Phase 3).
   */
  why?: string;

  // ── Multi-connections ──────────────────────────────────────────────────────
  // These store display names (not IDs) so the UI can render chips without
  // cross-referencing another table. Populated from the user's LifeFrame.

  /** Life category names drawn from life_categories.categories[].name */
  connectedCategories: string[];

  /** Value names drawn from values.selected_values[].name */
  connectedValues: string[];

  /** Interest names drawn from interests.existing or interests.exploring */
  connectedInterests: string[];

  // ── Work tree ──────────────────────────────────────────────────────────────

  /**
   * The 3-level tree of sub-goals and activities under this goal.
   * An empty array is valid (goal has no tasks yet).
   */
  children: GoalNode[];

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
   * - 'completed' → moved to Reflections (Phase 5), hidden from canvas
   * - 'deleted'   → soft-deleted, may become a reflection card too
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
   * can skip the Anthropic API call when the user's profile hasn't changed.
   * If the hash changes, we regenerate on the next explicit "Refresh" press.
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
}

// ─── Personal activity ──────────────────────────────────────────────────────

/**
 * A stand-alone activity not attached to any goal.
 * Shown in the amber "Personal" section of the Activities drawer.
 * Always appears in the drawer (includeToday is always true for these).
 */
export interface PersonalActivity {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  /** Always true — personal activities are added directly to the drawer. */
  includeToday: boolean;
  createdAt: string;
}

// ─── Top-level container ─────────────────────────────────────────────────────

/**
 * The full roadmap document stored in workbook_entries.content
 * for category='roadmap'.
 *
 * schema_version is used to detect and migrate old data:
 *   - Missing or < 2 → wipe to a clean v2 blank on next save
 *   - 2              → current format, use as-is
 */
export interface RoadmapData {
  /** Always 2 for data written by this version of the app. */
  schema_version: 2;

  /** All goals — active, completed, and deleted. Filter in the UI. */
  goals: Goal[];

  /**
   * Stand-alone activities not attached to any goal.
   * Shown in the amber 'Personal' section of the Activities drawer.
   * Always shown in today's list when present.
   */
  personalActivities: PersonalActivity[];

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
    schema_version: 2,
    goals: [],
    personalActivities: [],
    updated_at: new Date().toISOString(),
  };
}
