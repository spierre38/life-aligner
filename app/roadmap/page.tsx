'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';
import { SkeletonCard } from '@/app/components/Skeleton';
import { AddToTodoButton } from '@/app/components/AddToTodoButton';
import { useToast } from '@/app/components/Toast';
import { AddGoalModal } from './components/AddGoalModal';
import { ArchiveStorybook } from './components/ArchiveStorybook';

// ─── Category colour palette ─────────────────────────────────────────────────
// Soft pastels that feel cohesive with the dashboard.

const CATEGORY_COLORS: Record<string, string> = {
    Health:        '#86efac',
    Relationships: '#f9a8d4',
    Career:        '#93c5fd',
    Social:        '#c4b5fd',
    Learning:      '#fde68a',
    Finance:       '#6ee7b7',
    Spiritual:     '#a5f3fc',
    Creative:      '#fdba74',
    Purpose:       '#e9d5ff',
};
const FALLBACK_COLORS = ['#93c5fd', '#86efac', '#f9a8d4', '#fde68a', '#c4b5fd', '#fdba74', '#a5f3fc'];

function categoryColor(name: string, index: number) {
    return CATEGORY_COLORS[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityLog = {
    date: string;
    feeling: 'great' | 'okay' | 'hard';
    note: string;
    logged_at: string;
};

export type Activity = {
    id: string;
    text: string;
    completed_dates: string[];
    logs: ActivityLog[];
    notes: string;
};

export type RoadmapItem = {
    id: string;
    category: string;
    type: 'goal' | 'behavior_change';
    title: string;
    why: string;
    activities: Activity[];
    quarter: string;
    reflections: any[];
    archived: boolean;
    archived_date?: string;
    connected_values?: string[];
    connected_purpose?: string[];
};

// ─── Goal Row card ────────────────────────────────────────────────────────────

function GoalCard({
    item,
    color,
    onOpen,
}: {
    item: RoadmapItem;
    color: string;
    onOpen: (item: RoadmapItem) => void;
}) {
    const total = item.activities.length;
    const done = item.activities.filter(a => a.completed_dates.length > 0).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    return (
        <button
            onClick={() => onOpen(item)}
            className="w-full flex items-center gap-4 bg-white border border-gray-200 rounded-2xl overflow-hidden text-left hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
            {/* Colour accent strip */}
            <div className="w-1 self-stretch flex-shrink-0 rounded-l-2xl" style={{ backgroundColor: color }} />

            <div className="flex-1 min-w-0 py-4 pr-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        item.type === 'behavior_change'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                    }`}>
                        {item.type === 'behavior_change' ? 'Habit' : 'Goal'}
                    </span>
                    {pct === 100 && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            Complete
                        </span>
                    )}
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate mb-0.5">{item.title}</p>
                {item.why && (
                    <p className="text-xs text-gray-400 truncate">{item.why}</p>
                )}

                {/* Progress bar */}
                {total > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#22c55e' : color }}
                            />
                        </div>
                        <span className="text-xs text-gray-400 w-10 text-right">{done}/{total}</span>
                    </div>
                )}
            </div>

            <div className="pr-4 flex-shrink-0">
                <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </button>
    );
}

// ─── Goal Detail Modal ────────────────────────────────────────────────────────

function GoalDetailModal({
    item,
    color,
    userId,
    onClose,
    onUpdate,
    onArchive,
}: {
    item: RoadmapItem;
    color: string;
    userId: string;
    onClose: () => void;
    onUpdate: (updated: RoadmapItem) => void;
    onArchive: (id: string) => void;
}) {
    const today = new Date().toISOString().split('T')[0];

    const toggleActivity = (activityId: string) => {
        const updated: RoadmapItem = {
            ...item,
            activities: item.activities.map(a => {
                if (a.id !== activityId) return a;
                const alreadyDone = a.completed_dates.includes(today);
                return {
                    ...a,
                    completed_dates: alreadyDone
                        ? a.completed_dates.filter(d => d !== today)
                        : [...a.completed_dates, today],
                    logs: alreadyDone ? a.logs : [
                        ...a.logs,
                        { date: today, feeling: 'okay' as const, note: '', logged_at: new Date().toISOString() }
                    ],
                };
            }),
        };
        onUpdate(updated);
    };

    const total = item.activities.length;
    const done = item.activities.filter(a => a.completed_dates.includes(today)).length;
    const allDone = item.activities.filter(a => a.completed_dates.length > 0).length;
    const pct = total > 0 ? Math.round((allDone / total) * 100) : 0;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

                {/* Coloured header strip */}
                <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-gray-400">{item.category}</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    item.type === 'behavior_change' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {item.type === 'behavior_change' ? 'Habit' : 'Goal'}
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">{item.title}</h2>
                            {item.why && <p className="text-sm text-gray-400 mt-0.5 italic">{item.why}</p>}
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1 flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {total > 0 && (
                        <div className="mt-4 flex items-center gap-3">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#22c55e' : color }}
                                />
                            </div>
                            <span className="text-xs font-semibold text-gray-400 w-10 text-right">{pct}%</span>
                        </div>
                    )}
                </div>

                {/* Activities */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Activities — {done}/{total} done today
                    </h3>
                    <div className="space-y-2">
                        {item.activities.map(activity => {
                            const doneToday = activity.completed_dates.includes(today);
                            return (
                                <div
                                    key={activity.id}
                                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                                        doneToday ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                    }`}
                                >
                                    <button
                                        onClick={() => toggleActivity(activity.id)}
                                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                            doneToday ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white hover:border-gray-500'
                                        }`}
                                    >
                                        {doneToday && (
                                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                    <p className={`flex-1 text-sm font-medium ${doneToday ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                        {activity.text}
                                    </p>
                                    <AddToTodoButton variant="compact" />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-3 flex gap-3 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => { onArchive(item.id); onClose(); }}
                        className="flex-1 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition"
                    >
                        Mark as Complete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Category Section ─────────────────────────────────────────────────────────

function CategorySection({
    categoryName,
    color,
    items,
    onOpenGoal,
    onAddGoal,
}: {
    categoryName: string;
    color: string;
    items: RoadmapItem[];
    onOpenGoal: (item: RoadmapItem) => void;
    onAddGoal: (category: string) => void;
}) {
    const done = items.filter(i => i.activities.length > 0 && i.activities.every(a => a.completed_dates.length > 0)).length;

    return (
        <div>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm font-bold text-gray-700">{categoryName}</span>
                {done > 0 && (
                    <span className="text-xs text-gray-400">{done}/{items.length} complete</span>
                )}
                <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="space-y-2 ml-6 mb-3">
                {items.map(item => (
                    <GoalCard key={item.id} item={item} color={color} onOpen={onOpenGoal} />
                ))}
            </div>

            <button
                onClick={() => onAddGoal(categoryName)}
                className="ml-6 text-sm text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1 py-1 transition"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add goal to {categoryName}
            </button>
        </div>
    );
}

// ─── Stats pill ───────────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3.5 py-2 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-xs font-semibold text-gray-700">{label}</span>
            <span className="text-xs font-bold text-gray-400">{value}</span>
        </div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your roadmap is empty</h2>
            <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8">
                Add your first goal and start turning your LifeFrame into daily action.
            </p>
            <button
                onClick={onAdd}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition"
            >
                Add your first goal →
            </button>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RoadmapPage() {
    const router = useRouter();
    const { showToast } = useToast();

    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<string[]>([]);
    const [items, setItems] = useState<RoadmapItem[]>([]);

    const [addGoalOpen, setAddGoalOpen] = useState(false);
    const [addGoalCategory, setAddGoalCategory] = useState<string | undefined>(undefined);
    const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null);
    const [showArchive, setShowArchive] = useState(false);

    // ── Load ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) { router.push('/login'); return; }
                if (!mounted) return;
                setUserId(userWithProfile.user.id);

                const { data: worksheets } = await supabase
                    .from('workbook_entries')
                    .select('category')
                    .eq('user_id', userWithProfile.user.id)
                    .in('category', ['values', 'interests', 'life_categories']);

                const hasAll = ['values', 'interests', 'life_categories'].every(
                    cat => worksheets?.some(w => w.category === cat)
                );
                if (!hasAll) { router.push('/workbook/lifeframe'); return; }

                const [catResult, roadmapResult] = await Promise.all([
                    supabase.from('workbook_entries').select('content')
                        .eq('user_id', userWithProfile.user.id)
                        .eq('category', 'life_categories').single(),
                    supabase.from('workbook_entries').select('content')
                        .eq('user_id', userWithProfile.user.id)
                        .eq('category', 'roadmap').single(),
                ]);

                if (!mounted) return;

                const cats: string[] = (catResult.data?.content?.categories ?? [])
                    .map((c: any) => (typeof c === 'string' ? c : c?.name))
                    .filter(Boolean);
                setCategories(cats);

                const rawItems: RoadmapItem[] = (roadmapResult.data?.content?.items ?? []).map((item: RoadmapItem) => ({
                    ...item,
                    activities: item.activities.map((a: any) => ({ ...a, logs: a.logs ?? [] })),
                }));
                setItems(rawItems);

            } catch (err) {
                console.error('Roadmap load error:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => { mounted = false; };
    }, [router]);

    // ── Persist ──────────────────────────────────────────────────────────────
    const persist = async (next: RoadmapItem[]) => {
        if (!userId) return;
        await supabase.from('workbook_entries').upsert(
            { user_id: userId, category: 'roadmap', content: { items: next, updated_at: new Date().toISOString() } },
            { onConflict: 'user_id,category' }
        );
    };

    // ── Add ───────────────────────────────────────────────────────────────────
    const handleAddGoal = async (goal: {
        category: string; type: 'goal' | 'behavior_change';
        title: string; why: string; activities: string[];
    }) => {
        const newItem: RoadmapItem = {
            id: crypto.randomUUID(), category: goal.category, type: goal.type,
            title: goal.title, why: goal.why,
            activities: goal.activities.map(text => ({
                id: crypto.randomUUID(), text, completed_dates: [], logs: [], notes: '',
            })),
            quarter: (() => { const n = new Date(); return `Q${Math.floor(n.getMonth() / 3) + 1} ${n.getFullYear()}`; })(),
            reflections: [], archived: false,
        };
        const next = [...items, newItem];
        setItems(next);
        await persist(next);
        showToast('Goal added!', 'success');
    };

    // ── Update ────────────────────────────────────────────────────────────────
    const handleUpdate = async (updated: RoadmapItem) => {
        const next = items.map(i => i.id === updated.id ? updated : i);
        setItems(next);
        setSelectedItem(updated);
        await persist(next);
    };

    // ── Archive ───────────────────────────────────────────────────────────────
    const handleArchive = async (id: string) => {
        const next = items.map(i =>
            i.id === id ? { ...i, archived: true, archived_date: new Date().toISOString() } : i
        );
        setItems(next);
        await persist(next);
        showToast('Goal marked as complete!', 'success');
    };

    // ── Unarchive ─────────────────────────────────────────────────────────────
    const handleUnarchive = async (id: string) => {
        const next = items.map(i =>
            i.id === id ? { ...i, archived: false, archived_date: undefined } : i
        );
        setItems(next);
        await persist(next);
        showToast('Goal moved back to active!', 'success');
    };

    // ── Derived ───────────────────────────────────────────────────────────────
    const activeItems = items.filter(i => !i.archived);
    const archivedItems = items.filter(i => i.archived);

    const grouped = categories
        .map((cat, idx) => ({ cat, color: categoryColor(cat, idx), goals: activeItems.filter(i => i.category === cat) }))
        .filter(g => g.goals.length > 0);

    const categoriesWithoutGoals = categories
        .filter(cat => !activeItems.some(i => i.category === cat));

    // Color for selected item
    const selectedColor = selectedItem
        ? categoryColor(selectedItem.category, categories.indexOf(selectedItem.category))
        : '#93c5fd';

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen bg-gray-50 pt-16">
                    <div className="max-w-3xl mx-auto px-4 py-12"><SkeletonCard /></div>
                </div>
            </>
        );
    }

    return (
        <>
            <AuthNavbar />

            {addGoalOpen && (
                <AddGoalModal
                    categories={categories}
                    defaultCategory={addGoalCategory}
                    onSave={handleAddGoal}
                    onClose={() => { setAddGoalOpen(false); setAddGoalCategory(undefined); }}
                />
            )}

            {selectedItem && userId && (
                <GoalDetailModal
                    item={selectedItem}
                    color={selectedColor}
                    userId={userId}
                    onClose={() => setSelectedItem(null)}
                    onUpdate={handleUpdate}
                    onArchive={handleArchive}
                />
            )}

            <div className="min-h-screen bg-gray-50">

                {/* ── Hero banner (matching dashboard language) ──────────── */}
                <div className="relative overflow-hidden">
                    <div
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(110deg, #3b0764 0%, #7e22ce 20%, #6d28d9 35%, #1e1b4b 55%, #155e75 75%, #06b6d4 100%)',
                        }}
                    />
                    <div className="relative z-10 max-w-3xl mx-auto px-6 py-10 md:py-14">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Roadmap</h1>
                        <p className="text-white/70 text-sm mb-7">
                            {activeItems.length === 0
                                ? 'No active goals yet — add your first one below'
                                : `${activeItems.length} active goal${activeItems.length !== 1 ? 's' : ''} across ${grouped.length} life area${grouped.length !== 1 ? 's' : ''}`}
                        </p>

                        {/* Category stat pills */}
                        {grouped.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-8">
                                {grouped.map(({ cat, color, goals }) => (
                                    <StatPill key={cat} label={cat} value={goals.length} color={color} />
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => { setAddGoalCategory(undefined); setAddGoalOpen(true); }}
                            className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-100 transition shadow-lg"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Goal
                        </button>
                    </div>
                </div>

                {/* ── Content ──────────────────────────────────────────────── */}
                <div className="max-w-3xl mx-auto px-4 py-8 md:py-10">

                    {activeItems.length === 0 && (
                        <EmptyState onAdd={() => setAddGoalOpen(true)} />
                    )}

                    {activeItems.length > 0 && (
                        <div className="space-y-10">
                            {/* Populated categories */}
                            {grouped.map(({ cat, color, goals }) => (
                                <CategorySection
                                    key={cat}
                                    categoryName={cat}
                                    color={color}
                                    items={goals}
                                    onOpenGoal={setSelectedItem}
                                    onAddGoal={cat => { setAddGoalCategory(cat); setAddGoalOpen(true); }}
                                />
                            ))}

                            {/* Empty categories */}
                            {categoriesWithoutGoals.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Other life areas</span>
                                        <div className="flex-1 h-px bg-gray-100" />
                                    </div>
                                    <div className="flex flex-wrap gap-2 ml-6">
                                        {categoriesWithoutGoals.map((cat, idx) => (
                                            <button
                                                key={cat}
                                                onClick={() => { setAddGoalCategory(cat); setAddGoalOpen(true); }}
                                                className="flex items-center gap-1.5 px-4 py-2 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition bg-white"
                                            >
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColor(cat, grouped.length + idx) }} />
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Past Goals ──────────────────────────────────────── */}
                    {archivedItems.length > 0 && (
                        <div className="mt-16 border-t border-gray-200 pt-10">
                            <button
                                onClick={() => setShowArchive(v => !v)}
                                className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition mb-4"
                            >
                                <svg
                                    className={`w-4 h-4 transition-transform ${showArchive ? 'rotate-90' : ''}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                Past Goals ({archivedItems.length})
                            </button>

                            {showArchive && (
                                <ArchiveStorybook
                                    archivedGoals={archivedItems.map(i => ({
                                        ...i,
                                        archived_date: i.archived_date ?? new Date().toISOString(),
                                    }))}
                                    onShare={() => {}}
                                    onUnarchive={handleUnarchive}
                                />
                            )}
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}
