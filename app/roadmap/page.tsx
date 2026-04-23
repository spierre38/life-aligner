'use client';

/**
 * Roadmap page — rebuilt to match Tim Collins' spec from meeting notes.
 *
 * Three views accessible via sub-nav:
 *   1. Update Roadmap   — CRUD for goals/behavior changes and their activities
 *   2. Your Plan        — read-only hierarchical view, printable
 *   3. Your Activities  — to-do list derived from flagged roadmap activities
 *                         plus user-added personal activities
 *
 * Data is stored in workbook_entries under category='roadmap' with this shape:
 *   {
 *     items: RoadmapItem[],
 *     manual_activities: ManualActivity[],
 *     updated_at: string
 *   }
 *
 * Life Categories completion is a hard prerequisite — middleware enforces it,
 * but this page defensively redirects too in case of direct URL navigation.
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';
import { SkeletonCard } from '@/app/components/Skeleton';
import { showToast } from '@/lib/toast';
import { evaluateLifeFrameCompletion } from '@/lib/lifeframe-completion';

// ─── Types ──────────────────────────────────────────────────────────────────

type Activity = {
    id: string;
    text: string;
    include_in_activities: boolean;  // Tim's spec: user flags which activities appear in Your Activities
    completed_dates: string[];       // dates marked done, kept for future Journal feature
};

type RoadmapItem = {
    id: string;
    category: string;
    type: 'goal' | 'behavior_change';
    title: string;
    why?: string;
    activities: Activity[];
    completed: boolean;
    created_at: string;
};

type ManualActivity = {
    id: string;
    text: string;
    priority: number;
    completed: boolean;
    created_at: string;
};

type RoadmapContent = {
    items: RoadmapItem[];
    manual_activities: ManualActivity[];
    updated_at: string;
};

type View = 'update' | 'plan' | 'activities';

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Normalize a raw roadmap item from the database into the new shape.
 * Handles items saved under the old schema by filling in missing fields
 * with safe defaults. Never throws on malformed input.
 */
function normalizeItem(raw: any): RoadmapItem | null {
    if (!raw || typeof raw !== 'object') return null;
    if (raw.archived) return null; // Drop archived items in the new model
    return {
        id: typeof raw.id === 'string' ? raw.id : generateId('item'),
        category: typeof raw.category === 'string' ? raw.category : 'Uncategorized',
        type: raw.type === 'behavior_change' ? 'behavior_change' : 'goal',
        title: typeof raw.title === 'string' ? raw.title : '',
        why: typeof raw.why === 'string' && raw.why.trim() ? raw.why : undefined,
        activities: Array.isArray(raw.activities)
            ? (raw.activities.map(normalizeActivity).filter(Boolean) as Activity[])
            : [],
        completed: raw.completed === true,
        created_at: typeof raw.created_at === 'string' ? raw.created_at : new Date().toISOString(),
    };
}

function normalizeActivity(raw: any): Activity | null {
    if (!raw || typeof raw !== 'object') return null;
    return {
        id: typeof raw.id === 'string' ? raw.id : generateId('activity'),
        text: typeof raw.text === 'string' ? raw.text : '',
        include_in_activities: raw.include_in_activities !== false, // default true
        completed_dates: Array.isArray(raw.completed_dates) ? raw.completed_dates : [],
    };
}

function normalizeManualActivity(raw: any, fallbackPriority: number): ManualActivity | null {
    if (!raw || typeof raw !== 'object') return null;
    return {
        id: typeof raw.id === 'string' ? raw.id : generateId('manual'),
        text: typeof raw.text === 'string' ? raw.text : '',
        priority: typeof raw.priority === 'number' ? raw.priority : fallbackPriority,
        completed: raw.completed === true,
        created_at: typeof raw.created_at === 'string' ? raw.created_at : new Date().toISOString(),
    };
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function RoadmapPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [content, setContent] = useState<RoadmapContent>({
        items: [],
        manual_activities: [],
        updated_at: new Date().toISOString(),
    });
    const [view, setView] = useState<View>('update');

    // Track the latest save to avoid races when the user makes changes rapidly.
    // Each save carries a sequence number; if a later save completes before an
    // earlier one returns, we ignore the earlier one's result.
    const saveSeq = useRef(0);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!mounted) return;

                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }

                const { data: worksheets, error } = await supabase
                    .from('workbook_entries')
                    .select('category, content')
                    .eq('user_id', userWithProfile.user.id);

                if (!mounted) return;

                if (error) {
                    console.error('Roadmap worksheets fetch failed:', error);
                    setLoadError(true);
                    return;
                }

                // Hard gate: must have completed Life Categories.
                // Middleware should catch this but we redirect defensively.
                const completion = evaluateLifeFrameCompletion(worksheets ?? []);
                if (!completion.life_categories.isComplete) {
                    router.push('/workbook/life-categories');
                    return;
                }

                // Extract category names from the user's LifeFrame.
                const categoriesRow = worksheets?.find(w => w.category === 'life_categories');
                const rawCategories = (categoriesRow?.content as any)?.categories ?? [];
                const categoryNames: string[] = rawCategories
                    .map((c: any) => (typeof c === 'string' ? c : c?.name))
                    .filter((n: any): n is string => typeof n === 'string' && n.length > 0);

                // Load existing roadmap content (if any) and normalize.
                const roadmapRow = worksheets?.find(w => w.category === 'roadmap');
                const rawContent = (roadmapRow?.content as any) ?? {};
                const normalizedItems = Array.isArray(rawContent.items)
                    ? (rawContent.items.map(normalizeItem).filter(Boolean) as RoadmapItem[])
                    : [];
                const normalizedManuals = Array.isArray(rawContent.manual_activities)
                    ? (rawContent.manual_activities
                          .map((m: any, i: number) => normalizeManualActivity(m, i + 1))
                          .filter(Boolean) as ManualActivity[])
                    : [];

                setUserId(userWithProfile.user.id);
                setCategories(categoryNames);
                setContent({
                    items: normalizedItems,
                    manual_activities: normalizedManuals,
                    updated_at: rawContent.updated_at ?? new Date().toISOString(),
                });
            } catch (err) {
                console.error('Roadmap load error:', err);
                if (mounted) setLoadError(true);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [router]);

    /**
     * Optimistic save: updates local state immediately, then persists to
     * Supabase. If the persist fails, surfaces an error toast so the user
     * knows their change didn't stick. Race-safe via a sequence number.
     */
    const save = async (next: RoadmapContent) => {
        if (!userId) return;

        const stamped: RoadmapContent = { ...next, updated_at: new Date().toISOString() };
        setContent(stamped);

        const seq = ++saveSeq.current;

        const { error } = await supabase
            .from('workbook_entries')
            .upsert(
                { user_id: userId, category: 'roadmap', content: stamped },
                { onConflict: 'user_id,category' }
            );

        // If a newer save has started, ignore our result.
        if (seq !== saveSeq.current) return;

        if (error) {
            showToast.error('Failed to save. Check your connection and try again.');
        }
    };

    // ── CRUD handlers (Update Roadmap view) ──────────────────────────────────

    const addItem = (
        category: string,
        partial: Omit<RoadmapItem, 'id' | 'category' | 'completed' | 'created_at'>
    ) => {
        const newItem: RoadmapItem = {
            id: generateId('item'),
            category,
            completed: false,
            created_at: new Date().toISOString(),
            ...partial,
        };
        save({ ...content, items: [...content.items, newItem] });
    };

    const updateItem = (id: string, updates: Partial<RoadmapItem>) => {
        save({
            ...content,
            items: content.items.map(item => (item.id === id ? { ...item, ...updates } : item)),
        });
    };

    const deleteItem = (id: string) => {
        save({ ...content, items: content.items.filter(item => item.id !== id) });
    };

    const addActivity = (itemId: string, text: string) => {
        if (!text.trim()) return;
        const newActivity: Activity = {
            id: generateId('activity'),
            text: text.trim(),
            include_in_activities: true,
            completed_dates: [],
        };
        save({
            ...content,
            items: content.items.map(item =>
                item.id === itemId ? { ...item, activities: [...item.activities, newActivity] } : item
            ),
        });
    };

    const updateActivity = (itemId: string, activityId: string, updates: Partial<Activity>) => {
        save({
            ...content,
            items: content.items.map(item =>
                item.id === itemId
                    ? {
                          ...item,
                          activities: item.activities.map(a =>
                              a.id === activityId ? { ...a, ...updates } : a
                          ),
                      }
                    : item
            ),
        });
    };

    const deleteActivity = (itemId: string, activityId: string) => {
        save({
            ...content,
            items: content.items.map(item =>
                item.id === itemId
                    ? { ...item, activities: item.activities.filter(a => a.id !== activityId) }
                    : item
            ),
        });
    };

    // ── Manual activities handlers (Your Activities view) ───────────────────

    const addManualActivity = (text: string) => {
        if (!text.trim()) return;
        const next: ManualActivity = {
            id: generateId('manual'),
            text: text.trim(),
            priority: content.manual_activities.length + 1,
            completed: false,
            created_at: new Date().toISOString(),
        };
        save({ ...content, manual_activities: [...content.manual_activities, next] });
    };

    const updateManualActivity = (id: string, updates: Partial<ManualActivity>) => {
        save({
            ...content,
            manual_activities: content.manual_activities.map(m =>
                m.id === id ? { ...m, ...updates } : m
            ),
        });
    };

    const deleteManualActivity = (id: string) => {
        // Re-sequence priorities so there are no gaps.
        const filtered = content.manual_activities
            .filter(m => m.id !== id)
            .sort((a, b) => a.priority - b.priority)
            .map((m, i) => ({ ...m, priority: i + 1 }));
        save({ ...content, manual_activities: filtered });
    };

    const reorderManualActivities = (newOrder: ManualActivity[]) => {
        const priorities = newOrder.map((m, i) => ({ ...m, priority: i + 1 }));
        save({ ...content, manual_activities: priorities });
    };

    // ── Render ──────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen bg-gray-50 pt-16">
                    <div className="max-w-6xl mx-auto px-4 py-12">
                        <SkeletonCard />
                    </div>
                </div>
            </>
        );
    }

    if (loadError) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen bg-gray-50 pt-16">
                    <div className="max-w-3xl mx-auto px-4 py-24">
                        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                We couldn't load your Roadmap
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Something went wrong fetching your data. Refreshing usually fixes it.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-gray-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <AuthNavbar />
            <div className="min-h-screen bg-gray-50 pt-16">
                <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
                    {/* ── Page header ─────────────────────────────────── */}
                    <header className="mb-8 no-print">
                        <p className="text-xs font-medium text-gray-500 mb-1">Roadmap</p>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                            {viewTitle(view)}
                        </h1>
                        <p className="text-gray-600 mt-2 max-w-2xl">{viewSubtitle(view)}</p>
                    </header>

                    {/* ── Sub-nav ─────────────────────────────────────── */}
                    <div className="no-print mb-8 border-b border-gray-200">
                        <div className="flex gap-1 -mb-px overflow-x-auto" role="tablist">
                            <SubNavTab active={view === 'update'} onClick={() => setView('update')} label="Update Roadmap" />
                            <SubNavTab active={view === 'plan'} onClick={() => setView('plan')} label="Your Plan" />
                            <SubNavTab active={view === 'activities'} onClick={() => setView('activities')} label="Your Activities" />
                        </div>
                    </div>

                    {/* ── Active view ─────────────────────────────────── */}
                    {view === 'update' && (
                        <UpdateRoadmapView
                            categories={categories}
                            items={content.items}
                            onAddItem={addItem}
                            onUpdateItem={updateItem}
                            onDeleteItem={deleteItem}
                            onAddActivity={addActivity}
                            onUpdateActivity={updateActivity}
                            onDeleteActivity={deleteActivity}
                        />
                    )}

                    {view === 'plan' && (
                        <YourPlanView
                            categories={categories}
                            items={content.items}
                            onSwitchToUpdate={() => setView('update')}
                        />
                    )}

                    {view === 'activities' && (
                        <YourActivitiesView
                            roadmapItems={content.items}
                            manualActivities={content.manual_activities}
                            onToggleActivityDate={(itemId, activityId, dateIso) => {
                                const item = content.items.find(i => i.id === itemId);
                                if (!item) return;
                                const act = item.activities.find(a => a.id === activityId);
                                if (!act) return;
                                const dates = act.completed_dates.includes(dateIso)
                                    ? act.completed_dates.filter(d => d !== dateIso)
                                    : [...act.completed_dates, dateIso];
                                updateActivity(itemId, activityId, { completed_dates: dates });
                            }}
                            onAddManual={addManualActivity}
                            onUpdateManual={updateManualActivity}
                            onDeleteManual={deleteManualActivity}
                            onReorderManuals={reorderManualActivities}
                            onSwitchToUpdate={() => setView('update')}
                        />
                    )}
                </div>
            </div>

            {/* Global print styles — hide chrome, keep content clean. */}
            <style jsx global>{`
                @media print {
                    nav,
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                    }
                }
            `}</style>
        </>
    );
}

function viewTitle(view: View): string {
    return view === 'update' ? 'Update Roadmap' : view === 'plan' ? 'Your Plan' : 'Your Activities';
}

function viewSubtitle(view: View): string {
    if (view === 'update') return 'Add, edit, and manage the goals and activities that make up your Roadmap.';
    if (view === 'plan') return 'A printable overview of everything on your Roadmap.';
    return "Your to-do list — activities from your Roadmap plus anything else you want to track.";
}

// ─── Sub-nav tab ────────────────────────────────────────────────────────────

function SubNavTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            role="tab"
            aria-selected={active}
            className={`whitespace-nowrap px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                active
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
        >
            {label}
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// View 1: Update Roadmap
// ═══════════════════════════════════════════════════════════════════════════

function UpdateRoadmapView({
    categories,
    items,
    onAddItem,
    onUpdateItem,
    onDeleteItem,
    onAddActivity,
    onUpdateActivity,
    onDeleteActivity,
}: {
    categories: string[];
    items: RoadmapItem[];
    onAddItem: (
        category: string,
        partial: Omit<RoadmapItem, 'id' | 'category' | 'completed' | 'created_at'>
    ) => void;
    onUpdateItem: (id: string, updates: Partial<RoadmapItem>) => void;
    onDeleteItem: (id: string) => void;
    onAddActivity: (itemId: string, text: string) => void;
    onUpdateActivity: (itemId: string, activityId: string, updates: Partial<Activity>) => void;
    onDeleteActivity: (itemId: string, activityId: string) => void;
}) {
    return (
        <div className="space-y-8">
            {categories.map(category => (
                <CategorySection
                    key={category}
                    category={category}
                    items={items.filter(i => i.category === category)}
                    onAddItem={partial => onAddItem(category, partial)}
                    onUpdateItem={onUpdateItem}
                    onDeleteItem={onDeleteItem}
                    onAddActivity={onAddActivity}
                    onUpdateActivity={onUpdateActivity}
                    onDeleteActivity={onDeleteActivity}
                />
            ))}
        </div>
    );
}

function CategorySection({
    category,
    items,
    onAddItem,
    onUpdateItem,
    onDeleteItem,
    onAddActivity,
    onUpdateActivity,
    onDeleteActivity,
}: {
    category: string;
    items: RoadmapItem[];
    onAddItem: (partial: Omit<RoadmapItem, 'id' | 'category' | 'completed' | 'created_at'>) => void;
    onUpdateItem: (id: string, updates: Partial<RoadmapItem>) => void;
    onDeleteItem: (id: string) => void;
    onAddActivity: (itemId: string, text: string) => void;
    onUpdateActivity: (itemId: string, activityId: string, updates: Partial<Activity>) => void;
    onDeleteActivity: (itemId: string, activityId: string) => void;
}) {
    const [addingType, setAddingType] = useState<'goal' | 'behavior_change' | null>(null);

    return (
        <section className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{category}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                    {items.length === 0
                        ? 'No goals yet'
                        : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}
                </p>
            </div>

            <div className="p-6 space-y-3">
                {items.map(item => (
                    <RoadmapItemCard
                        key={item.id}
                        item={item}
                        onUpdate={updates => onUpdateItem(item.id, updates)}
                        onDelete={() => onDeleteItem(item.id)}
                        onAddActivity={text => onAddActivity(item.id, text)}
                        onUpdateActivity={(activityId, updates) => onUpdateActivity(item.id, activityId, updates)}
                        onDeleteActivity={activityId => onDeleteActivity(item.id, activityId)}
                    />
                ))}

                {addingType ? (
                    <AddItemForm
                        type={addingType}
                        onSave={partial => {
                            onAddItem(partial);
                            setAddingType(null);
                        }}
                        onCancel={() => setAddingType(null)}
                    />
                ) : (
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={() => setAddingType('goal')}
                            className="flex-1 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition"
                        >
                            + Add Goal
                        </button>
                        <button
                            onClick={() => setAddingType('behavior_change')}
                            className="flex-1 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition"
                        >
                            + Add Behavior Change
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}

function RoadmapItemCard({
    item,
    onUpdate,
    onDelete,
    onAddActivity,
    onUpdateActivity,
    onDeleteActivity,
}: {
    item: RoadmapItem;
    onUpdate: (updates: Partial<RoadmapItem>) => void;
    onDelete: () => void;
    onAddActivity: (text: string) => void;
    onUpdateActivity: (activityId: string, updates: Partial<Activity>) => void;
    onDeleteActivity: (activityId: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [newActivityText, setNewActivityText] = useState('');

    const typeLabel = item.type === 'behavior_change' ? 'Behavior Change' : 'Goal';

    return (
        <div
            className={`rounded-2xl border p-4 transition-colors ${
                item.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
            }`}
        >
            {editing ? (
                <EditItemForm
                    item={item}
                    onSave={updates => {
                        onUpdate(updates);
                        setEditing(false);
                    }}
                    onCancel={() => setEditing(false)}
                />
            ) : (
                <>
                    <div className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={e => onUpdate({ completed: e.target.checked })}
                            className="mt-1 w-5 h-5 accent-gray-900 cursor-pointer"
                            aria-label={`Mark ${item.title} as complete`}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                                    {typeLabel}
                                </span>
                            </div>
                            <h3
                                className={`text-base font-semibold ${
                                    item.completed ? 'line-through text-gray-500' : 'text-gray-900'
                                }`}
                            >
                                {item.title || '(untitled)'}
                            </h3>
                            {item.why && <p className="text-sm text-gray-600 mt-1">{item.why}</p>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-900 transition"
                                aria-label={expanded ? 'Collapse activities' : 'Expand activities'}
                            >
                                <svg
                                    className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setEditing(true)}
                                className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-900 transition"
                                aria-label="Edit item"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                </svg>
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm(`Delete "${item.title}"? This can't be undone.`)) {
                                        onDelete();
                                    }
                                }}
                                className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-red-600 transition"
                                aria-label="Delete item"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {expanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                                Activities
                            </p>
                            <div className="space-y-2">
                                {item.activities.map(a => (
                                    <ActivityRow
                                        key={a.id}
                                        activity={a}
                                        onUpdate={updates => onUpdateActivity(a.id, updates)}
                                        onDelete={() => onDeleteActivity(a.id)}
                                    />
                                ))}
                                <form
                                    onSubmit={e => {
                                        e.preventDefault();
                                        if (!newActivityText.trim()) return;
                                        onAddActivity(newActivityText);
                                        setNewActivityText('');
                                    }}
                                    className="flex gap-2 pt-1"
                                >
                                    <input
                                        type="text"
                                        value={newActivityText}
                                        onChange={e => setNewActivityText(e.target.value)}
                                        placeholder="Add an activity..."
                                        maxLength={200}
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newActivityText.trim()}
                                        className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        Add
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function ActivityRow({
    activity,
    onUpdate,
    onDelete,
}: {
    activity: Activity;
    onUpdate: (updates: Partial<Activity>) => void;
    onDelete: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(activity.text);

    const save = () => {
        const trimmed = draft.trim();
        if (!trimmed) return;
        onUpdate({ text: trimmed });
        setEditing(false);
    };

    return (
        <div className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-200">
            <input
                type="checkbox"
                checked={activity.include_in_activities}
                onChange={e => onUpdate({ include_in_activities: e.target.checked })}
                className="w-4 h-4 accent-gray-900 cursor-pointer flex-shrink-0"
                aria-label="Include in Your Activities"
                title="Include in Your Activities"
            />
            {editing ? (
                <input
                    type="text"
                    value={draft}
                    autoFocus
                    onChange={e => setDraft(e.target.value)}
                    onBlur={save}
                    onKeyDown={e => {
                        if (e.key === 'Enter') save();
                        if (e.key === 'Escape') {
                            setDraft(activity.text);
                            setEditing(false);
                        }
                    }}
                    maxLength={200}
                    className="flex-1 px-2 py-1 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
            ) : (
                <button
                    onClick={() => setEditing(true)}
                    className="flex-1 text-left text-sm text-gray-700 hover:text-gray-900 min-w-0 truncate"
                >
                    {activity.text || '(empty activity)'}
                </button>
            )}
            <button
                onClick={() => {
                    if (confirm('Delete this activity?')) onDelete();
                }}
                className="p-1 rounded text-gray-400 hover:text-red-600 flex-shrink-0"
                aria-label="Delete activity"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

function AddItemForm({
    type,
    onSave,
    onCancel,
}: {
    type: 'goal' | 'behavior_change';
    onSave: (partial: Omit<RoadmapItem, 'id' | 'category' | 'completed' | 'created_at'>) => void;
    onCancel: () => void;
}) {
    const [title, setTitle] = useState('');
    const [why, setWhy] = useState('');
    const [activityTexts, setActivityTexts] = useState<string[]>(['']);

    const isValid = title.trim().length > 0;

    const handleSave = () => {
        if (!isValid) return;
        const activities: Activity[] = activityTexts
            .map(t => t.trim())
            .filter(t => t.length > 0)
            .map(t => ({
                id: generateId('activity'),
                text: t,
                include_in_activities: true,
                completed_dates: [],
            }));
        onSave({ type, title: title.trim(), why: why.trim() || undefined, activities });
    };

    return (
        <div className="rounded-2xl border-2 border-dashed border-gray-400 p-5 bg-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                New {type === 'behavior_change' ? 'Behavior Change' : 'Goal'}
            </p>
            <div className="space-y-3">
                <input
                    type="text"
                    value={title}
                    autoFocus
                    onChange={e => setTitle(e.target.value)}
                    placeholder={type === 'behavior_change' ? 'e.g., Sleep 8 hours nightly' : 'e.g., Run a 5K by June'}
                    maxLength={120}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <textarea
                    value={why}
                    onChange={e => setWhy(e.target.value)}
                    placeholder="Why does this matter to you? (optional)"
                    maxLength={500}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                />
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Activities</p>
                    <div className="space-y-2">
                        {activityTexts.map((t, i) => (
                            <div key={i} className="flex gap-2">
                                <input
                                    type="text"
                                    value={t}
                                    onChange={e => {
                                        const next = [...activityTexts];
                                        next[i] = e.target.value;
                                        setActivityTexts(next);
                                    }}
                                    placeholder={`Activity ${i + 1}`}
                                    maxLength={200}
                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                />
                                {activityTexts.length > 1 && (
                                    <button
                                        onClick={() => setActivityTexts(activityTexts.filter((_, j) => j !== i))}
                                        className="px-3 rounded-lg text-gray-500 hover:text-red-600"
                                        aria-label="Remove activity"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            onClick={() => setActivityTexts([...activityTexts, ''])}
                            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                        >
                            + Add another activity
                        </button>
                    </div>
                </div>
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleSave}
                        disabled={!isValid}
                        className="flex-1 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Save
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditItemForm({
    item,
    onSave,
    onCancel,
}: {
    item: RoadmapItem;
    onSave: (updates: Partial<RoadmapItem>) => void;
    onCancel: () => void;
}) {
    const [type, setType] = useState(item.type);
    const [title, setTitle] = useState(item.title);
    const [why, setWhy] = useState(item.why ?? '');

    const save = () => {
        const trimmed = title.trim();
        if (!trimmed) return;
        onSave({ type, title: trimmed, why: why.trim() || undefined });
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <button
                    onClick={() => setType('goal')}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                        type === 'goal' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    Goal
                </button>
                <button
                    onClick={() => setType('behavior_change')}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                        type === 'behavior_change' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    Behavior Change
                </button>
            </div>
            <input
                type="text"
                value={title}
                autoFocus
                onChange={e => setTitle(e.target.value)}
                maxLength={120}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <textarea
                value={why}
                onChange={e => setWhy(e.target.value)}
                placeholder="Why does this matter? (optional)"
                maxLength={500}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
            <div className="flex gap-2">
                <button
                    onClick={save}
                    className="flex-1 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition"
                >
                    Save
                </button>
                <button
                    onClick={onCancel}
                    className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// View 2: Your Plan
// ═══════════════════════════════════════════════════════════════════════════

function YourPlanView({
    categories,
    items,
    onSwitchToUpdate,
}: {
    categories: string[];
    items: RoadmapItem[];
    onSwitchToUpdate: () => void;
}) {
    // Only show categories that have at least one item, in the order the user defined them.
    const itemsByCategory = new Map<string, RoadmapItem[]>();
    for (const cat of categories) {
        const rows = items.filter(i => i.category === cat);
        if (rows.length > 0) itemsByCategory.set(cat, rows);
    }

    if (itemsByCategory.size === 0) {
        return (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-12 text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Your Plan is empty</h2>
                <p className="text-gray-600 mb-6">
                    Add goals and activities in Update Roadmap to see them here.
                </p>
                <button
                    onClick={onSwitchToUpdate}
                    className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition"
                >
                    Go to Update Roadmap
                    <span aria-hidden>→</span>
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="no-print mb-6 flex justify-end">
                <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-900 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-200 transition"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                        />
                    </svg>
                    Print
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-10 print:shadow-none print:border-none print:rounded-none">
                <div className="space-y-8">
                    {Array.from(itemsByCategory.entries()).map(([category, rows]) => (
                        <section key={category}>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                                {category}
                            </h2>
                            <div className="space-y-5">
                                {rows.map(item => (
                                    <div key={item.id} className="pl-4">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                                            {item.type === 'behavior_change' ? 'Behavior Change' : 'Goal'}
                                        </p>
                                        <h3
                                            className={`text-lg font-semibold ${
                                                item.completed ? 'line-through text-gray-500' : 'text-gray-900'
                                            }`}
                                        >
                                            {item.title}
                                        </h3>
                                        {item.why && <p className="text-sm text-gray-600 mt-1 italic">{item.why}</p>}
                                        {item.activities.length > 0 && (
                                            <ul className="mt-3 space-y-1.5 pl-5">
                                                {item.activities.map(a => (
                                                    <li key={a.id} className="text-sm text-gray-700 list-disc">
                                                        {a.text}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// View 3: Your Activities
// ═══════════════════════════════════════════════════════════════════════════

function YourActivitiesView({
    roadmapItems,
    manualActivities,
    onToggleActivityDate,
    onAddManual,
    onUpdateManual,
    onDeleteManual,
    onReorderManuals,
    onSwitchToUpdate,
}: {
    roadmapItems: RoadmapItem[];
    manualActivities: ManualActivity[];
    onToggleActivityDate: (itemId: string, activityId: string, dateIso: string) => void;
    onAddManual: (text: string) => void;
    onUpdateManual: (id: string, updates: Partial<ManualActivity>) => void;
    onDeleteManual: (id: string) => void;
    onReorderManuals: (next: ManualActivity[]) => void;
    onSwitchToUpdate: () => void;
}) {
    const [newText, setNewText] = useState('');
    const [dragIndex, setDragIndex] = useState<number | null>(null);

    const today = new Date().toISOString().split('T')[0];

    // Flatten roadmap activities that are flagged include_in_activities.
    const roadmapActivities = roadmapItems.flatMap(item =>
        item.activities
            .filter(a => a.include_in_activities)
            .map(a => ({
                itemId: item.id,
                activity: a,
                parentTitle: item.title,
                parentCategory: item.category,
                doneToday: a.completed_dates.includes(today),
            }))
    );

    const sortedManuals = [...manualActivities].sort((a, b) => a.priority - b.priority);

    return (
        <div className="space-y-8">
            {/* Roadmap Activities */}
            <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">From Your Roadmap</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Activities you've flagged to include in your to-do list.
                        </p>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="no-print text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                        Print
                    </button>
                </div>

                {roadmapActivities.length === 0 ? (
                    <p className="text-sm text-gray-500 italic py-6 text-center">
                        No activities flagged yet.{' '}
                        <button
                            onClick={onSwitchToUpdate}
                            className="underline text-gray-700 hover:text-gray-900"
                        >
                            Go to Update Roadmap
                        </button>{' '}
                        to flag activities.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {roadmapActivities.map(({ itemId, activity, parentTitle, parentCategory, doneToday }) => (
                            <li
                                key={activity.id}
                                className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50"
                            >
                                <input
                                    type="checkbox"
                                    checked={doneToday}
                                    onChange={() => onToggleActivityDate(itemId, activity.id, today)}
                                    className="mt-0.5 w-5 h-5 accent-gray-900 cursor-pointer"
                                    aria-label={`Mark ${activity.text} done for today`}
                                />
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={`text-sm font-medium ${
                                            doneToday ? 'line-through text-gray-500' : 'text-gray-900'
                                        }`}
                                    >
                                        {activity.text}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {parentCategory} · {parentTitle}
                                    </p>
                                </div>
                                <button
                                    onClick={onSwitchToUpdate}
                                    className="text-xs text-gray-500 hover:text-gray-900 underline flex-shrink-0"
                                    title="To edit or delete, go to Update Roadmap"
                                >
                                    Edit
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Personal Activities */}
            <section className="bg-amber-50 rounded-3xl border border-amber-200 shadow-sm p-6">
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Personal Activities</h2>
                    <p className="text-sm text-gray-600 mt-0.5">
                        Anything else you want to track that isn't part of your Roadmap. Drag to reorder.
                    </p>
                </div>

                <form
                    onSubmit={e => {
                        e.preventDefault();
                        if (!newText.trim()) return;
                        onAddManual(newText);
                        setNewText('');
                    }}
                    className="flex gap-2 mb-4 no-print"
                >
                    <input
                        type="text"
                        value={newText}
                        onChange={e => setNewText(e.target.value)}
                        placeholder="Add a personal activity..."
                        maxLength={200}
                        className="flex-1 px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                        type="submit"
                        disabled={!newText.trim()}
                        className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Add
                    </button>
                </form>

                {sortedManuals.length === 0 ? (
                    <p className="text-sm text-gray-600 italic py-4 text-center">No personal activities yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {sortedManuals.map((m, index) => (
                            <li
                                key={m.id}
                                draggable
                                onDragStart={() => setDragIndex(index)}
                                onDragOver={e => e.preventDefault()}
                                onDrop={() => {
                                    if (dragIndex === null || dragIndex === index) {
                                        setDragIndex(null);
                                        return;
                                    }
                                    const next = [...sortedManuals];
                                    const [moved] = next.splice(dragIndex, 1);
                                    next.splice(index, 0, moved);
                                    onReorderManuals(next);
                                    setDragIndex(null);
                                }}
                                onDragEnd={() => setDragIndex(null)}
                                className={`flex items-start gap-3 p-3 rounded-xl border bg-white transition-opacity cursor-move ${
                                    dragIndex === index ? 'opacity-40 border-amber-400' : 'border-amber-200'
                                }`}
                            >
                                <span className="text-xs font-semibold text-amber-700 w-6 flex-shrink-0 mt-1">
                                    {m.priority}
                                </span>
                                <input
                                    type="checkbox"
                                    checked={m.completed}
                                    onChange={e => onUpdateManual(m.id, { completed: e.target.checked })}
                                    className="mt-1 w-5 h-5 accent-gray-900 cursor-pointer flex-shrink-0"
                                    aria-label={`Mark ${m.text} complete`}
                                />
                                <EditableManualText
                                    text={m.text}
                                    completed={m.completed}
                                    onSave={text => onUpdateManual(m.id, { text })}
                                />
                                <button
                                    onClick={() => {
                                        if (confirm('Delete this activity?')) onDeleteManual(m.id);
                                    }}
                                    className="p-1 rounded text-gray-400 hover:text-red-600 flex-shrink-0 no-print"
                                    aria-label="Delete activity"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

function EditableManualText({
    text,
    completed,
    onSave,
}: {
    text: string;
    completed: boolean;
    onSave: (text: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(text);

    const commit = () => {
        const trimmed = draft.trim();
        if (!trimmed) {
            setDraft(text);
        } else if (trimmed !== text) {
            onSave(trimmed);
        }
        setEditing(false);
    };

    if (editing) {
        return (
            <input
                type="text"
                value={draft}
                autoFocus
                onChange={e => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={e => {
                    if (e.key === 'Enter') commit();
                    if (e.key === 'Escape') {
                        setDraft(text);
                        setEditing(false);
                    }
                }}
                maxLength={200}
                className="flex-1 px-2 py-1 rounded border border-amber-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-0"
            />
        );
    }

    return (
        <button
            onClick={() => setEditing(true)}
            className={`flex-1 text-left text-sm min-w-0 truncate ${
                completed ? 'line-through text-gray-500' : 'text-gray-900 hover:text-gray-700'
            }`}
        >
            {text || '(empty)'}
        </button>
    );
}
