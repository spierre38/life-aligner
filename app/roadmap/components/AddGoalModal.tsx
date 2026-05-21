'use client';

/**
 * AddGoalModal.tsx — Phase 1 stub (rebuilt fully in Phase 2)
 *
 * A minimal but polished modal for adding a goal. Opened from FTUECategoryPicker
 * with the tapped category pre-selected.
 *
 * Phase 1 scope (intentionally minimal):
 *   - Title field (required)
 *   - "Why this matters" textarea (optional)
 *   - Pre-selected category shown as a chip (read-only in Phase 1)
 *
 * Phase 2 will expand this with:
 *   - Multi-select chip pickers for categories, values, and interests
 *   - Difficulty / timeframe fields
 *   - Full edit mode
 *
 * Design:
 *   - Dark backdrop with a centered card
 *   - Escape key and backdrop click close the modal
 *   - Focus is trapped inside while open (via autoFocus on title input)
 */

import { useState, useEffect, useRef } from 'react';
import type { Goal } from '@/lib/roadmap-types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddGoalModalProps {
  /** The category the user tapped in FTUECategoryPicker — shown as a chip. */
  preselectedCategory: string;
  /** All of the user's life categories — available for future chip picker in Phase 2. */
  allCategories: string[];
  /** Close without saving. */
  onClose: () => void;
  /** Called with the complete new Goal after the user submits the form. */
  onSave: (goal: Goal) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddGoalModal({
  preselectedCategory,
  onClose,
  onSave,
}: AddGoalModalProps) {
  const [title, setTitle] = useState('');
  const [why, setWhy] = useState('');
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Auto-focus the title field when the modal opens.
  useEffect(() => {
    // Small delay so the CSS transition completes first.
    const t = setTimeout(() => titleRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Close on Escape key.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const canSubmit = title.trim().length > 0 && !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);

    /**
     * Build a complete Goal using all required fields.
     * Phase 2 will pull connectedValues and connectedInterests from chip pickers.
     * For now they default to empty arrays — valid per the type definition.
     */
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title: title.trim(),
      why: why.trim() || undefined,
      connectedCategories: [preselectedCategory],
      connectedValues: [],
      connectedInterests: [],
      children: [],
      blobVariant: (Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newGoal);
    // Note: saving state doesn't need to be reset because the modal will unmount.
  };

  return (
    // Backdrop — click outside to close
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        // Only close if the click was on the backdrop itself, not the card.
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Add a goal"
    >
      {/* Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6">
          <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">
            New Goal
          </p>
          <h2 className="text-2xl font-bold text-white">
            What do you want to achieve?
          </h2>
          {/* Pre-selected category chip */}
          <div className="mt-3 inline-flex items-center gap-2 bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-white rounded-full opacity-80" />
            {preselectedCategory}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="goal-title"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Goal title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleRef}
              id="goal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Run a half marathon"
              maxLength={140}
              required
              className="
                w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900
                text-base placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                transition
              "
            />
            <p className="text-xs text-gray-400 mt-1.5 text-right">
              {title.length}/140
            </p>
          </div>

          {/* Why */}
          <div>
            <label
              htmlFor="goal-why"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Why does this matter to you?{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="goal-why"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="The deeper reason behind this goal..."
              maxLength={500}
              rows={3}
              className="
                w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900
                text-base placeholder-gray-400 resize-none
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                transition
              "
            />
          </div>

          {/* Phase 2 note — visible only in dev, helps developers understand what's coming */}
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-purple-400 bg-purple-50 rounded-lg px-3 py-2">
              Phase 2 will add chip pickers for values, interests, and more categories.
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="
                flex-1 py-3 rounded-xl border border-gray-300 text-gray-700
                text-sm font-semibold
                hover:bg-gray-50 transition
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="
                flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600
                text-white text-sm font-bold
                hover:from-purple-700 hover:to-indigo-700 transition
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg shadow-purple-200
              "
            >
              {saving ? 'Saving…' : 'Add Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
