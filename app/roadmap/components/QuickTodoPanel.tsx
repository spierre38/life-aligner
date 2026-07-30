'use client';

/**
 * QuickTodoPanel.tsx — Floating mini-panel for roadmap page
 *
 * Shows today's to-do tasks in a slide-up panel without leaving the roadmap.
 * Triggered by a floating "☑ Today" button in the bottom-right corner.
 */

import { useState, useEffect, useCallback } from 'react';
import { getAllTodos, toggleTodoCompletion } from '@/lib/todos';
import type { TodoItem } from '@/lib/todos';

export default function QuickTodoPanel() {
  const [open, setOpen] = useState(false);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTodos = useCallback(async () => {
    setLoading(true);
    const result = await getAllTodos();
    if (result.data) {
      // Only show non-hidden, non-completed tasks
      setTodos(result.data.filter(t => !t.hidden && !t.completed));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) loadTodos();
  }, [open, loadTodos]);

  const handleToggle = async (todo: TodoItem) => {
    await toggleTodoCompletion(todo.id, todo.source);
    // Remove from list with animation feel
    setTodos(prev => prev.filter(t => t.id !== todo.id));
  };

  const completedCount = todos.length;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold text-sm shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          background: open
            ? 'rgba(99,102,241,0.9)'
            : 'rgba(15,23,42,0.85)',
          color: 'white',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        {open ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </>
        ) : (
          <>
            ☑️ Today
            {completedCount > 0 && (
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: 'rgba(239,68,68,0.9)' }}
              >
                {completedCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Slide-up Panel */}
      <div
        className="fixed bottom-20 right-6 z-40 w-80 max-h-[60vh] rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: 'var(--color-surface, #0f172a)',
          border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          transform: open ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.95)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.1))' }}
        >
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text, white)' }}>
            📋 Today&apos;s Tasks
          </h3>
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(99,102,241,0.15)',
              color: '#818cf8',
            }}
          >
            {todos.length} remaining
          </span>
        </div>

        {/* Task List */}
        <div className="overflow-y-auto max-h-[calc(60vh-48px)] px-3 py-2 space-y-1">
          {loading ? (
            <div className="py-8 text-center">
              <div className="text-2xl animate-pulse">⏳</div>
            </div>
          ) : todos.length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-sm" style={{ color: 'var(--color-text-muted, #94a3b8)' }}>
                All clear for today!
              </p>
            </div>
          ) : (
            todos.map(todo => (
              <div
                key={todo.id}
                className="flex items-start gap-2.5 p-2.5 rounded-xl transition-all hover:opacity-80 cursor-pointer group"
                style={{
                  background: 'var(--color-surface-2, rgba(255,255,255,0.03))',
                }}
                onClick={() => handleToggle(todo)}
              >
                {/* Checkbox */}
                <div
                  className="w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all group-hover:border-emerald-400"
                  style={{
                    borderColor: 'var(--color-border, rgba(255,255,255,0.2))',
                  }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium leading-snug"
                    style={{ color: 'var(--color-text, white)' }}
                  >
                    {todo.taskType === 'daily' && (
                      <span className="opacity-50 mr-1">🔁</span>
                    )}
                    {todo.text}
                  </p>
                  {todo.goal_title && (
                    <p
                      className="text-[10px] mt-0.5 truncate"
                      style={{ color: 'var(--color-text-muted, #64748b)' }}
                    >
                      ↗ {todo.goal_title}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
