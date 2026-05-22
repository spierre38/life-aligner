/**
 * roadmap-layout.ts
 *
 * Deterministic bubble positioning for the roadmap canvas.
 *
 * Algorithm: Phyllotaxis (sunflower seed) spiral.
 * Plants use this pattern to pack the maximum number of seeds into a circle
 * with uniform spacing. It's ideal here because:
 *   - Each index maps to a unique, stable position
 *   - Spacing stays uniform as goals are added
 *   - No two bubbles ever overlap at normal counts (< ~50)
 *
 * Determinism guarantee:
 *   The same goal array always produces the same positions because we use
 *   array index (not goal ID or timestamp) as the spiral parameter.
 *   Goals with a saved `position` (user dragged them) override auto-layout.
 */

import type { Goal } from './roadmap-types';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Width and height of a single bubble in pixels. */
export const BUBBLE_SIZE = 164;

/**
 * The golden angle in radians — ~137.5°.
 * Using this as the angular step between items guarantees that no two items
 * share the same spoke of the spiral, even for large n.
 */
const GOLDEN_ANGLE = 137.508 * (Math.PI / 180);

/**
 * Base radial spacing multiplier.
 * Each successive item moves outward by sqrt(index) * SPACING pixels.
 * Increasing this spreads bubbles further apart.
 */
const SPACING = 145;

// ─── Layout computation ───────────────────────────────────────────────────────

/**
 * Returns absolute pixel positions for every active goal.
 *
 * @param goals    All goals in the roadmap (non-active goals are skipped)
 * @param canvasW  Width of the canvas container in pixels
 * @param canvasH  Viewport height (canvas scrolls beyond this if needed)
 * @returns        Map from goal.id → { x, y } (top-left corner of the bubble)
 */
export function computeLayout(
  goals: Goal[],
  canvasW: number,
  canvasH: number
): Map<string, { x: number; y: number }> {
  const active = goals.filter(g => g.status === 'active');
  const positions = new Map<string, { x: number; y: number }>();

  // Center of the spiral. Pushed down slightly so it clears the navbar.
  const centerX = canvasW / 2;
  const centerY = Math.max(canvasH * 0.45, 320);

  // Minimum margin from the edges so bubbles are never clipped.
  const margin = 24;
  const minX = margin;
  const maxX = canvasW - BUBBLE_SIZE - margin;

  active.forEach((goal, i) => {
    // User-dragged position always wins.
    if (goal.position) {
      positions.set(goal.id, goal.position);
      return;
    }

    let x: number;
    let y: number;

    if (i === 0) {
      // First goal: center of the canvas.
      x = centerX - BUBBLE_SIZE / 2;
      y = centerY - BUBBLE_SIZE / 2;
    } else {
      // Subsequent goals: phyllotaxis spiral.
      const radius = Math.sqrt(i) * SPACING;
      const angle = i * GOLDEN_ANGLE;
      x = centerX + radius * Math.cos(angle) - BUBBLE_SIZE / 2;
      y = centerY + radius * Math.sin(angle) - BUBBLE_SIZE / 2;
    }

    positions.set(goal.id, {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(96, y), // Never above the navbar
    });
  });

  return positions;
}

/**
 * Computes the minimum canvas height needed to show all positioned bubbles
 * without clipping. Ensures the canvas grows vertically as goals are added.
 *
 * @param positions  Output of computeLayout()
 * @param viewportH  Current viewport height (the canvas is never shorter than this)
 */
export function computeCanvasHeight(
  positions: Map<string, { x: number; y: number }>,
  viewportH: number
): number {
  let maxY = viewportH;
  for (const pos of positions.values()) {
    maxY = Math.max(maxY, pos.y + BUBBLE_SIZE + 96);
  }
  return maxY;
}
