'use client';

/**
 * AddGoalModal.tsx — v4: Premium dark UI + chip-to-why injection
 *
 * New UX: clicking a Life Category, Value, or Interest chip auto-inserts
 * "[Name]: " into the "Why does this matter?" textarea so the user can
 * write their explanation right after the label. Everything is optional.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Goal, Activity } from '@/lib/roadmap-types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddGoalModalProps {
  preselectedCategory?: string;
  allCategories: string[];
  savedValues: string[];
  savedInterests: string[];
  onClose: () => void;
  onSave: (goal: Goal, activities: Activity[]) => void;
}

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

// ─── Chip Section ─────────────────────────────────────────────────────────────

type ChipColor = 'purple' | 'indigo' | 'rose';

const CHIP_STYLES: Record<ChipColor, { on: string; off: string }> = {
  purple: {
    on:  'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.25)]',
    off: 'border-white/10 text-white/50 hover:border-purple-400/40 hover:text-purple-300 hover:bg-purple-500/10',
  },
  indigo: {
    on:  'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_8px_rgba(99,102,241,0.25)]',
    off: 'border-white/10 text-white/50 hover:border-indigo-400/40 hover:text-indigo-300 hover:bg-indigo-500/10',
  },
  rose: {
    on:  'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.25)]',
    off: 'border-white/10 text-white/50 hover:border-rose-400/40 hover:text-rose-300 hover:bg-rose-500/10',
  },
};

function ChipSection({
  label,
  emoji,
  items,
  selected,
  color,
  onToggle,
}: {
  label: string;
  emoji: string;
  items: string[];
  selected: string[];
  color: ChipColor;
  onToggle: (item: string) => void;
}) {
  if (items.length === 0) return null;
  const styles = CHIP_STYLES[color];
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {emoji} {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
              selected.includes(item) ? styles.on : styles.off
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AddGoalModal({
  preselectedCategory,
  allCategories,
  savedValues,
  savedInterests,
  onClose,
  onSave,
}: AddGoalModalProps) {
  const [title, setTitle]                       = useState('');
  const [why, setWhy]                           = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    preselectedCategory ? [preselectedCategory] : []
  );
  const [selectedValues, setSelectedValues]     = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [activityDrafts, setActivityDrafts]     = useState<ActivityDraft[]>([]);
  const [saving, setSaving]                     = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const whyRef   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // ── Chip toggle: inject "[Name]: " into the why textarea ──────────────────
  const injectIntoWhy = useCallback((name: string, isAdding: boolean) => {
    if (!isAdding) return; // only inject on select, not deselect
    const label = `${name}: `;
    setWhy(prev => {
      if (prev.includes(label)) return prev; // already there
      const separator = prev.trim().length > 0 ? '\n' : '';
      return prev + separator + label;
    });
    // Focus and move cursor to end
    setTimeout(() => {
      if (whyRef.current) {
        whyRef.current.focus();
        const len = whyRef.current.value.length;
        whyRef.current.setSelectionRange(len, len);
      }
    }, 20);
  }, []);

  function toggleChip(
    list: string[],
    setList: (v: string[]) => void,
    item: string,
  ) {
    const isAdding = !list.includes(item);
    setList(isAdding ? [...list, item] : list.filter(x => x !== item));
    injectIntoWhy(item, isAdding);
  }

  // ── Activity helpers ────────────────────────────────────────────────────────
  const addActivityDraft = () =>
    setActivityDrafts(prev => [...prev, { id: crypto.randomUUID(), title: '', includeToday: false, subActivities: [] }]);

  const removeActivityDraft = (id: string) =>
    setActivityDrafts(prev => prev.filter(d => d.id !== id));

  const updateActivityDraft = (id: string, patch: Partial<ActivityDraft>) =>
    setActivityDrafts(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));

  const addSubActivityDraft = (parentId: string) =>
    setActivityDrafts(prev => prev.map(d =>
      d.id === parentId
        ? { ...d, subActivities: [...d.subActivities, { id: crypto.randomUUID(), title: '', includeToday: false }] }
        : d
    ));

  const removeSubActivityDraft = (parentId: string, saId: string) =>
    setActivityDrafts(prev => prev.map(d =>
      d.id === parentId ? { ...d, subActivities: d.subActivities.filter(sa => sa.id !== saId) } : d
    ));

  const updateSubActivityDraft = (parentId: string, saId: string, patch: Partial<SubActivityDraft>) =>
    setActivityDrafts(prev => prev.map(d =>
      d.id === parentId
        ? { ...d, subActivities: d.subActivities.map(sa => sa.id === saId ? { ...sa, ...patch } : sa) }
        : d
    ));

  // ── Submit ──────────────────────────────────────────────────────────────────
  const canSubmit = title.trim().length > 0 && !saving;

  const handleSubmit = async (e: React.FormEvent) => {
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
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
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
          .map(sa => ({ id: sa.id, title: sa.title.trim(), completed: false, includeToday: sa.includeToday, createdAt: now })),
        createdAt: now,
        updatedAt: now,
      }));
    onSave(newGoal, newActivities);
  };

  const activeActivityCount = activityDrafts.filter(d => d.title.trim()).length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Add a goal"
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(145deg, #141418 0%, #0f0f14 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          maxHeight: '92vh',
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          className="px-7 py-6 flex-shrink-0 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.12) 50%, rgba(244,63,94,0.08) 100%)' }}
        >
          {/* Decorative glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,1) 0%, transparent 70%)' }} />

          <div className="flex items-start justify-between relative">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(168,85,247,0.8)' }}>
                New Goal
              </p>
              <h2 className="text-xl font-bold" style={{ color: '#fff' }}>
                What do you want to achieve?
              </h2>
              {preselectedCategory && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'rgba(168,85,247,0.2)', color: '#c4b5fd', border: '1px solid rgba(168,85,247,0.3)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  {preselectedCategory}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10 flex-shrink-0 mt-0.5"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Scrollable Form ──────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-6 overflow-y-auto flex-1">

          {/* 1. Goal title */}
          <div>
            <label htmlFor="goal-title" className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              Goal title <span className="text-red-400 normal-case tracking-normal font-normal">required</span>
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
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                caretColor: '#a78bfa',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(168,85,247,0.5)'; e.target.style.background = 'rgba(168,85,247,0.07)'; }}
              onBlur={e =>  { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
            />
            <p className="text-right text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>{title.length}/140</p>
          </div>

          {/* 2. LifeFrame connections → click to inject into why */}
          {(allCategories.length > 0 || savedValues.length > 0 || savedInterests.length > 0) && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Connect to your LifeFrame
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Tap a chip to add it to your "why" below
                </p>
              </div>
              <ChipSection
                label="Life Categories" emoji="🗂️"
                items={allCategories} selected={selectedCategories} color="purple"
                onToggle={item => toggleChip(selectedCategories, setSelectedCategories, item)}
              />
              <ChipSection
                label="Values" emoji="⚡"
                items={savedValues} selected={selectedValues} color="indigo"
                onToggle={item => toggleChip(selectedValues, setSelectedValues, item)}
              />
              <ChipSection
                label="Interests" emoji="🌱"
                items={savedInterests} selected={selectedInterests} color="rose"
                onToggle={item => toggleChip(selectedInterests, setSelectedInterests, item)}
              />
            </div>
          )}

          {/* 3. Why — chips inject labels here */}
          <div>
            <label htmlFor="goal-why" className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              Why does this matter?{' '}
              <span className="normal-case tracking-normal font-normal" style={{ color: 'rgba(255,255,255,0.25)' }}>optional</span>
            </label>
            <textarea
              ref={whyRef}
              id="goal-why"
              value={why}
              onChange={e => setWhy(e.target.value)}
              placeholder="Tap a chip above to get started, or write your own…"
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                caretColor: '#a78bfa',
                lineHeight: '1.7',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(168,85,247,0.5)'; e.target.style.background = 'rgba(168,85,247,0.07)'; }}
              onBlur={e =>  { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
            />
            <p className="text-right text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>{why.length}/500</p>
          </div>

          {/* 4. Activities */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Activities
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>optional — add later if you prefer</p>
              </div>
              <button
                type="button"
                onClick={addActivityDraft}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: 'rgba(168,85,247,0.15)', color: '#c4b5fd', border: '1px solid rgba(168,85,247,0.25)' }}
              >
                + Add
              </button>
            </div>

            <div className="space-y-2">
              {activityDrafts.map((draft, idx) => (
                <div key={draft.id} className="rounded-xl p-3 space-y-2"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono w-5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>{idx + 1}.</span>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={e => updateActivityDraft(draft.id, { title: e.target.value })}
                      placeholder="e.g. Join Tuesday night running group"
                      maxLength={140}
                      className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                    />
                    <button type="button" onClick={() => removeActivityDraft(draft.id)}
                      className="text-xs transition-all hover:text-red-400 flex-shrink-0 p-1"
                      style={{ color: 'rgba(255,255,255,0.3)' }}>✕</button>
                  </div>

                  {/* Include Today toggle */}
                  <div className="flex items-center gap-2 pl-7">
                    <button
                      type="button"
                      onClick={() => updateActivityDraft(draft.id, { includeToday: !draft.includeToday })}
                      className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0"
                      style={{ background: draft.includeToday ? '#10b981' : 'transparent', borderColor: draft.includeToday ? '#10b981' : 'rgba(255,255,255,0.2)' }}
                    >
                      {draft.includeToday && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Add to Life Inbox</span>
                  </div>

                  {/* Sub-activities */}
                  {draft.subActivities.map((sa, saIdx) => (
                    <div key={sa.id} className="flex items-center gap-2 pl-7">
                      <span className="text-[10px] font-mono w-5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        {idx + 1}{String.fromCharCode(97 + saIdx)}.
                      </span>
                      <input
                        type="text"
                        value={sa.title}
                        onChange={e => updateSubActivityDraft(draft.id, sa.id, { title: e.target.value })}
                        placeholder="Sub-activity…"
                        maxLength={140}
                        className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: '#fff' }}
                      />
                      <button type="button" onClick={() => updateSubActivityDraft(draft.id, sa.id, { includeToday: !sa.includeToday })}
                        className="w-3.5 h-3.5 rounded border flex items-center justify-center transition-all flex-shrink-0"
                        style={{ background: sa.includeToday ? '#10b981' : 'transparent', borderColor: sa.includeToday ? '#10b981' : 'rgba(255,255,255,0.2)' }}
                        title="Add to Life Inbox">
                        {sa.includeToday && <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </button>
                      <button type="button" onClick={() => removeSubActivityDraft(draft.id, sa.id)}
                        className="text-xs transition-all hover:text-red-400" style={{ color: 'rgba(255,255,255,0.2)' }}>✕</button>
                    </div>
                  ))}

                  <button type="button" onClick={() => addSubActivityDraft(draft.id)}
                    className="text-[10px] pl-7 transition-all hover:text-purple-300"
                    style={{ color: 'rgba(168,85,247,0.6)' }}>
                    + sub-activity
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1 pb-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
              style={{
                background: canSubmit
                  ? 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)'
                  : 'rgba(255,255,255,0.1)',
                color: '#fff',
                boxShadow: canSubmit ? '0 4px 20px rgba(124,58,237,0.4)' : 'none',
              }}
            >
              {saving ? 'Saving…' : activeActivityCount > 0 ? `Add Goal + ${activeActivityCount} Activities` : 'Add Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
