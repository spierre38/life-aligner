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
  const [taskType, setTaskType] = useState<'one-time' | 'daily'>('one-time');
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
      taskType,
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Add an activity"
    >
      <div
        className="w-full sm:max-w-lg flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          maxHeight: '92dvh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(20,184,166,0.12) 50%, rgba(6,182,212,0.08) 100%)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium transition hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Cancel
          </button>
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(52,211,153,0.8)' }}>
              New Activity
            </p>
            <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>What do you want to do?</h2>
          </div>
          <button
            type="submit"
            form="add-activity-form"
            disabled={!canSubmit}
            className="text-sm font-semibold transition-opacity"
            style={{ color: canSubmit ? '#34d399' : 'var(--color-text-dim)', opacity: canSubmit ? 1 : 0.4 }}
          >
            {saving ? 'Saving…' : 'Add'}
          </button>
        </div>

        {/* Scrollable form */}
        <form id="add-activity-form" onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-5 overflow-y-auto flex-1">
          {/* LifeFrame reference */}
          {hasLifeFrame && (
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <button
                type="button"
                onClick={() => setShowLifeFrame(!showLifeFrame)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
                  📋 Your LifeFrame
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>{showLifeFrame ? '▲ Hide' : '▼ Show'}</span>
              </button>
              {showLifeFrame && (
                <div className="mt-3 space-y-2">
                  {savedCategories.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase mb-1" style={{ color: 'rgba(168,85,247,0.8)' }}>Life Categories</p>
                      <div className="flex flex-wrap gap-1">
                        {savedCategories.map(c => (
                          <span key={c} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: 'rgba(168,85,247,0.15)', color: '#c4b5fd' }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {savedValues.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase mb-1" style={{ color: 'rgba(96,165,250,0.8)' }}>Values</p>
                      <div className="flex flex-wrap gap-1">
                        {savedValues.map(v => (
                          <span key={v} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: 'rgba(96,165,250,0.15)', color: '#93c5fd' }}>{v}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {savedInterests.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase mb-1" style={{ color: 'rgba(251,113,133,0.8)' }}>Interests</p>
                      <div className="flex flex-wrap gap-1">
                        {savedInterests.map(i => (
                          <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: 'rgba(251,113,133,0.15)', color: '#fda4af' }}>{i}</span>
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
            <p className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: 'var(--color-text-dim)' }}>
              Connect to goals <span className="normal-case tracking-normal font-normal" style={{ color: 'var(--color-text-dim)' }}>(select one or more)</span>
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {existingGoals.map(goal => {
                const isSelected = selectedGoalIds.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 active:scale-95"
                    style={isSelected
                      ? { background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.5)', color: '#34d399' }
                      : { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }
                    }
                  >
                    {isSelected && '✓ '}{goal.title}
                  </button>
                );
              })}
              {newGoalDrafts.map(draft => (
                <div
                  key={draft}
                  className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2"
                  style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', color: '#c4b5fd' }}
                >
                  <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: 'rgba(168,85,247,0.7)' }}>New</span>
                  {draft}
                  <button type="button" onClick={() => removeGoalDraft(draft)} className="opacity-60 hover:opacity-100 transition">✕</button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newGoalInput}
                onChange={e => setNewGoalInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddGoalDraft(); } }}
                placeholder="+ Create new goal..."
                className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none transition"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
              <button
                type="button"
                onClick={handleAddGoalDraft}
                disabled={!newGoalInput.trim()}
                className="px-4 py-2 text-sm font-semibold rounded-xl transition disabled:opacity-30"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
              >
                Add
              </button>
            </div>

            {selectedGoalIds.length === 0 && newGoalDrafts.length === 0 && (
              <p className="text-xs mt-2 italic" style={{ color: 'var(--color-text-dim)' }}>
                No goals selected — this will be a personal activity
              </p>
            )}
          </div>

          {/* Activity title */}
          <div>
            <label htmlFor="activity-title" className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-dim)' }}>
              Activity <span className="text-red-400 normal-case tracking-normal font-normal">required</span>
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
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition"
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>

          {/* Add to To-Do toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIncludeToday(!includeToday)}
              className="w-5 h-5 rounded flex items-center justify-center transition flex-shrink-0"
              style={includeToday
                ? { background: 'rgba(52,211,153,0.9)', border: '1px solid rgba(52,211,153,0.6)' }
                : { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }
              }
            >
              {includeToday && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Add to To-Do List</span>
          </div>

          {/* Behavior Change toggle */}
          {includeToday && (
            <div className="flex items-center gap-3 ml-8">
              <button
                type="button"
                onClick={() => setTaskType(prev => prev === 'daily' ? 'one-time' : 'daily')}
                className="w-5 h-5 rounded flex items-center justify-center transition flex-shrink-0"
                style={taskType === 'daily'
                  ? { background: 'rgba(99,102,241,0.9)', border: '1px solid rgba(99,102,241,0.6)' }
                  : { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }
                }
              >
                {taskType === 'daily' && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                🔁 Make this a behavior change
                <span className="block text-[10px]" style={{ color: 'var(--color-text-dim)' }}>Resets daily — comes back each morning</span>
              </span>
            </div>
          )}

          {/* Sub-activities */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-dim)' }}>
                Sub-activities <span className="normal-case tracking-normal font-normal" style={{ color: 'var(--color-text-dim)' }}>(optional)</span>
              </p>
              <button
                type="button"
                onClick={addSubDraft}
                className="text-xs font-semibold transition hover:opacity-70"
                style={{ color: 'rgba(52,211,153,0.8)' }}
              >
                + Add sub-activity
              </button>
            </div>

            <div className="space-y-2">
              {subActivityDrafts.map((sa, idx) => (
                <div key={sa.id} className="flex items-center gap-2 rounded-xl p-2" style={{ background: 'var(--color-surface)' }}>
                  <span className="text-[10px] font-mono w-5" style={{ color: 'var(--color-text-dim)' }}>
                    {String.fromCharCode(97 + idx)}.
                  </span>
                  <input
                    type="text"
                    value={sa.title}
                    onChange={e => updateSubDraft(sa.id, { title: e.target.value })}
                    placeholder="e.g. Call Gil about schedule"
                    maxLength={140}
                    className="flex-1 px-2 py-1.5 rounded-lg text-xs focus:outline-none transition"
                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  />
                  <button
                    type="button"
                    onClick={() => updateSubDraft(sa.id, { includeToday: !sa.includeToday })}
                    className="w-3.5 h-3.5 rounded flex items-center justify-center transition flex-shrink-0"
                    style={sa.includeToday
                      ? { background: 'rgba(52,211,153,0.9)', border: '1px solid rgba(52,211,153,0.6)' }
                      : { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }
                    }
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
                    className="transition text-xs opacity-40 hover:opacity-80"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Activity button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30"
            style={{
              background: canSubmit ? 'linear-gradient(135deg, #10b981, #14b8a6)' : 'var(--color-surface-2)',
              color: '#fff',
              boxShadow: canSubmit ? '0 4px 20px rgba(16,185,129,0.3)' : 'none',
            }}
          >
            {saving ? 'Saving…' : `Add Activity${(selectedGoalIds.length + newGoalDrafts.length) > 0 ? ` → ${(selectedGoalIds.length + newGoalDrafts.length)} goal${(selectedGoalIds.length + newGoalDrafts.length) > 1 ? 's' : ''}` : ''}`}
          </button>
        </form>
      </div>
    </div>
  );
}
