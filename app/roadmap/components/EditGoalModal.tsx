'use client';

/**
 * EditGoalModal.tsx — Themed rewrite
 *
 * Matches AddGoalModal's dark/themed design language.
 * Uses var(--color-*) tokens so it respects dark/light mode.
 */

import { useState, useEffect, useRef } from 'react';
import type { Goal } from '@/lib/roadmap-types';

interface EditGoalModalProps {
  goal: Goal;
  allCategories: string[];
  savedValues: string[];
  savedInterests: string[];
  onClose: () => void;
  onSave: (updated: Goal) => void;
  onDelete: (goalId: string) => void;
}

// ─── Chip Picker ──────────────────────────────────────────────────────────────

function ChipPicker({
  label,
  labelColor,
  icon,
  items,
  selected,
  onToggle,
  accentStyle,
}: {
  label: string;
  labelColor: string;
  icon: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  accentStyle: { bg: string; border: string; text: string };
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest mb-2.5 flex items-center gap-2"
        style={{ color: labelColor }}>
        <span>{icon}</span>{label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map(item => {
          const active = selected.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 hover:scale-105 active:scale-95"
              style={
                active
                  ? { background: accentStyle.bg, border: `1px solid ${accentStyle.border}`, color: accentStyle.text }
                  : { background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }
              }
            >
              {item}
            </button>
          );
        })}
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
  const [confirmDelete, setConfirmDelete] = useState(false);
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

  const inputStyle = {
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Edit goal"
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
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.12) 50%, rgba(244,63,94,0.08) 100%)',
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
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(168,85,247,0.8)' }}>
              Edit Goal
            </p>
            <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Update your goal</h2>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="text-sm font-semibold transition-opacity"
            style={{ color: canSubmit ? '#a78bfa' : 'var(--color-text-dim)', opacity: canSubmit ? 1 : 0.4 }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* ── Scrollable form ── */}
        <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-5 overflow-y-auto flex-1">

          {/* Goal title */}
          <div>
            <label htmlFor="edit-goal-title" className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'var(--color-text-dim)' }}>
              Goal title <span className="text-red-400 normal-case tracking-normal font-normal">required</span>
            </label>
            <input
              ref={titleRef}
              id="edit-goal-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={140}
              required
              placeholder="Start with an action (e.g. 'Run a marathon')"
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition"
              style={inputStyle}
            />
            <p className="text-[10px] mt-1 text-right" style={{ color: 'var(--color-text-dim)' }}>{title.length}/140</p>
          </div>

          {/* Why */}
          <div>
            <label htmlFor="edit-goal-why" className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'var(--color-text-dim)' }}>
              Why does this matter? <span className="normal-case tracking-normal font-normal" style={{ color: 'var(--color-text-dim)' }}>(optional)</span>
            </label>
            <textarea
              id="edit-goal-why"
              value={why}
              onChange={e => setWhy(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="What will this change in your life?"
              className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none transition"
              style={inputStyle}
            />
          </div>

          {/* LifeFrame connections */}
          <div className="space-y-4 pt-1">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-dim)' }}>
              Connect to your LifeFrame
            </p>
            <ChipPicker
              label="Life Categories"
              labelColor="rgba(168,85,247,0.8)"
              icon="■"
              items={allCategories}
              selected={selectedCategories}
              onToggle={item => toggle(selectedCategories, setSelectedCategories, item)}
              accentStyle={{ bg: 'rgba(168,85,247,0.2)', border: 'rgba(168,85,247,0.5)', text: '#c4b5fd' }}
            />
            <ChipPicker
              label="Values"
              labelColor="rgba(96,165,250,0.8)"
              icon="◆"
              items={savedValues}
              selected={selectedValues}
              onToggle={item => toggle(selectedValues, setSelectedValues, item)}
              accentStyle={{ bg: 'rgba(96,165,250,0.2)', border: 'rgba(96,165,250,0.5)', text: '#93c5fd' }}
            />
            <ChipPicker
              label="Interests"
              labelColor="rgba(251,113,133,0.8)"
              icon="♡"
              items={savedInterests}
              selected={selectedInterests}
              onToggle={item => toggle(selectedInterests, setSelectedInterests, item)}
              accentStyle={{ bg: 'rgba(251,113,133,0.2)', border: 'rgba(251,113,133,0.5)', text: '#fda4af' }}
            />
          </div>

          {/* Save button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-30"
            style={{
              background: canSubmit ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'var(--color-surface-2)',
              color: '#fff',
              boxShadow: canSubmit ? '0 4px 20px rgba(168,85,247,0.3)' : 'none',
            }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>

          {/* Delete */}
          <div className="text-center pb-2">
            {confirmDelete ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>Are you sure?</span>
                <button
                  type="button"
                  onClick={() => onDelete(goal.id)}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 transition"
                >
                  Yes, delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs transition"
                  style={{ color: 'var(--color-text-dim)' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-xs transition hover:opacity-80"
                style={{ color: 'rgba(248,113,113,0.6)' }}
              >
                Delete this goal
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
