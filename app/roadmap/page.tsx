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
import { GoalRow } from './components/GoalRow';
import { ArchiveStorybook } from './components/ArchiveStorybook';

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

// ─── Goal Detail Modal (simplified) ──────────────────────────────────────────

function GoalDetailModal({
    item,
    userId,
    onClose,
    onUpdate,
    onArchive,
}: {
    item: RoadmapItem;
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

                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-gray-500">{item.category}</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    item.type === 'behavior_change' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {item.type === 'behavior_change' ? 'Habit' : 'Goal'}
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">{item.title}</h2>
                            {item.why && <p className="text-sm text-gray-500 mt-0.5 italic">{item.why}</p>}
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1 flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Overall progress bar */}
                    {total > 0 && (
                        <div className="mt-4 flex items-center gap-3">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gray-900 rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className="text-xs font-semibold text-gray-500 w-12 text-right">{pct}%</span>
                        </div>
                    )}
                </div>

                {/* Activities */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Activities — {done}/{total} done today
                    </h3>
                    <div className="space-y-2">
                        {item.activities.map(activity => {
                            const doneToday = activity.completed_dates.includes(today);
                            return (
                                <div
                                    key={activity.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                        doneToday ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                    }`}
                                >
                                    <button
                                        onClick={() => toggleActivity(activity.id)}
                                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                            doneToday ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white hover:border-gray-900'
                                        }`}
                                    >
                                        {doneToday && (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                    <p className={`flex-1 text-sm font-medium ${doneToday ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                        {activity.text}
                                    </p>
                                    <AddToTodoButton variant="compact" />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-2 flex gap-3 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
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
    items,
    onOpenGoal,
    onAddGoal,
}: {
    categoryName: string;
    items: RoadmapItem[];
    onOpenGoal: (item: RoadmapItem) => void;
    onAddGoal: (category: string) => void;
}) {
    return (
        <div>
            <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{categoryName}</span>
                <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="space-y-2 mb-3">
                {items.map(item => (
                    <GoalRow key={item.id} item={item} onOpen={onOpenGoal} />
                ))}
            </div>

            <button
                onClick={() => onAddGoal(categoryName)}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 px-1 py-1 transition"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add goal to {categoryName}
            </button>
        </div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

    // ── Load ────────────────────────────────────────────────────────────────
    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) { router.push('/login'); return; }
                if (!mounted) return;
                setUserId(userWithProfile.user.id);

                // Check LifeFrame complete
                const { data: worksheets } = await supabase
                    .from('workbook_entries')
                    .select('category')
                    .eq('user_id', userWithProfile.user.id)
                    .in('category', ['values', 'interests', 'life_categories']);

                const hasAll = ['values', 'interests', 'life_categories'].every(
                    cat => worksheets?.some(w => w.category === cat)
                );
                if (!hasAll) { router.push('/workbook/lifeframe'); return; }

                // Load categories + roadmap in parallel
                const [catResult, roadmapResult] = await Promise.all([
                    supabase
                        .from('workbook_entries')
                        .select('content')
                        .eq('user_id', userWithProfile.user.id)
                        .eq('category', 'life_categories')
                        .single(),
                    supabase
                        .from('workbook_entries')
                        .select('content')
                        .eq('user_id', userWithProfile.user.id)
                        .eq('category', 'roadmap')
                        .single(),
                ]);

                if (!mounted) return;

                // Extract category names in order
                const cats: string[] = (catResult.data?.content?.categories ?? [])
                    .map((c: any) => (typeof c === 'string' ? c : c?.name))
                    .filter(Boolean);
                setCategories(cats);

                // Migrate: ensure activities have logs array
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

    // ── Persist ─────────────────────────────────────────────────────────────
    const persist = async (next: RoadmapItem[]) => {
        if (!userId) return;
        await supabase.from('workbook_entries').upsert(
            { user_id: userId, category: 'roadmap', content: { items: next, updated_at: new Date().toISOString() } },
            { onConflict: 'user_id,category' }
        );
    };

    // ── Add goal ─────────────────────────────────────────────────────────────
    const handleAddGoal = async (goal: {
        category: string;
        type: 'goal' | 'behavior_change';
        title: string;
        why: string;
        activities: string[];
    }) => {
        const newItem: RoadmapItem = {
            id: crypto.randomUUID(),
            category: goal.category,
            type: goal.type,
            title: goal.title,
            why: goal.why,
            activities: goal.activities.map(text => ({
                id: crypto.randomUUID(),
                text,
                completed_dates: [],
                logs: [],
                notes: '',
            })),
            quarter: (() => {
                const now = new Date();
                return `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
            })(),
            reflections: [],
            archived: false,
        };
        const next = [...items, newItem];
        setItems(next);
        await persist(next);
        showToast('Goal added!', 'success');
    };

    // ── Update goal (activity toggle) ────────────────────────────────────────
    const handleUpdate = async (updated: RoadmapItem) => {
        const next = items.map(i => i.id === updated.id ? updated : i);
        setItems(next);
        setSelectedItem(updated);
        await persist(next);
    };

    // ── Archive ──────────────────────────────────────────────────────────────
    const handleArchive = async (id: string) => {
        const next = items.map(i =>
            i.id === id ? { ...i, archived: true, archived_date: new Date().toISOString() } : i
        );
        setItems(next);
        await persist(next);
        showToast('Goal marked as complete!', 'success');
    };

    // ── Unarchive ────────────────────────────────────────────────────────────
    const handleUnarchive = async (id: string) => {
        const next = items.map(i =>
            i.id === id ? { ...i, archived: false, archived_date: undefined } : i
        );
        setItems(next);
        await persist(next);
        showToast('Goal moved back to active!', 'success');
    };


    const activeItems = items.filter(i => !i.archived);
    const archivedItems = items.filter(i => i.archived);

    // Group active items by category order from LifeFrame
    const grouped = categories
        .map(cat => ({ cat, goals: activeItems.filter(i => i.category === cat) }))
        .filter(g => g.goals.length > 0);

    // Categories with no goals yet (for empty category sections — shown only if some goals exist)
    const categoriesWithoutGoals = categories.filter(
        cat => !activeItems.some(i => i.category === cat)
    );

    // ── Render ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen bg-gray-50 pt-16">
                    <div className="max-w-3xl mx-auto px-4 py-12">
                        <SkeletonCard />
                    </div>
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
                    userId={userId}
                    onClose={() => setSelectedItem(null)}
                    onUpdate={handleUpdate}
                    onArchive={handleArchive}
                />
            )}

            <div className="min-h-screen bg-gray-50 pt-16">
                <div className="max-w-3xl mx-auto px-4 py-8 md:py-10">

                    {/* ── Page header ──────────────────────────────────── */}
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Roadmap</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {activeItems.length === 0
                                    ? 'No active goals yet'
                                    : `${activeItems.length} active goal${activeItems.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>
                        {activeItems.length > 0 && (
                            <button
                                onClick={() => { setAddGoalCategory(undefined); setAddGoalOpen(true); }}
                                className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Goal
                            </button>
                        )}
                    </div>

                    {/* ── Empty state ───────────────────────────────────── */}
                    {activeItems.length === 0 && (
                        <EmptyState onAdd={() => setAddGoalOpen(true)} />
                    )}

                    {/* ── Goal list grouped by category ─────────────────── */}
                    {activeItems.length > 0 && (
                        <div className="space-y-10">
                            {/* Populated categories */}
                            {grouped.map(({ cat, goals }) => (
                                <CategorySection
                                    key={cat}
                                    categoryName={cat}
                                    items={goals}
                                    onOpenGoal={setSelectedItem}
                                    onAddGoal={cat => { setAddGoalCategory(cat); setAddGoalOpen(true); }}
                                />
                            ))}

                            {/* Empty categories — shown as lightweight "add" prompts */}
                            {categoriesWithoutGoals.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Other life areas
                                        </span>
                                        <div className="flex-1 h-px bg-gray-100" />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {categoriesWithoutGoals.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => { setAddGoalCategory(cat); setAddGoalOpen(true); }}
                                                className="flex items-center gap-1.5 px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                    {/* ── Past Goals ────────────────────────────────────── */}
                    {archivedItems.length > 0 && (
                        <div className="mt-16 border-t border-gray-200 pt-10">
                            <button
                                onClick={() => setShowArchive(v => !v)}
                                className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition mb-4"
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
