'use client';

/**
 * EditGoalModal.tsx — Phase 2
 *
 * Edit an existing goal's title, why, and connections (categories, values,
 * interests). Pre-populated from the goal's current data.
 *
 * Also provides a "Delete this goal" soft-delete action (sets status to
 * 'deleted', does not remove from DB — keeps data for analytics).
 *
 * Same visual design language as AddGoalModal, so the two feel like
 * the same component family.
 */

import { useState, useEffect, useRef } from 'react';
import type { Goal } from '@/lib/roadmap-types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditGoalModalProps {
  goal: Goal;
  allCategories: string[];
  savedValues: string[];
  savedInterests: string[];
  onClose: () => void;
  onSave: (updated: Goal) => void;
  onDelete: (goalId: string) => void;
}

// ─── Chip picker ──────────────────────────────────────────────────────────────

function ChipPicker({
  label,
  items,
  selected,
  onToggle,
  color,
}: {
  label: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  color: 'purple' | 'blue' | 'rose';
}) {
  if (items.length === 0) return null;
  const filled = {
    purple: 'bg-purple-600 text-white border-purple-600',
    blue: 'bg-blue-600 text-white border-blue-600',
    rose: 'bg-rose-500 text-white border-rose-500',
  }[color];
  const outlined = 'border border-gray-300 text-gray-700 hover:border-gray-400 bg-white';

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${selected.includes(item) ? filled : outlined}`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditGoalModal({
  goal,
  allCategories,
  savedValues,
  savedInterests,
  onClose,
  onSave,
  onDelete,
}: EditGoalModalProps) {
  const [title, setTitle] = useState(goal.title);
  const [why, setWhy] = useState(goal.why ?? '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(goal.connectedCategories);
  const [selectedValues, setSelectedValues] = useState<string[]>(goal.connectedValues);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(goal.connectedInterests);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  function toggle(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
  }

  const canSubmit = title.trim().length > 0 && !saving;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    const updated: Goal = {
      ...goal,
      title: title.trim(),
      why: why.trim() || undefined,
      connectedCategories: selectedCategories,
      connectedValues: selectedValues,
      connectedInterests: selectedInterests,
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${goal.title}"? This cannot be undone.`)) {
      onDelete(goal.id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Edit goal"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-1">
            Edit Goal
          </p>
          <h2 className="text-2xl font-bold text-white">Update your goal</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
          {/* Title */}
          <div>
            <label htmlFor="edit-goal-title" className="block text-sm font-semibold text-gray-700 mb-2">
              Goal title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleRef}
              id="edit-goal-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={140}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/140</p>
          </div>

          {/* Why */}
          <div>
            <label htmlFor="edit-goal-why" className="block text-sm font-semibold text-gray-700 mb-2">
              Why does this matter?{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="edit-goal-why"
              value={why}
              onChange={e => setWhy(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-base placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {/* Chip pickers */}
          <ChipPicker
            label="Life Categories"
            items={allCategories}
            selected={selectedCategories}
            onToggle={item => toggle(selectedCategories, setSelectedCategories, item)}
            color="purple"
          />
          <ChipPicker
            label="Values"
            items={savedValues}
            selected={selectedValues}
            onToggle={item => toggle(selectedValues, setSelectedValues, item)}
            color="blue"
          />
          <ChipPicker
            label="Interests"
            items={savedInterests}
            selected={selectedInterests}
            onToggle={item => toggle(selectedInterests, setSelectedInterests, item)}
            color="rose"
          />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 shadow-lg shadow-indigo-200"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          {/* Delete */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-600 text-sm font-medium transition"
            >
              Delete this goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
