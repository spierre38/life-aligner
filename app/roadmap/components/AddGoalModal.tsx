'use client';

/**
 * AddGoalModal.tsx — v3: Goal + inline activities
 *
 * Tim's requirement IV: "Enter Single Goal with Multiple Activities screen"
 *   - LifeFrame reference panel at top (values, interests, categories)
 *   - Goal title + why fields
 *   - Inline activity entry with sub-activity support
 *   - "Add to To-Do" toggle per activity/sub-activity
 *   - Multi-select chip pickers for connections
 *
 * onSave now passes (goal, activities[]) so both are created in one transaction.
 */

import { useState, useEffect, useRef } from 'react';
import type { Goal, Activity, SubActivity } from '@/lib/roadmap-types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddGoalModalProps {
  preselectedCategory?: string;
  allCategories: string[];
  savedValues: string[];
  savedInterests: string[];
  onClose: () => void;
  onSave: (goal: Goal, activities: Activity[]) => void;
}

// Draft types for inline entry
interface ActivityDraft {
  id: string;
  title: string;
  includeToday: boolean;
  subActivities: SubActivityDraft[];
}
interface SubActivityDraft {
  id: string;
  title: string;
  includeToday: boolean;
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
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              selected.includes(item) ? filled : outlined
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── LifeFrame Reference Panel ────────────────────────────────────────────────

function LifeFrameInset({
  categories,
  values,
  interests,
}: {
  categories: string[];
  values: string[];
  interests: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const hasContent = categories.length > 0 || values.length > 0 || interests.length > 0;
  if (!hasContent) return null;

  return (
    <div className="bg-gradient-to-r from-slate-50 to-indigo-50 border border-slate-200 rounded-xl px-4 py-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          📋 Your LifeFrame
        </span>
        <span className="text-slate-400 text-xs">{expanded ? '▲ Hide' : '▼ Show for inspiration'}</span>
      </button>
      {expanded && (
        <div className="mt-3 space-y-2">
          {categories.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-purple-600 uppercase mb-1">Categories</p>
              <div className="flex flex-wrap gap-1">
                {categories.map(c => (
                  <span key={c} className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-medium">{c}</span>
                ))}
              </div>
            </div>
          )}
          {values.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Values</p>
              <div className="flex flex-wrap gap-1">
                {values.map(v => (
                  <span key={v} className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-medium">{v}</span>
                ))}
              </div>
            </div>
          )}
          {interests.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">Interests</p>
              <div className="flex flex-wrap gap-1">
                {interests.map(i => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-medium">{i}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddGoalModal({
  preselectedCategory,
  allCategories,
  savedValues,
  savedInterests,
  onClose,
  onSave,
}: AddGoalModalProps) {
  const [title, setTitle] = useState('');
  const [why, setWhy] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    preselectedCategory ? [preselectedCategory] : []
  );
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [activityDrafts, setActivityDrafts] = useState<ActivityDraft[]>([]);
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

  function toggle(
    list: string[],
    setList: (v: string[]) => void,
    item: string
  ) {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
  }

  // ── Activity draft helpers ──────────────────────────────────────────────────

  const addActivityDraft = () => {
    setActivityDrafts(prev => [...prev, {
      id: crypto.randomUUID(),
      title: '',
      includeToday: false,
      subActivities: [],
    }]);
  };

  const updateActivityDraft = (id: string, update: Partial<ActivityDraft>) => {
    setActivityDrafts(prev => prev.map(a => a.id === id ? { ...a, ...update } : a));
  };

  const removeActivityDraft = (id: string) => {
    setActivityDrafts(prev => prev.filter(a => a.id !== id));
  };

  const addSubActivityDraft = (activityId: string) => {
    setActivityDrafts(prev => prev.map(a =>
      a.id === activityId
        ? { ...a, subActivities: [...a.subActivities, { id: crypto.randomUUID(), title: '', includeToday: false }] }
        : a
    ));
  };

  const updateSubActivityDraft = (activityId: string, subId: string, update: Partial<SubActivityDraft>) => {
    setActivityDrafts(prev => prev.map(a =>
      a.id === activityId
        ? { ...a, subActivities: a.subActivities.map(sa => sa.id === subId ? { ...sa, ...update } : sa) }
        : a
    ));
  };

  const removeSubActivityDraft = (activityId: string, subId: string) => {
    setActivityDrafts(prev => prev.map(a =>
      a.id === activityId
        ? { ...a, subActivities: a.subActivities.filter(sa => sa.id !== subId) }
        : a
    ));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const canSubmit = title.trim().length > 0 && !saving;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);

    const now = new Date().toISOString();
    const goalId = crypto.randomUUID();

    const newGoal: Goal = {
      id: goalId,
      title: title.trim(),
      why: why.trim() || undefined,
      connectedCategories: selectedCategories,
      connectedValues: selectedValues,
      connectedInterests: selectedInterests,
      blobVariant: (Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    // Convert drafts to real Activities
    const newActivities: Activity[] = activityDrafts
      .filter(d => d.title.trim().length > 0)
      .map(d => ({
        id: d.id,
        title: d.title.trim(),
        connectedGoalIds: [goalId],
        completed: false,
        includeToday: d.includeToday,
        subActivities: d.subActivities
          .filter(sa => sa.title.trim().length > 0)
          .map(sa => ({
            id: sa.id,
            title: sa.title.trim(),
            completed: false,
            includeToday: sa.includeToday,
            createdAt: now,
          })),
        createdAt: now,
        updatedAt: now,
      }));

    onSave(newGoal, newActivities);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Add a goal"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6 flex-shrink-0">
          <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">
            New Goal
          </p>
          <h2 className="text-2xl font-bold text-white">
            What do you want to achieve?
          </h2>
          {preselectedCategory && (
            <div className="mt-3 inline-flex items-center gap-2 bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-white rounded-full opacity-80" />
              {preselectedCategory}
            </div>
          )}
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5 overflow-y-auto flex-1">
          {/* LifeFrame reference */}
          <LifeFrameInset
            categories={allCategories}
            values={savedValues}
            interests={savedInterests}
          />

          {/* Title */}
          <div>
            <label htmlFor="goal-title" className="block text-sm font-semibold text-gray-700 mb-2">
              Goal title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleRef}
              id="goal-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Join 3 new communities"
              maxLength={140}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
            <p className="text-xs text-gray-400 mt-1.5 text-right">{title.length}/140</p>
          </div>

          {/* Why */}
          <div>
            <label htmlFor="goal-why" className="block text-sm font-semibold text-gray-700 mb-2">
              Why does this matter?{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="goal-why"
              value={why}
              onChange={e => setWhy(e.target.value)}
              placeholder="The deeper reason behind this goal…"
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-base placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
          </div>

          {/* ── Inline Activities ──────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">
                Activities <span className="text-gray-400 font-normal">(optional)</span>
              </p>
              <button
                type="button"
                onClick={addActivityDraft}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 transition"
              >
                + Add activity
              </button>
            </div>

            {activityDrafts.length === 0 && (
              <p className="text-xs text-gray-400 italic">
                You can add activities now or later from the goal detail view.
              </p>
            )}

            <div className="space-y-3">
              {activityDrafts.map((draft, idx) => (
                <div key={draft.id} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono w-5">{idx + 1}.</span>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={e => updateActivityDraft(draft.id, { title: e.target.value })}
                      placeholder="e.g. Join Tuesday night running group"
                      maxLength={140}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => removeActivityDraft(draft.id)}
                      className="text-gray-400 hover:text-red-500 transition p-1"
                      title="Remove activity"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Include Today toggle */}
                  <div className="flex items-center gap-2 mt-2 ml-7">
                    <button
                      type="button"
                      onClick={() => updateActivityDraft(draft.id, { includeToday: !draft.includeToday })}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                        draft.includeToday
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {draft.includeToday && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <span className="text-xs text-gray-500">Add to To-Do List</span>
                  </div>

                  {/* Sub-activities */}
                  {draft.subActivities.map((sa, saIdx) => (
                    <div key={sa.id} className="flex items-center gap-2 mt-2 ml-7">
                      <span className="text-[10px] text-gray-400 font-mono w-5">
                        {idx + 1}{String.fromCharCode(97 + saIdx)}.
                      </span>
                      <input
                        type="text"
                        value={sa.title}
                        onChange={e => updateSubActivityDraft(draft.id, sa.id, { title: e.target.value })}
                        placeholder="e.g. Call Gil about running group"
                        maxLength={140}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
                      />
                      <button
                        type="button"
                        onClick={() => updateSubActivityDraft(draft.id, sa.id, { includeToday: !sa.includeToday })}
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition flex-shrink-0 ${
                          sa.includeToday
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        title="Add to To-Do"
                      >
                        {sa.includeToday && (
                          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSubActivityDraft(draft.id, sa.id)}
                        className="text-gray-300 hover:text-red-400 transition text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addSubActivityDraft(draft.id)}
                    className="text-[10px] text-purple-500 hover:text-purple-600 transition ml-7 mt-1.5"
                  >
                    + Add sub-activity
                  </button>
                </div>
              ))}
            </div>
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
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 shadow-lg shadow-purple-200"
            >
              {saving
                ? 'Saving…'
                : activityDrafts.filter(d => d.title.trim()).length > 0
                  ? `Add Goal + ${activityDrafts.filter(d => d.title.trim()).length} Activities`
                  : 'Add Goal'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
