'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAllTodos, toggleTodoCompletion, addManualTodo, TodoItem } from '@/lib/todos';
import Link from 'next/link';

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = 'today' | 'feed' | 'pad' | 'add';

interface Activity {
    id: string;
    text: string;
    logs: { date: string; feeling: string; note: string; logged_at: string }[];
    completed_dates: string[];
}

interface RoadmapItem {
    id: string;
    title: string;
    category: string;
    activities: Activity[];
    archived: boolean;
}

interface Post {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    post_type?: string;
    likes_count?: number;
    profiles?: { full_name: string; avatar_url?: string };
}

// ── Bottom Nav Icons ──────────────────────────────────────────────────────────

const TodayIcon = ({ filled }: { filled: boolean }) => (
    <svg className="w-6 h-6" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={filled ? 0 : 2}
            d={filled
                ? "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                : "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            }
        />
    </svg>
);

const FeedIcon = ({ filled }: { filled: boolean }) => (
    <svg className="w-6 h-6" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
        />
    </svg>
);

const PadIcon = ({ filled }: { filled: boolean }) => (
    <svg className="w-6 h-6" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
    </svg>
);

const AddIcon = ({ filled }: { filled: boolean }) => (
    <svg className="w-6 h-6" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function calculateStreak(items: RoadmapItem[]): { current: number; todayLogged: boolean } {
    const allDates = new Set<string>();
    items.filter(i => !i.archived).forEach(item => {
        item.activities.forEach(act => {
            (act.logs || []).forEach(log => allDates.add(log.date));
        });
    });
    const today = new Date().toISOString().split('T')[0];
    const todayLogged = allDates.has(today);
    const sorted = Array.from(allDates).sort((a, b) => b.localeCompare(a));
    if (!sorted.length) return { current: 0, todayLogged: false };
    let current = 0;
    const checkDate = new Date(todayLogged ? today : sorted[0]);
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (!todayLogged && sorted[0] !== yesterday.toISOString().split('T')[0]) return { current: 0, todayLogged };
    for (let i = 0; i < 180; i++) {
        if (allDates.has(checkDate.toISOString().split('T')[0])) current++;
        else break;
        checkDate.setDate(checkDate.getDate() - 1);
    }
    return { current, todayLogged };
}

function getTodaysFocus(items: RoadmapItem[], count = 4): { item: RoadmapItem; activity: Activity }[] {
    const today = new Date().toISOString().split('T')[0];
    const candidates: { item: RoadmapItem; activity: Activity; score: number }[] = [];
    items.filter(i => !i.archived).forEach(item => {
        item.activities.forEach(activity => {
            if ((activity.logs || []).some(l => l.date === today)) return;
            const daysSince = activity.logs?.length
                ? Math.floor((Date.now() - new Date(activity.logs[activity.logs.length - 1].date).getTime()) / 86400000)
                : 30;
            candidates.push({ item, activity, score: daysSince * 10 - (activity.logs?.length || 0) });
        });
    });
    return candidates.sort((a, b) => b.score - a.score).slice(0, count).map(c => ({ item: c.item, activity: c.activity }));
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DailyPage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center bg-gray-950">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Loading your day...</p>
                </div>
            </div>
        }>
            <DailyPageInner />
        </Suspense>
    );
}

function DailyPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'today');

    // Data
    const [user, setUser] = useState<any>(null);
    const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [lifeFrameStatus, setLifeFrameStatus] = useState<{ values: boolean; interests: boolean; life_categories: boolean }>({ values: false, interests: false, life_categories: false });

    // Today tab state
    const [loggingActivity, setLoggingActivity] = useState<{ itemId: string; activityId: string; text: string } | null>(null);
    const [selectedFeeling, setSelectedFeeling] = useState<'great' | 'okay' | 'hard' | null>(null);
    const [logNote, setLogNote] = useState('');

    // Pad tab state
    const [newTodoText, setNewTodoText] = useState('');
    const [addingTodo, setAddingTodo] = useState(false);

    // Quick Add tab state
    const [addType, setAddType] = useState<'todo' | 'goal'>('todo');
    const [addText, setAddText] = useState('');
    const [addCategory, setAddCategory] = useState('');
    const [addSaving, setAddSaving] = useState(false);

    // Computed
    const streak = calculateStreak(roadmapItems);
    const focusItems = getTodaysFocus(roadmapItems);
    const activeTodos = todos.filter(t => !t.hidden);
    const hasRoadmap = roadmapItems.length > 0;
    const lifeFrameComplete = lifeFrameStatus.values && lifeFrameStatus.interests && lifeFrameStatus.life_categories;
    const lifeFrameDone = [lifeFrameStatus.values, lifeFrameStatus.interests, lifeFrameStatus.life_categories].filter(Boolean).length;

    // ── Data Loading ───────────────────────────────────────────────────────────

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }
            setUser(user);

            // Load roadmap
            const { data: roadmapData } = await supabase
                .from('roadmap_data').select('data').eq('user_id', user.id).single();
            if (roadmapData?.data?.items) setRoadmapItems(roadmapData.data.items);

            // Check LifeFrame completion
            const { data: worksheets } = await supabase
                .from('workbook_entries').select('category').eq('user_id', user.id);
            if (worksheets) {
                setLifeFrameStatus({
                    values: worksheets.some(w => w.category === 'values'),
                    interests: worksheets.some(w => w.category === 'interests'),
                    life_categories: worksheets.some(w => w.category === 'life_categories'),
                });
            }

            // Load todos
            const todoResult = await getAllTodos();
            if (todoResult.data) setTodos(todoResult.data);

            // Load community posts
            const { data: postData } = await supabase
                .from('posts').select('*, profiles(full_name, avatar_url)')
                .order('created_at', { ascending: false }).limit(20);
            if (postData) setPosts(postData);

            // Track activity count for install prompt
            const count = parseInt(localStorage.getItem('la_activity_count') || '0');
            if (count >= 3 && localStorage.getItem('la_install_dismissed') !== 'true') {
                localStorage.setItem('la_show_install', 'true');
            }

            setLoading(false);
        };
        load();
    }, [router]);

    // ── Activity Logging ───────────────────────────────────────────────────────

    const logActivity = async (feeling: 'great' | 'okay' | 'hard', note: string) => {
        if (!loggingActivity || !user) return;
        const today = new Date().toISOString().split('T')[0];
        const newLog = { date: today, feeling, note, logged_at: new Date().toISOString() };

        const updated = roadmapItems.map(item => {
            if (item.id !== loggingActivity.itemId) return item;
            return {
                ...item,
                activities: item.activities.map(act => {
                    if (act.id !== loggingActivity.activityId) return act;
                    return {
                        ...act,
                        logs: [...(act.logs || []), newLog],
                        completed_dates: act.completed_dates.includes(today)
                            ? act.completed_dates : [...act.completed_dates, today],
                    };
                }),
            };
        });
        setRoadmapItems(updated);
        setLoggingActivity(null);
        setSelectedFeeling(null);
        setLogNote('');

        await supabase.from('roadmap_data').upsert({ user_id: user.id, data: { items: updated } }, { onConflict: 'user_id' });

        // Increment install prompt counter
        const count = parseInt(localStorage.getItem('la_activity_count') || '0') + 1;
        localStorage.setItem('la_activity_count', String(count));
        if (count >= 3) localStorage.setItem('la_show_install', 'true');
    };

    // ── Todo Actions ───────────────────────────────────────────────────────────

    const handleToggleTodo = async (todoId: string, source: 'roadmap' | 'manual') => {
        await toggleTodoCompletion(todoId, source);
        setTodos(prev => prev.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t));
    };

    const handleAddTodo = async () => {
        if (!newTodoText.trim() || !user) return;
        setAddingTodo(true);
        await addManualTodo(newTodoText.trim());
        const todoResult = await getAllTodos();
        if (todoResult.data) setTodos(todoResult.data);
        setNewTodoText('');
        setAddingTodo(false);
    };

    // ── Quick Add ──────────────────────────────────────────────────────────────

    const handleQuickAdd = async () => {
        if (!addText.trim() || !user) return;
        setAddSaving(true);
        if (addType === 'todo') {
            await addManualTodo(addText.trim());
            const todoResult = await getAllTodos();
            if (todoResult.data) setTodos(todoResult.data);
        } else {
            // Add to roadmap
            const newItem: RoadmapItem = {
                id: `goal-${Date.now()}`,
                title: addText.trim(),
                category: addCategory || 'General',
                activities: [],
                archived: false,
            };
            const updated = [...roadmapItems, newItem];
            setRoadmapItems(updated);
            await supabase.from('roadmap_data').upsert({ user_id: user.id, data: { items: updated } }, { onConflict: 'user_id' });
        }
        setAddText('');
        setAddCategory('');
        setAddSaving(false);
    };

    // ── Render: Loading ────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-950">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Loading your day...</p>
                </div>
            </div>
        );
    }

    // ── Tab: Today ─────────────────────────────────────────────────────────────

    const TodayTab = () => {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        return (
            <div className="p-4 space-y-4">
                {/* Streak + Date */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">{today}</p>
                            <h2 className="text-xl font-bold mt-0.5">
                                {streak.todayLogged ? '✅ Day logged!' : "Good morning! Let's go."}
                            </h2>
                        </div>
                        <div className="text-center bg-white/15 rounded-xl px-4 py-2">
                            <div className="text-3xl font-black">{streak.current}</div>
                            <div className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">day streak 🔥</div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/roadmap" className="flex-1 text-center py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition">
                            Full Roadmap →
                        </Link>
                        <Link href="/todo" className="flex-1 text-center py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition">
                            Full To-Do →
                        </Link>
                    </div>
                </div>

                {/* LifeFrame Nudge — shown when no roadmap yet */}
                {!hasRoadmap && (
                    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                        <div className="text-center mb-4">
                            <div className="text-4xl mb-2">📋</div>
                            <h3 className="text-white font-bold text-lg">Complete Your LifeFrame</h3>
                            <p className="text-slate-400 text-sm mt-1">
                                {lifeFrameComplete
                                    ? 'Your LifeFrame is done! Build your Roadmap to unlock daily tracking.'
                                    : 'Finish your 3 foundation steps to unlock daily goal tracking.'}
                            </p>
                        </div>
                        <div className="space-y-2 mb-4">
                            {[
                                { key: 'values', label: 'Values', done: lifeFrameStatus.values },
                                { key: 'interests', label: 'Interests', done: lifeFrameStatus.interests },
                                { key: 'life_categories', label: 'Life Categories', done: lifeFrameStatus.life_categories },
                            ].map(step => (
                                <div key={step.key} className="flex items-center gap-3 px-3 py-2 bg-gray-800 rounded-xl">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${step.done ? 'bg-green-500 text-white' : 'border-2 border-gray-600 text-gray-600'}`}>
                                        {step.done ? '✓' : ''}
                                    </div>
                                    <span className={`text-sm font-medium ${step.done ? 'text-green-400' : 'text-slate-300'}`}>{step.label}</span>
                                </div>
                            ))}
                        </div>
                        <Link
                            href={lifeFrameComplete ? '/roadmap' : '/dashboard'}
                            className="block w-full text-center py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm transition hover:opacity-90"
                        >
                            {lifeFrameComplete ? 'Build Your Roadmap →' : `Continue on Dashboard (${lifeFrameDone}/3) →`}
                        </Link>
                    </div>
                )}

                {/* Focus Activities — only when roadmap exists */}
                {hasRoadmap && (
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                        Today's Focus {focusItems.length === 0 && '— All done! 🎉'}
                    </h3>
                    {focusItems.length === 0 ? (
                        <div className="bg-gray-900 rounded-2xl p-6 text-center">
                            <div className="text-4xl mb-2">🌟</div>
                            <p className="text-white font-semibold">All caught up!</p>
                            <p className="text-slate-400 text-sm mt-1">Log more activities to get suggestions</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {focusItems.map(({ item, activity }) => {
                                const isLogging = loggingActivity?.activityId === activity.id;
                                return (
                                    <div key={activity.id} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
                                        <div className="flex items-center gap-3 p-4">
                                            <button
                                                onClick={() => setLoggingActivity(isLogging ? null : { itemId: item.id, activityId: activity.id, text: activity.text })}
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isLogging ? 'bg-indigo-500' : 'bg-gray-800 hover:bg-indigo-900 border border-gray-700'}`}
                                            >
                                                {isLogging
                                                    ? <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    : <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                }
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium text-sm leading-snug">{activity.text}</p>
                                                <p className="text-slate-500 text-xs mt-0.5">{item.category} · {item.title}</p>
                                            </div>
                                        </div>

                                        {/* Log panel */}
                                        {isLogging && (
                                            <div className="border-t border-gray-800 p-4 bg-gray-950/50">
                                                <p className="text-xs text-slate-400 font-semibold mb-3">How did it go?</p>
                                                <div className="flex gap-2 mb-3">
                                                    {[
                                                        { val: 'great' as const, emoji: '😊', label: 'Great' },
                                                        { val: 'okay' as const, emoji: '😐', label: 'Okay' },
                                                        { val: 'hard' as const, emoji: '😤', label: 'Hard' },
                                                    ].map(f => (
                                                        <button
                                                            key={f.val}
                                                            onClick={() => setSelectedFeeling(f.val)}
                                                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${selectedFeeling === f.val ? 'bg-indigo-600 text-white scale-105' : 'bg-gray-800 text-slate-300 hover:bg-gray-700'}`}
                                                        >
                                                            {f.emoji} {f.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={logNote}
                                                    onChange={e => setLogNote(e.target.value)}
                                                    placeholder="Quick note (optional)"
                                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-slate-500 focus:border-indigo-500 focus:outline-none mb-3"
                                                />
                                                <button
                                                    onClick={() => selectedFeeling && logActivity(selectedFeeling, logNote)}
                                                    disabled={!selectedFeeling}
                                                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${selectedFeeling ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                                                >
                                                    {selectedFeeling ? '✓ Log Activity' : 'Select a feeling first'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                )}
            </div>
        );
    };

    // ── Tab: Feed ──────────────────────────────────────────────────────────────

    const FeedTab = () => (
        <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Community Feed</h3>
                <Link href="/community" className="text-xs text-indigo-400 font-semibold">Full Feed →</Link>
            </div>
            {posts.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-4xl mb-3">💬</div>
                    <p className="text-slate-400 text-sm">No posts yet. Be the first!</p>
                    <Link href="/community" className="text-indigo-400 text-sm font-semibold mt-2 inline-block">Go to Community →</Link>
                </div>
            ) : (
                posts.map(post => (
                    <div key={post.id} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {(post.profiles?.full_name || 'U')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-semibold truncate">{post.profiles?.full_name || 'Anonymous'}</p>
                                <p className="text-slate-500 text-xs">{timeAgo(post.created_at)}</p>
                            </div>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">{post.content}</p>
                    </div>
                ))
            )}
        </div>
    );

    // ── Tab: Pad ───────────────────────────────────────────────────────────────

    const PadTab = () => (
        <div className="p-4">
            {/* Add item */}
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newTodoText}
                    onChange={e => setNewTodoText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
                    placeholder="Add a task..."
                    className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-sm"
                />
                <button
                    onClick={handleAddTodo}
                    disabled={!newTodoText.trim() || addingTodo}
                    className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center justify-center transition disabled:opacity-40"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
            </div>

            {/* Stats */}
            <div className="flex gap-2 mb-4">
                <div className="flex-1 bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
                    <div className="text-xl font-bold text-white">{activeTodos.filter(t => !t.completed).length}</div>
                    <div className="text-xs text-slate-400">Active</div>
                </div>
                <div className="flex-1 bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
                    <div className="text-xl font-bold text-green-400">{activeTodos.filter(t => t.completed).length}</div>
                    <div className="text-xs text-slate-400">Done</div>
                </div>
                <Link href="/todo" className="flex-1 bg-gray-900 rounded-xl p-3 text-center border border-gray-800 hover:border-indigo-700 transition">
                    <div className="text-xl">📋</div>
                    <div className="text-xs text-indigo-400 font-semibold">Full Pad</div>
                </Link>
            </div>

            {/* Todo list */}
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {activeTodos.filter(t => !t.completed).length === 0 ? 'Nothing pending — nice! 🎉' : 'Your Tasks'}
            </h3>
            <div className="space-y-2">
                {activeTodos.filter(t => !t.completed).map(todo => (
                    <div key={todo.id} className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3 border border-gray-800">
                        <button
                            onClick={() => handleToggleTodo(todo.id, (todo.source as 'roadmap' | 'manual') || 'manual')}
                            className="w-6 h-6 rounded-lg border-2 border-gray-600 flex items-center justify-center flex-shrink-0 hover:border-green-400 transition"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{todo.text}</p>
                            {todo.source === 'roadmap' && (
                                <p className="text-xs text-indigo-400 mt-0.5">From Roadmap</p>
                            )}
                        </div>
                    </div>
                ))}
                {activeTodos.filter(t => t.completed).length > 0 && (
                    <>
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-4 mb-2">Completed</p>
                        {activeTodos.filter(t => t.completed).map(todo => (
                            <div key={todo.id} className="flex items-center gap-3 bg-gray-900/50 rounded-xl px-4 py-3 border border-gray-800/50 opacity-60">
                                <button
                                    onClick={() => handleToggleTodo(todo.id, (todo.source as 'roadmap' | 'manual') || 'manual')}
                                    className="w-6 h-6 rounded-lg border-2 border-green-500 bg-green-500 flex items-center justify-center flex-shrink-0"
                                >
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </button>
                                <p className="text-slate-500 text-sm line-through truncate">{todo.text}</p>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );

    // ── Tab: Quick Add ─────────────────────────────────────────────────────────

    const CATEGORIES = ['Health', 'Career', 'Relationships', 'Purpose', 'Finance', 'Learning', 'Social', 'Creative'];

    const QuickAddTab = () => (
        <div className="p-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Add</h3>

            {/* Type toggle — only show goal option if roadmap is unlocked */}
            <div className="flex gap-2 mb-4 p-1 bg-gray-900 rounded-xl border border-gray-800">
                {[
                    { val: 'todo' as const, label: '📝 To-Do', desc: 'One-off task' },
                    ...(hasRoadmap ? [{ val: 'goal' as const, label: '🎯 Goal', desc: 'Add to Roadmap' }] : []),
                ].map(t => (
                    <button
                        key={t.val}
                        onClick={() => setAddType(t.val)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${addType === t.val ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <div>{t.label}</div>
                        <div className={`text-xs mt-0.5 font-normal ${addType === t.val ? 'text-indigo-200' : 'text-slate-600'}`}>{t.desc}</div>
                    </button>
                ))}
            </div>

            {!hasRoadmap && (
                <div className="mb-3 px-3 py-2 bg-indigo-900/30 border border-indigo-800/50 rounded-xl">
                    <p className="text-xs text-indigo-300">💡 Complete your <Link href="/dashboard" className="underline font-semibold">LifeFrame</Link> to add goals to your Roadmap</p>
                </div>
            )}

            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">
                        {addType === 'todo' ? 'Task' : 'Goal'} *
                    </label>
                    <textarea
                        value={addText}
                        onChange={e => setAddText(e.target.value)}
                        placeholder={addType === 'todo' ? 'What do you need to do?' : 'What goal do you want to work towards?'}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none text-sm resize-none"
                    />
                </div>

                {addType === 'goal' && (
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Category</label>
                        <div className="grid grid-cols-4 gap-1.5">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setAddCategory(addCategory === cat ? '' : cat)}
                                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${addCategory === cat ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-slate-400 border border-gray-700 hover:border-indigo-600'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={handleQuickAdd}
                    disabled={!addText.trim() || addSaving}
                    className={`w-full py-4 rounded-xl font-bold text-base transition-all ${addText.trim() && !addSaving ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                >
                    {addSaving ? 'Saving...' : `Add ${addType === 'todo' ? 'Task' : 'Goal'} ✓`}
                </button>

                {/* Quick links */}
                <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-2 gap-2">
                    <Link href="/roadmap" className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800 hover:border-indigo-700 transition">
                        <div className="text-lg">🗺️</div>
                        <p className="text-xs text-slate-400 font-semibold mt-1">Full Roadmap</p>
                    </Link>
                    <Link href="/todo" className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800 hover:border-indigo-700 transition">
                        <div className="text-lg">📋</div>
                        <p className="text-xs text-slate-400 font-semibold mt-1">Full To-Do Pad</p>
                    </Link>
                </div>
            </div>
        </div>
    );

    // ── Main Render ────────────────────────────────────────────────────────────

    const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'You';

    return (
        <div className="h-[100dvh] flex flex-col bg-gray-950 overflow-hidden">
            {/* Slim Header */}
            <header className="flex-shrink-0 flex items-center justify-between px-4 pt-safe-top pb-2 pt-4 bg-gray-950 border-b border-gray-900 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                    </div>
                    <span className="text-white font-bold text-sm">Hey, {userName}!</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-orange-500/20 px-2.5 py-1 rounded-full">
                        <span className="text-sm">🔥</span>
                        <span className="text-orange-300 text-xs font-bold">{streak.current}</span>
                    </div>
                    <Link href="/dashboard" className="text-slate-500 hover:text-white transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </Link>
                </div>
            </header>

            {/* Tab Content */}
            <main className="flex-1 overflow-y-auto">
                {activeTab === 'today' && <TodayTab />}
                {activeTab === 'feed' && <FeedTab />}
                {activeTab === 'pad' && <PadTab />}
                {activeTab === 'add' && <QuickAddTab />}
            </main>

            {/* Bottom Navigation */}
            <nav className="flex-shrink-0 bg-gray-950 border-t border-gray-900 pb-safe-bottom">
                <div className="flex">
                    {[
                        { id: 'today' as Tab, label: 'Today', Icon: TodayIcon },
                        { id: 'feed' as Tab, label: 'Feed', Icon: FeedIcon },
                        { id: 'pad' as Tab, label: 'Pad', Icon: PadIcon },
                        { id: 'add' as Tab, label: 'Add', Icon: AddIcon },
                    ].map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${activeTab === id ? 'text-indigo-400' : 'text-gray-600 hover:text-gray-400'}`}
                        >
                            <Icon filled={activeTab === id} />
                            <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
}
