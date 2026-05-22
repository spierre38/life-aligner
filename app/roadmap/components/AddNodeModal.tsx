'use client';

/**
 * AddNodeModal.tsx — Phase 3
 *
 * Modal to add a sub-goal or activity to a specific goal.
 * Keeps the same visual language as AddGoalModal but simpler:
 *   - Title (required)
 *   - Type picker: sub-goal or activity
 *   - For activities: "Include in today's list" toggle (defaults to false)
 */

import { useState, useEffect, useRef } from 'react';
import type { GoalNode } from '@/lib/roadmap-types';

interface AddNodeModalProps {
  goalTitle: string;
  /** If adding under a sub-goal, show that context */
  parentTitle?: string;
  onClose: () => void;
  onSave: (node: GoalNode) => void;
}

export default function AddNodeModal({
  goalTitle,
  parentTitle,
  onClose,
  onSave,
}: AddNodeModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'sub_goal' | 'activity'>('activity');
  const [includeToday, setIncludeToday] = useState(false);
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

  const canSubmit = title.trim().length > 0 && !saving;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);

    const newNode: GoalNode = {
      id: crypto.randomUUID(),
      type,
      title: title.trim(),
      completed: false,
      ...(type === 'activity' ? { includeToday } : {}),
    };

    onSave(newNode);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Add to goal"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-5">
          <p className="text-purple-200 text-[10px] font-semibold uppercase tracking-widest mb-1">
            {parentTitle ? `Adding to ${parentTitle}` : goalTitle}
          </p>
          <h2 className="text-xl font-bold text-white">Add a step</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
          {/* Type picker */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">What kind of step?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType('sub_goal')}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition border ${
                  type === 'sub_goal'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400 bg-white'
                }`}
              >
                🎯 Sub-goal
              </button>
              <button
                type="button"
                onClick={() => setType('activity')}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition border ${
                  type === 'activity'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400 bg-white'
                }`}
              >
                ✓ Activity
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {type === 'sub_goal'
                ? 'Sub-goals can be broken down further into more steps.'
                : 'Activities are concrete actions you can check off.'}
            </p>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="node-title" className="block text-sm font-semibold text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleRef}
              id="node-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={type === 'sub_goal' ? 'e.g. Research training plans' : 'e.g. Run 3 miles this week'}
              maxLength={120}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
          </div>

          {/* Include today toggle (activities only) */}
          {type === 'activity' && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeToday}
                onChange={e => setIncludeToday(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                Include in today's activity list
                <span className="text-gray-400 text-xs ml-1">(★)</span>
              </span>
            </label>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
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
              className={`flex-1 py-3 rounded-xl text-white text-sm font-bold transition disabled:opacity-50 shadow-lg ${
                type === 'sub_goal'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-200'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-200'
              }`}
            >
              {saving ? 'Adding…' : 'Add Step'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
