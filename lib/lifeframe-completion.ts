/**
 * LifeFrame Completion Evaluator
 *
 * Pure logic for determining whether each section of a user's LifeFrame
 * (Values / Interests / Life Categories) is complete.
 *
 * Thresholds match each worksheet's "happy path" — the bar where each
 * worksheet's UI signals the user has done enough:
 *
 *   - Values:          5–10 selected, each with a numeric priority assigned
 *                      (matches the Values worksheet's warning dialogs)
 *   - Interests:       existing ≥ 5 AND exploring ≥ 5
 *                      (matches the Interests worksheet's "Looking Great!" badge)
 *   - Life Categories: 3–8 categories AND ≥ 1 non-blank purpose element
 *                      (matches the Life Categories worksheet's "Ready to save!" badge)
 *
 * This file intentionally has NO React, NO database calls, and NO side effects.
 * It takes already-fetched workbook_entries rows and returns a structured
 * result the dashboard can use to decide what to render.
 */

// ─── Thresholds ─────────────────────────────────────────────────────────────
// Exported so UI copy can reference the same numbers the logic uses.
// Change them here and everything follows.

export const COMPLETION_THRESHOLDS = {
    values: { min: 5, max: 10, requiresPriorities: true },
    interests: { existingMin: 3, exploringMin: 1 },
    life_categories: { min: 3, max: 8, requiresPurpose: true },
} as const;

// ─── Types ──────────────────────────────────────────────────────────────────

export type SectionStatus =
    | 'not_started'          // No database entry exists for this section at all
    | 'empty'                // Entry exists but content is blank or malformed
    | 'needs_more'           // Has items, but below the minimum threshold
    | 'too_many'             // Has items, but above the maximum threshold
    | 'missing_priorities'   // Values only: count is right but some lack priorities
    | 'missing_purpose'      // Life Categories only: categories are fine but no purpose element
    | 'complete';            // Meets every criterion

export type SectionKey = 'values' | 'interests' | 'life_categories';

/**
 * Per-section result shape. `counts` varies by section so the UI can
 * render helpful copy like "5/5 existing · 3/5 exploring".
 */
export type SectionCompletion = {
    status: SectionStatus;
    isComplete: boolean;
    counts: {
        total?: number;       // Values and Life Categories use this
        existing?: number;    // Interests only
        exploring?: number;   // Interests only
        purpose?: number;     // Life Categories only
    };
    thresholds: {
        min?: number;
        max?: number;
        existingMin?: number;
        exploringMin?: number;
    };
};

export type LifeFrameCompletion = {
    values: SectionCompletion;
    interests: SectionCompletion;
    life_categories: SectionCompletion;

    // Derived summary fields the dashboard consumes directly:
    allComplete: boolean;
    completedCount: 0 | 1 | 2 | 3;
    nextIncomplete: SectionKey | null;
};

/**
 * Minimal shape of a workbook_entries row as this evaluator expects it.
 * `content` is `unknown` on purpose — we validate shape inside, never trust it.
 */
export type WorkbookEntryInput = {
    category: string;
    content: unknown;
};

// ─── Internal helpers ───────────────────────────────────────────────────────

/**
 * Safely read a field from unknown content.
 * Returns undefined if content isn't a plain object or the field is missing.
 * Never throws, even on null / string / array / primitive inputs.
 */
function readField(content: unknown, field: string): unknown {
    if (content === null || typeof content !== 'object') return undefined;
    return (content as Record<string, unknown>)[field];
}

/**
 * Evaluate the Values section.
 * Rule: 5–10 values, each with a finite numeric `priority` assigned.
 */
function evaluateValues(content: unknown): SectionCompletion {
    const thresholds = {
        min: COMPLETION_THRESHOLDS.values.min,
        max: COMPLETION_THRESHOLDS.values.max,
    };

    const selectedValues = readField(content, 'selected_values');
    if (!Array.isArray(selectedValues)) {
        return {
            status: 'empty',
            isComplete: false,
            counts: { total: 0 },
            thresholds,
        };
    }

    const count = selectedValues.length;
    if (count === 0) {
        return { status: 'empty', isComplete: false, counts: { total: 0 }, thresholds };
    }
    if (count < thresholds.min) {
        return { status: 'needs_more', isComplete: false, counts: { total: count }, thresholds };
    }
    if (count > thresholds.max) {
        return { status: 'too_many', isComplete: false, counts: { total: count }, thresholds };
    }

    // Count is in range — now check that every value has a numeric priority.
    const allHavePriorities = selectedValues.every((item) => {
        if (item === null || typeof item !== 'object') return false;
        const priority = (item as Record<string, unknown>).priority;
        return typeof priority === 'number' && Number.isFinite(priority);
    });

    if (!allHavePriorities) {
        return { status: 'missing_priorities', isComplete: false, counts: { total: count }, thresholds };
    }

    return { status: 'complete', isComplete: true, counts: { total: count }, thresholds };
}

/**
 * Evaluate the Interests section.
 * Rule: existing ≥ 5 AND exploring ≥ 5 (both arrays independently).
 */
function evaluateInterests(content: unknown): SectionCompletion {
    const thresholds = {
        existingMin: COMPLETION_THRESHOLDS.interests.existingMin,
        exploringMin: COMPLETION_THRESHOLDS.interests.exploringMin,
    };

    const existing = readField(content, 'existing');
    const exploring = readField(content, 'exploring');

    const existingArr = Array.isArray(existing) ? existing : [];
    const exploringArr = Array.isArray(exploring) ? exploring : [];

    const existingCount = existingArr.length;
    const exploringCount = exploringArr.length;

    if (existingCount === 0 && exploringCount === 0) {
        return {
            status: 'empty',
            isComplete: false,
            counts: { existing: 0, exploring: 0 },
            thresholds,
        };
    }

    if (existingCount < thresholds.existingMin || exploringCount < thresholds.exploringMin) {
        return {
            status: 'needs_more',
            isComplete: false,
            counts: { existing: existingCount, exploring: exploringCount },
            thresholds,
        };
    }

    return {
        status: 'complete',
        isComplete: true,
        counts: { existing: existingCount, exploring: exploringCount },
        thresholds,
    };
}

/**
 * Evaluate the Life Categories section.
 * Rule: 3–8 categories AND at least 1 non-blank purpose element.
 *
 * Note: the worksheet's saveCategories already filters out purpose elements
 * with blank names, but we re-filter defensively here in case data was
 * saved by an older version of the worksheet or was edited outside the UI.
 */
function evaluateLifeCategories(content: unknown): SectionCompletion {
    const thresholds = {
        min: COMPLETION_THRESHOLDS.life_categories.min,
        max: COMPLETION_THRESHOLDS.life_categories.max,
    };

    const categories = readField(content, 'categories');
    const purposeElements = readField(content, 'purpose_elements');

    const categoriesArr = Array.isArray(categories) ? categories : [];
    const purposeArr = Array.isArray(purposeElements) ? purposeElements : [];

    // Count only purpose elements with a non-blank `name` field.
    const validPurposeCount = purposeArr.filter((el) => {
        if (el === null || typeof el !== 'object') return false;
        const name = (el as Record<string, unknown>).name;
        return typeof name === 'string' && name.trim().length > 0;
    }).length;

    const categoryCount = categoriesArr.length;

    if (categoryCount === 0 && validPurposeCount === 0) {
        return {
            status: 'empty',
            isComplete: false,
            counts: { total: 0, purpose: 0 },
            thresholds,
        };
    }

    if (categoryCount > thresholds.max) {
        return {
            status: 'too_many',
            isComplete: false,
            counts: { total: categoryCount, purpose: validPurposeCount },
            thresholds,
        };
    }

    if (categoryCount < thresholds.min) {
        return {
            status: 'needs_more',
            isComplete: false,
            counts: { total: categoryCount, purpose: validPurposeCount },
            thresholds,
        };
    }

    if (validPurposeCount === 0) {
        return {
            status: 'missing_purpose',
            isComplete: false,
            counts: { total: categoryCount, purpose: 0 },
            thresholds,
        };
    }

    return {
        status: 'complete',
        isComplete: true,
        counts: { total: categoryCount, purpose: validPurposeCount },
        thresholds,
    };
}

// ─── Main export ────────────────────────────────────────────────────────────

/**
 * Evaluate the full LifeFrame completion state from already-fetched workbook
 * entries. Pure, defensive, and cheap to call.
 *
 * @param worksheets  All rows from workbook_entries for the current user.
 *                    Extra categories (e.g. 'roadmap') are ignored safely.
 * @returns LifeFrameCompletion with per-section status and summary fields.
 */
export function evaluateLifeFrameCompletion(
    worksheets: WorkbookEntryInput[]
): LifeFrameCompletion {
    const safe = Array.isArray(worksheets) ? worksheets : [];

    const find = (category: SectionKey) =>
        safe.find((w) => w && w.category === category);

    const valuesRow = find('values');
    const interestsRow = find('interests');
    const categoriesRow = find('life_categories');

    const values: SectionCompletion = valuesRow
        ? evaluateValues(valuesRow.content)
        : {
            status: 'not_started',
            isComplete: false,
            counts: { total: 0 },
            thresholds: {
                min: COMPLETION_THRESHOLDS.values.min,
                max: COMPLETION_THRESHOLDS.values.max,
            },
        };

    const interests: SectionCompletion = interestsRow
        ? evaluateInterests(interestsRow.content)
        : {
            status: 'not_started',
            isComplete: false,
            counts: { existing: 0, exploring: 0 },
            thresholds: {
                existingMin: COMPLETION_THRESHOLDS.interests.existingMin,
                exploringMin: COMPLETION_THRESHOLDS.interests.exploringMin,
            },
        };

    const life_categories: SectionCompletion = categoriesRow
        ? evaluateLifeCategories(categoriesRow.content)
        : {
            status: 'not_started',
            isComplete: false,
            counts: { total: 0, purpose: 0 },
            thresholds: {
                min: COMPLETION_THRESHOLDS.life_categories.min,
                max: COMPLETION_THRESHOLDS.life_categories.max,
            },
        };

    const canonicalOrder: SectionKey[] = ['values', 'interests', 'life_categories'];
    const byKey: Record<SectionKey, SectionCompletion> = {
        values,
        interests,
        life_categories,
    };

    const nextIncomplete =
        canonicalOrder.find((key) => !byKey[key].isComplete) ?? null;

    const completedCount = canonicalOrder.filter(
        (key) => byKey[key].isComplete
    ).length as 0 | 1 | 2 | 3;

    const allComplete = completedCount === 3;

    return {
        values,
        interests,
        life_categories,
        allComplete,
        completedCount,
        nextIncomplete,
    };
}
