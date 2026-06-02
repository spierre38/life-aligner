'use client';

/**
 * AddActivityModal.tsx — v3: Activity-first entry
 *
 * Tim's requirement V: "Enter Single Activity that relates to Single or Multiple Goals"
 *   - LifeFrame reference panel at top
 *   - Shows all existing goals as selectable cards
 *   - Activity title input
 *   - Sub-activities with "Add to To-Do" toggles
 *   - Multi-select goals
 */

import { useState, useEffect, useRef } from 'react';
import type { Goal, Activity, SubActivity } from '@/lib/roadmap-types';

interface SubActivityDraft {
  id: string;
  title: string;
  includeToday: boolean;
}

interface AddActivityModalProps {
  existingGoals: Goal[];
  preselectedGoalId?: string | null;
  savedValues: string[];
  savedInterests: string[];
  savedCategories: string[];
  onClose: () => void;
  onSave: (activity: Activity, newGoalTitles: string[]) => void;
}

export default function AddActivityModal({
  existingGoals,
  preselectedGoalId,
  savedValues,
  savedInterests,
  savedCategories,
  onClose,
  onSave,
}: AddActivityModalProps) {
  const [title, setTitle] = useState('');
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>(
    preselectedGoalId ? [preselectedGoalId] : []
  );
  const [includeToday, setIncludeToday] = useState(false);
  const [subActivityDrafts, setSubActivityDrafts] = useState<SubActivityDraft[]>([]);
  const [newGoalDrafts, setNewGoalDrafts] = useState<string[]>([]);
  const [newGoalInput, setNewGoalInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [showLifeFrame, setShowLifeFrame] = useState(false);
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

  const toggleGoal = (goalId: string) => {
    setSelectedGoalIds(prev =>
      prev.includes(goalId) ? prev.filter(id => id !== goalId) : [...prev, goalId]
    );
  };

  const addSubDraft = () => {
    setSubActivityDrafts(prev => [...prev, {
      id: crypto.randomUUID(),
      title: '',
      includeToday: false,
    }]);
  };

  const updateSubDraft = (id: string, update: Partial<SubActivityDraft>) => {
    setSubActivityDrafts(prev => prev.map(s => s.id === id ? { ...s, ...update } : s));
  };

  const removeSubDraft = (id: string) => {
    setSubActivityDrafts(prev => prev.filter(s => s.id !== id));
  };

  const canSubmit = title.trim().length > 0 && !saving;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);

    const now = new Date().toISOString();

    const newActivity: Activity = {
      id: crypto.randomUUID(),
      title: title.trim(),
      connectedGoalIds: selectedGoalIds,
      completed: false,
      includeToday,
      subActivities: subActivityDrafts
        .filter(d => d.title.trim().length > 0)
        .map(d => ({
          id: d.id,
          title: d.title.trim(),
          completed: false,
          includeToday: d.includeToday,
          createdAt: now,
        })),
      createdAt: now,
      updatedAt: now,
    };

    onSave(newActivity, newGoalDrafts);
  };

  const handleAddGoalDraft = () => {
    const val = newGoalInput.trim();
    if (val && !newGoalDrafts.includes(val) && !existingGoals.some(g => g.title === val)) {
      setNewGoalDrafts(prev => [...prev, val]);
      setNewGoalInput('');
    }
  };

  const removeGoalDraft = (val: string) => {
    setNewGoalDrafts(prev => prev.filter(v => v !== val));
  };

  const hasLifeFrame = savedCategories.length > 0 || savedValues.length > 0 || savedInterests.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Add an activity"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6 flex-shrink-0">
          <p className="text-emerald-200 text-xs font-semibold uppercase tracking-widest mb-1">
            New Activity
          </p>
          <h2 className="text-2xl font-bold text-white">
            What do you want to do?
          </h2>
          <p className="text-emerald-100/80 text-sm mt-1">
            Connect this activity to one or more goals
          </p>
        </div>

        {/* Scrollable form */}
        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5 overflow-y-auto flex-1">
          {/* LifeFrame reference */}
          {hasLifeFrame && (
            <div className="bg-gradient-to-r from-slate-50 to-emerald-50 border border-slate-200 rounded-xl px-4 py-3">
              <button
                type="button"
                onClick={() => setShowLifeFrame(!showLifeFrame)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  📋 Your LifeFrame
                </span>
                <span className="text-slate-400 text-xs">{showLifeFrame ? '▲ Hide' : '▼ Show'}</span>
              </button>
              {showLifeFrame && (
                <div className="mt-3 space-y-2">
                  {savedCategories.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-purple-600 uppercase mb-1">Categories</p>
                      <div className="flex flex-wrap gap-1">
                        {savedCategories.map(c => (
                          <span key={c} className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-medium">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {savedValues.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Values</p>
                      <div className="flex flex-wrap gap-1">
                        {savedValues.map(v => (
                          <span key={v} className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-medium">{v}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {savedInterests.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">Interests</p>
                      <div className="flex flex-wrap gap-1">
                        {savedInterests.map(i => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-medium">{i}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Connect to Goals */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Connect to goals <span className="text-gray-400 font-normal">(select one or more)</span>
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {existingGoals.map(goal => {
                const isSelected = selectedGoalIds.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition border-2 ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    {isSelected && '✓ '}{goal.title}
                  </button>
                );
              })}
              {newGoalDrafts.map(draft => (
                <div
                  key={draft}
                  className="px-3 py-2 rounded-xl text-sm font-medium border-2 bg-purple-600 text-white border-purple-600 shadow-md flex items-center gap-2"
                >
                  <span className="text-purple-200 text-[10px] uppercase tracking-wider font-bold">New</span>
                  {draft}
                  <button
                    type="button"
                    onClick={() => removeGoalDraft(draft)}
                    className="ml-1 text-purple-200 hover:text-white transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newGoalInput}
                onChange={e => setNewGoalInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddGoalDraft();
                  }
                }}
                placeholder="+ Create new goal..."
                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
              <button
                type="button"
                onClick={handleAddGoalDraft}
                disabled={!newGoalInput.trim()}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {selectedGoalIds.length === 0 && newGoalDrafts.length === 0 && (
              <p className="text-xs text-gray-400 mt-2 italic">
                No goals selected — this will be a personal activity
              </p>
            )}
          </div>

          {/* Activity title */}
          <div>
            <label htmlFor="activity-title" className="block text-sm font-semibold text-gray-700 mb-2">
              Activity <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleRef}
              id="activity-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Run Tough Farmer obstacle course at Meredith Farm"
              maxLength={200}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          {/* Add to To-Do toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIncludeToday(!includeToday)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                includeToday
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {includeToday && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className="text-sm text-gray-700">Add to To-Do List</span>
          </div>

          {/* Sub-activities */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">
                Sub-activities <span className="text-gray-400 font-normal">(optional)</span>
              </p>
              <button
                type="button"
                onClick={addSubDraft}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
              >
                + Add sub-activity
              </button>
            </div>

            <div className="space-y-2">
              {subActivityDrafts.map((sa, idx) => (
                <div key={sa.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <span className="text-[10px] text-gray-400 font-mono w-5">
                    {String.fromCharCode(97 + idx)}.
                  </span>
                  <input
                    type="text"
                    value={sa.title}
                    onChange={e => updateSubDraft(sa.id, { title: e.target.value })}
                    placeholder="e.g. Call Gil about schedule"
                    maxLength={140}
                    className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
                  />
                  <button
                    type="button"
                    onClick={() => updateSubDraft(sa.id, { includeToday: !sa.includeToday })}
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
                    onClick={() => removeSubDraft(sa.id)}
                    className="text-gray-300 hover:text-red-400 transition text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

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
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold hover:from-emerald-700 hover:to-teal-700 transition disabled:opacity-50 shadow-lg shadow-emerald-200"
            >
              {saving ? 'Saving…' : `Add Activity${(selectedGoalIds.length + newGoalDrafts.length) > 0 ? ` → ${(selectedGoalIds.length + newGoalDrafts.length)} goal${(selectedGoalIds.length + newGoalDrafts.length) > 1 ? 's' : ''}` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
