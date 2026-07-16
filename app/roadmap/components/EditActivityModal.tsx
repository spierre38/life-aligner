'use client';

/**
 * EditActivityModal.tsx — Edit an existing activity
 *
 * Allows the user to:
 *   - Rename the activity
 *   - Add, edit, remove sub-activities
 *   - Toggle sub-activity To-Do status
 */

import { useState, useEffect, useRef } from 'react';
import type { Activity, SubActivity } from '@/lib/roadmap-types';

interface SubDraft {
  id: string;
  title: string;
  includeToday: boolean;
  completed: boolean;
  isNew?: boolean; // true if added during this edit session
}

interface EditActivityModalProps {
  activity: Activity;
  onClose: () => void;
  onSave: (updated: Activity) => void;
}

export default function EditActivityModal({
  activity,
  onClose,
  onSave,
}: EditActivityModalProps) {
  const [title, setTitle] = useState(activity.title);
  const [subDrafts, setSubDrafts] = useState<SubDraft[]>(
    activity.subActivities.map(sa => ({
      id: sa.id,
      title: sa.title,
      includeToday: sa.includeToday,
      completed: sa.completed,
    }))
  );
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const newSubRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const addSub = () => {
    const newSub: SubDraft = {
      id: crypto.randomUUID(),
      title: '',
      includeToday: false,
      completed: false,
      isNew: true,
    };
    setSubDrafts(prev => [...prev, newSub]);
    // Focus the new input after render
    setTimeout(() => newSubRef.current?.focus(), 50);
  };

  const updateSub = (id: string, update: Partial<SubDraft>) => {
    setSubDrafts(prev => prev.map(s => s.id === id ? { ...s, ...update } : s));
  };

  const removeSub = (id: string) => {
    setSubDrafts(prev => prev.filter(s => s.id !== id));
  };

  const handleSave = () => {
    if (!title.trim()) return;
    setSaving(true);

    const now = new Date().toISOString();

    // Build updated sub-activities
    const updatedSubs: SubActivity[] = subDrafts
      .filter(s => s.title.trim())
      .map(s => {
        // Preserve existing sub-activity data if it existed before
        const existing = activity.subActivities.find(sa => sa.id === s.id);
        return {
          id: s.id,
          title: s.title.trim(),
          completed: s.completed,
          completedAt: existing?.completedAt,
          includeToday: s.includeToday,
          createdAt: existing?.createdAt || now,
        };
      });

    const updated: Activity = {
      ...activity,
      title: title.trim(),
      subActivities: updatedSubs,
      updatedAt: now,
    };

    onSave(updated);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <h2
            className="text-xl font-light"
            style={{ color: 'var(--color-text)', letterSpacing: '-0.02em' }}
          >
            Edit Activity
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Activity title */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Activity Name
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What are you working on?"
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition"
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          {/* Sub-activities */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label
                className="text-xs font-medium"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Sub-Activities ({subDrafts.length})
              </label>
              <button
                onClick={addSub}
                className="text-xs font-medium px-2.5 py-1 rounded-full transition hover:opacity-80"
                style={{
                  background: 'rgba(34,197,94,0.15)',
                  color: 'rgba(74,222,128,0.9)',
                  border: '1px solid rgba(34,197,94,0.2)',
                }}
              >
                + Add Sub-Activity
              </button>
            </div>

            {subDrafts.length === 0 ? (
              <div
                className="text-center py-8 rounded-xl"
                style={{ background: 'var(--color-surface-2)', border: '1px dashed var(--color-border)' }}
              >
                <p className="text-sm mb-1" style={{ color: 'var(--color-text-dim)' }}>
                  No sub-activities yet
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  Break this activity into smaller steps
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {subDrafts.map((sub, i) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-2 p-3 rounded-xl transition"
                    style={{
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {/* Completion toggle */}
                    <button
                      onClick={() => updateSub(sub.id, { completed: !sub.completed })}
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition"
                      style={{
                        border: sub.completed ? 'none' : '2px solid var(--color-border)',
                        background: sub.completed ? 'rgba(34,197,94,0.4)' : 'transparent',
                      }}
                    >
                      {sub.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    {/* Title input */}
                    <input
                      ref={i === subDrafts.length - 1 && sub.isNew ? newSubRef : undefined}
                      type="text"
                      value={sub.title}
                      onChange={e => updateSub(sub.id, { title: e.target.value })}
                      placeholder="Sub-activity name..."
                      className="flex-1 bg-transparent text-sm focus:outline-none min-w-0"
                      style={{
                        color: sub.completed ? 'var(--color-text-dim)' : 'var(--color-text)',
                        textDecoration: sub.completed ? 'line-through' : 'none',
                      }}
                    />

                    {/* To-Do toggle */}
                    <button
                      onClick={() => updateSub(sub.id, { includeToday: !sub.includeToday })}
                      className="text-[10px] px-2 py-1 rounded-full transition flex-shrink-0"
                      style={{
                        background: sub.includeToday ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                        color: sub.includeToday ? 'rgba(74,222,128,0.9)' : 'var(--color-text-dim)',
                        border: sub.includeToday ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--color-border)',
                      }}
                      title={sub.includeToday ? 'On To-Do list' : 'Add to To-Do'}
                    >
                      📋 {sub.includeToday ? 'On list' : 'To-Do'}
                    </button>

                    {/* Remove */}
                    <button
                      onClick={() => removeSub(sub.id)}
                      className="p-1 rounded transition hover:opacity-70 flex-shrink-0"
                      style={{ color: 'rgba(239,68,68,0.6)' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex gap-3"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-semibold text-sm transition hover:opacity-70"
            style={{
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
              background: 'var(--color-surface-2)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex-1 py-3 rounded-xl font-semibold text-sm transition active:scale-[0.98]"
            style={{
              background: !title.trim() ? 'var(--color-surface-2)' : 'var(--color-text)',
              color: !title.trim() ? 'var(--color-text-dim)' : 'var(--color-bg)',
              cursor: !title.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
