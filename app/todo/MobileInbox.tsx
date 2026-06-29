'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AuthNavbar from '@/app/components/AuthNavbar';
import { supabase } from '@/lib/supabase';
import {
    getAllTodos, addManualTodo, deleteManualTodo, toggleTodoCompletion,
    toggleSubGoalCompletion, addSubGoal, rescheduleTodoBucket,
    type TodoItem, type DeadlineBucket, type UrgencyLevel,
    URGENCY_COLOR, URGENCY_LABEL, URGENCY_ORDER, bucketToDate, computeUrgency,
} from '@/lib/todos';
import { showToast } from '@/lib/toast';
import { usePullToRefresh } from '@/lib/hooks/usePullToRefresh';

// ─── Life Category helpers ─────────────────────────────────────────────────────

const CATEGORY_EMOJIS: Record<string, string> = {
    Health: '💪', Relationships: '❤️', Career: '💼', Financial: '💰',
    Community: '🤝', Purpose: '🌟', 'Personal Growth': '🌱',
    Spirituality: '🕊️', Recreation: '🎯', Environment: '🌿',
};

function categoryEmoji(cat: string): string {
    return CATEGORY_EMOJIS[cat] ?? '📌';
}

// ─── Deadline bucket selector ──────────────────────────────────────────────────

const BUCKETS: { value: DeadlineBucket; label: string; color: string }[] = [
    { value: 'today',     label: 'Today',     color: '#f97316' },
    { value: 'tomorrow',  label: 'Tomorrow',  color: '#eab308' },
    { value: 'this_week', label: 'This Week', color: '#6366f1' },
    { value: 'someday',   label: 'Someday',   color: '#94a3b8' },
];

// ─── Add Task Modal ────────────────────────────────────────────────────────────

function AddTaskModal({
    onClose,
    onAdd,
    categories,
}: {
    onClose: () => void;
    onAdd: (text: string, bucket: DeadlineBucket, category?: string) => Promise<void>;
    categories: string[];
}) {
    const [text, setText] = useState('');
    const [bucket, setBucket] = useState<DeadlineBucket>('today');
    const [category, setCategory] = useState<string>(categories[0] ?? '');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        setSaving(true);
        await onAdd(text.trim(), bucket, category || undefined);
        setSaving(false);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex flex-col sm:items-center sm:justify-center"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
        >
            {/* ── Mobile: full-screen form ─────────────────────────────── */}
            <div
                className="w-full h-full sm:h-auto sm:max-w-md sm:rounded-3xl sm:max-h-[90vh] flex flex-col"
                style={{
                    background: 'var(--color-surface)',
                    borderBottom: 'none',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Top bar — Cancel · Title · Add  (always visible, never under keyboard) */}
                <div
                    className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                    style={{
                        borderBottom: '1px solid var(--color-border)',
                        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm font-medium px-1"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        Cancel
                    </button>
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        Add to Life Inbox
                    </h2>
                    <button
                        type="submit"
                        form="add-task-form"
                        disabled={!text.trim() || saving}
                        className="text-sm font-semibold px-1 transition-opacity"
                        style={{
                            color: text.trim() ? '#818cf8' : 'rgba(99,102,241,0.3)',
                        }}
                    >
                        {saving ? 'Adding…' : 'Add'}
                    </button>
                </div>

                {/* Scrollable form content */}
                <div className="flex-1 overflow-y-auto px-5 pt-5 pb-8 sm:px-6">
                    <form id="add-task-form" onSubmit={handleSubmit} className="space-y-5">
                        {/* Task text */}
                        <textarea
                            autoFocus
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="What needs to be done? e.g. Pay car insurance"
                            rows={2}
                            className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
                            style={{
                                background: 'var(--color-surface-2)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                            }}
                        />

                        {/* Life Category */}
                        {categories.length > 0 && (
                            <div>
                                <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
                                    Life Category
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setCategory(cat)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                            style={{
                                                background: category === cat ? 'rgba(99,102,241,0.2)' : 'var(--color-surface-2)',
                                                border: `1px solid ${category === cat ? 'rgba(99,102,241,0.5)' : 'var(--color-border)'}`,
                                                color: category === cat ? '#818cf8' : 'var(--color-text-muted)',
                                            }}
                                        >
                                            {categoryEmoji(cat)} {cat}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setCategory('')}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                        style={{
                                            background: category === '' ? 'rgba(99,102,241,0.2)' : 'var(--color-surface-2)',
                                            border: `1px solid ${category === '' ? 'rgba(99,102,241,0.5)' : 'var(--color-border)'}`,
                                            color: category === '' ? '#818cf8' : 'var(--color-text-muted)',
                                        }}
                                    >
                                        📋 General
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Deadline bucket */}
                        <div>
                            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--color-text-muted)' }}>
                                When
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {BUCKETS.map(b => (
                                    <button
                                        key={b.value}
                                        type="button"
                                        onClick={() => setBucket(b.value)}
                                        className="py-2 rounded-xl text-xs font-semibold transition-all"
                                        style={{
                                            background: bucket === b.value ? `${b.color}22` : 'var(--color-surface-2)',
                                            border: `1px solid ${bucket === b.value ? b.color + '66' : 'var(--color-border)'}`,
                                            color: bucket === b.value ? b.color : 'var(--color-text-muted)',
                                        }}
                                    >
                                        {b.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ─── Urgency Chip ──────────────────────────────────────────────────────────────

function UrgencyChip({ urgency }: { urgency: UrgencyLevel }) {
    const c = URGENCY_COLOR[urgency];
    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ background: c.bg, color: c.text }}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
            {URGENCY_LABEL[urgency]}
        </span>
    );
}

// ─── Task Row (swipeable on mobile, static on desktop) ───────────────────────

function TaskRow({
    todo,
    onToggle,
    onDelete,
    onReschedule,
}: {
    todo: TodoItem;
    onToggle: (t: TodoItem) => void;
    onDelete: (t: TodoItem) => void;
    onReschedule: (t: TodoItem, bucket: DeadlineBucket) => void;
}) {
    const [swipeX, setSwipeX] = useState(0);
    const [swiping, setSwiping] = useState(false);
    const [showReschedule, setShowReschedule] = useState(false);
    const startX = useRef(0);
    const THRESHOLD = 80;

    const haptic = (ms = 10) => {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(ms);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        setSwiping(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!swiping) return;
        const dx = e.touches[0].clientX - startX.current;
        setSwipeX(Math.max(-120, Math.min(120, dx)));
    };

    const handleTouchEnd = () => {
        setSwiping(false);
        if (swipeX > THRESHOLD) {
            haptic(12);
            onToggle(todo);
        } else if (swipeX < -THRESHOLD && todo.source === 'manual') {
            haptic(20);
            onDelete(todo);
        }
        setSwipeX(0);
    };

    const swipeProgress = Math.abs(swipeX) / THRESHOLD;
    const isCompleteSwipe = swipeX > 20;
    const isDeleteSwipe   = swipeX < -20;

    return (
        <div className="relative overflow-hidden rounded-2xl">
            {/* Swipe right: complete (green) */}
            {isCompleteSwipe && (
                <div
                    className="absolute inset-0 flex items-center pl-5"
                    style={{ background: `rgba(0,200,100,${Math.min(swipeProgress * 0.8, 0.25)})`, borderRadius: '1rem' }}
                >
                    <svg className="w-5 h-5" fill="none" stroke="rgba(0,200,100,0.9)" strokeWidth={2.5} viewBox="0 0 24 24"
                        style={{ opacity: Math.min(swipeProgress, 1) }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}
            {/* Swipe left: delete (red) */}
            {isDeleteSwipe && todo.source === 'manual' && (
                <div
                    className="absolute inset-0 flex items-center justify-end pr-5"
                    style={{ background: `rgba(239,68,68,${Math.min(swipeProgress * 0.8, 0.25)})`, borderRadius: '1rem' }}
                >
                    <svg className="w-5 h-5" fill="none" stroke="rgba(239,68,68,0.9)" strokeWidth={2} viewBox="0 0 24 24"
                        style={{ opacity: Math.min(swipeProgress, 1) }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1m-6 0h6" />
                    </svg>
                </div>
            )}

            {/* Card content */}
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="p-4"
                style={{
                    background: todo.completed ? 'rgba(255,255,255,0.02)' : 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '1rem',
                    opacity: todo.completed ? 0.55 : 1,
                    transform: `translateX(${swipeX}px)`,
                    transition: swiping ? 'none' : 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    willChange: 'transform',
                    touchAction: 'pan-y',
                }}
            >
                <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                        onClick={() => { haptic(10); onToggle(todo); }}
                        className="flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 transition-all duration-200 flex items-center justify-center"
                        style={{
                            borderColor: todo.completed ? 'rgba(0,200,100,0.6)' : 'var(--color-border)',
                            background: todo.completed ? 'rgba(0,200,100,0.2)' : 'transparent',
                        }}
                    >
                        {todo.completed && (
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(0,200,100,0.9)' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                                className="text-sm font-medium"
                                style={{
                                    color: 'var(--color-text)',
                                    textDecoration: todo.completed ? 'line-through' : 'none',
                                }}
                            >
                                {todo.text}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {todo.urgency && !todo.completed && (
                                <button onClick={() => setShowReschedule(s => !s)}>
                                    <UrgencyChip urgency={todo.urgency} />
                                </button>
                            )}
                            {todo.goal_title && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-dim)' }}>
                                    ↗ {todo.goal_title}
                                </span>
                            )}
                        </div>

                        {/* Inline reschedule picker */}
                        {showReschedule && !todo.completed && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {BUCKETS.map(b => (
                                    <button
                                        key={b.value}
                                        onClick={() => { onReschedule(todo, b.value); setShowReschedule(false); }}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95"
                                        style={{
                                            background: (todo.urgency === b.value || todo.urgency === 'overdue' && b.value === 'today') ? `${b.color}33` : 'var(--color-surface-2)',
                                            border: `1px solid ${b.color}44`,
                                            color: b.color,
                                        }}
                                    >
                                        {b.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        <p className="text-[10px] mt-1.5 md:hidden" style={{ color: 'var(--color-text-dim)' }}>
                            Swipe → complete · ← delete
                        </p>
                    </div>

                    {/* Desktop delete button */}
                    {todo.source === 'manual' && (
                        <button
                            onClick={() => onDelete(todo)}
                            className="flex-shrink-0 w-6 h-6 rounded-full items-center justify-center transition-all opacity-20 hover:opacity-70 hidden md:flex"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}


// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MobileInbox() {
    const router = useRouter();
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeFilter, setActiveFilter] = useState<DeadlineBucket | 'all'>('all');

    // Load user's life categories from workbook
    const loadCategories = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
            .from('workbook_entries')
            .select('content')
            .eq('user_id', user.id)
            .eq('category', 'life_categories')
            .maybeSingle();
        if (data?.content) {
            const content = data.content as any;
            const cats: string[] = content.selectedCategories ?? [];
            setCategories(cats);
        }
    }, []);

    const loadTodos = useCallback(async () => {
        setLoading(true);
        const { data, error } = await getAllTodos();
        if (error) { showToast.error('Failed to load tasks'); }
        else { setTodos(data ?? []); }
        setLoading(false);
    }, []);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }
            await Promise.all([loadCategories(), loadTodos()]);
        };
        init();
    }, [loadCategories, loadTodos, router]);

    const handleAdd = async (text: string, bucket: DeadlineBucket, category?: string) => {
        const { error } = await addManualTodo(text, { bucket, category });
        if (error) { showToast.error('Failed to add task'); }
        else { showToast.success('Task added!'); await loadTodos(); }
    };

    const handleToggle = async (todo: TodoItem) => {
        await toggleTodoCompletion(todo.id, todo.source);
        await loadTodos();
    };

    const handleDelete = async (todo: TodoItem) => {
        await deleteManualTodo(todo.id);
        showToast.success('Task removed');
        await loadTodos();
    };

    const handleReschedule = async (todo: TodoItem, bucket: DeadlineBucket) => {
        const { error } = await rescheduleTodoBucket(todo.id, bucket);
        if (error) { showToast.error('Failed to reschedule'); }
        else { showToast.success(`Moved to ${bucket.replace('_', ' ')}`); await loadTodos(); }
    };

    // Group todos by category, filtered by bucket
    const filtered = todos.filter(t => {
        if (activeFilter === 'all') return true;
        const bucket: DeadlineBucket = t.urgency === 'overdue' ? 'today'
            : t.urgency === 'today'     ? 'today'
            : t.urgency === 'tomorrow'  ? 'tomorrow'
            : t.urgency === 'this_week' ? 'this_week'
            : 'someday';
        return bucket === activeFilter;
    });

    // Build category groups
    const allCats = Array.from(new Set([
        ...categories,
        ...filtered.filter(t => t.category).map(t => t.category!),
    ]));
    const uncategorized = filtered.filter(t => !t.category);

    // Stats
    const urgentCount  = todos.filter(t => !t.completed && (t.urgency === 'overdue' || t.urgency === 'today')).length;
    const totalPending = todos.filter(t => !t.completed).length;
    const completedToday = todos.filter(t => t.completed && t.completed_at?.startsWith(new Date().toISOString().split('T')[0])).length;

    // Pull to refresh
    const { pullDistance, isRefreshing, containerProps } = usePullToRefresh({
        onRefresh: loadTodos,
        threshold: 72,
    });

    return (
        <>
            <AuthNavbar />
            <div
                className="min-h-screen pt-navbar"
                style={{ background: 'var(--color-bg)' }}
                {...containerProps}
            >
                {/* Pull-to-refresh indicator */}
                {(pullDistance > 0 || isRefreshing) && (
                    <div
                        className="flex items-center justify-center overflow-hidden transition-all duration-200"
                        style={{ height: `${pullDistance}px`, maxHeight: '72px' }}
                    >
                        <div
                            className="w-6 h-6 rounded-full"
                            style={{
                                border: '2px solid var(--color-border)',
                                borderTopColor: isRefreshing ? '#6366f1' : `rgba(99,102,241,${pullDistance / 72})`,
                                animation: isRefreshing ? 'spin 0.7s linear infinite' : 'none',
                                transform: isRefreshing ? undefined : `rotate(${(pullDistance / 72) * 270}deg)`,
                            }}
                        />
                    </div>
                )}
                <div className="max-w-2xl mx-auto px-4 py-8">

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-light mb-1" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                            Life Inbox
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
                            {totalPending} pending · {completedToday} done today
                            {urgentCount > 0 && <span style={{ color: '#f97316' }}> · {urgentCount} need attention</span>}
                        </p>
                    </div>

                    {/* Bucket filter tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                        {(['all', 'today', 'tomorrow', 'this_week', 'someday'] as const).map(f => {
                            const isActive = activeFilter === f;
                            const label = f === 'all' ? 'All' : URGENCY_LABEL[f === 'today' ? 'today' : f === 'tomorrow' ? 'tomorrow' : f === 'this_week' ? 'this_week' : 'someday'];
                            const count = f === 'all' ? todos.filter(t => !t.completed).length
                                : todos.filter(t => !t.completed && (t.urgency === f || (f === 'today' && t.urgency === 'overdue'))).length;
                            return (
                                <button
                                    key={f}
                                    onClick={() => setActiveFilter(f)}
                                    className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                                    style={{
                                        background: isActive ? 'rgba(99,102,241,0.2)' : 'var(--color-surface)',
                                        border: `1px solid ${isActive ? 'rgba(99,102,241,0.4)' : 'var(--color-border)'}`,
                                        color: isActive ? '#818cf8' : 'var(--color-text-muted)',
                                    }}
                                >
                                    {label} {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid var(--color-border)', borderTopColor: '#6366f1' }} />
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && filtered.length === 0 && (
                        <div className="text-center py-20">
                            <div className="text-5xl mb-4">✨</div>
                            <p className="text-base font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                                {activeFilter === 'all' ? 'Inbox zero!' : `Nothing ${activeFilter === 'today' ? 'due today' : activeFilter === 'tomorrow' ? 'due tomorrow' : activeFilter === 'this_week' ? 'this week' : 'in someday'}`}
                            </p>
                            <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>Tap + to add something</p>
                        </div>
                    )}

                    {/* Category groups */}
                    {!loading && allCats.map(cat => {
                        const catTodos = filtered.filter(t => t.category === cat);
                        if (catTodos.length === 0) return null;
                        const pending = catTodos.filter(t => !t.completed);
                        const done    = catTodos.filter(t => t.completed);
                        const sorted  = [
                            ...pending.sort((a, b) => URGENCY_ORDER[a.urgency ?? 'someday'] - URGENCY_ORDER[b.urgency ?? 'someday']),
                            ...done,
                        ];
                        return (
                            <div key={cat} className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">{categoryEmoji(cat)}</span>
                                    <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>
                                        {cat}
                                    </h2>
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-surface)', color: 'var(--color-text-dim)', border: '1px solid var(--color-border)' }}>
                                        {pending.length}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {sorted.map(todo => (
                                        <TaskRow key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} onReschedule={handleReschedule} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Uncategorized */}
                    {!loading && uncategorized.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg">📋</span>
                                <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>
                                    General
                                </h2>
                            </div>
                            <div className="space-y-2">
                                {uncategorized.map(todo => (
                                    <TaskRow key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} onReschedule={handleReschedule} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Spacer for FAB */}
                    <div className="h-24" />
                </div>

                {/* Floating Add Button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    id="life-inbox-add-btn"
                    className="fixed right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-95"
                    style={{
                        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        boxShadow: '0 8px 32px rgba(99,102,241,0.5)',
                    }}
                    aria-label="Add task"
                >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                </button>

                {/* Add Task Modal */}
                {showAddModal && (
                    <AddTaskModal
                        onClose={() => setShowAddModal(false)}
                        onAdd={handleAdd}
                        categories={categories}
                    />
                )}
            </div>
        </>
    );
}