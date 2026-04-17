'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';

interface JournalEntry {
    goalTitle: string;
    category: string;
    completedDate: string;
    reflection: string;
    createdAt: string;
    prompt: string;
}

const REFLECTION_PROMPTS = [
    "What did you learn from pursuing this goal?",
    "How did this experience change you as a person?",
    "What would you do differently next time?",
    "Who helped you along the way, and how?",
    "What surprised you most during this journey?",
    "What skills did you develop or strengthen?",
    "How does completing this connect to your deeper values?",
    "What advice would you give someone starting this goal?",
];

export default function JourneyJournalPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [showNewEntry, setShowNewEntry] = useState(false);
    const [saving, setSaving] = useState(false);

    // New entry state
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [newCompletedDate, setNewCompletedDate] = useState(new Date().toISOString().split('T')[0]);
    const [newReflection, setNewReflection] = useState('');
    const [activePrompt, setActivePrompt] = useState(REFLECTION_PROMPTS[0]);

    // Editing state
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editReflection, setEditReflection] = useState('');

    useEffect(() => {
        const init = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }
                setUserId(userWithProfile.user.id);

                // Load existing entries
                const { data, error } = await supabase
                    .from('workbook_entries')
                    .select('content')
                    .eq('user_id', userWithProfile.user.id)
                    .eq('category', 'journal')
                    .single();

                if (data && !error) {
                    setEntries(data.content?.entries || []);
                }
            } catch (error) {
                console.error('Auth check error:', error);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [router]);

    const saveEntries = async (updatedEntries: JournalEntry[]) => {
        if (!userId) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('workbook_entries')
                .upsert({
                    user_id: userId,
                    category: 'journal',
                    content: { entries: updatedEntries }
                }, {
                    onConflict: 'user_id,category'
                });
            if (error) throw error;
            setEntries(updatedEntries);
        } catch (err) {
            console.error('Error saving journal:', err);
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const addEntry = async () => {
        if (!newGoalTitle.trim()) return;
        const entry: JournalEntry = {
            goalTitle: newGoalTitle.trim(),
            category: newCategory.trim() || 'General',
            completedDate: newCompletedDate,
            reflection: newReflection.trim(),
            createdAt: new Date().toISOString(),
            prompt: activePrompt,
        };
        await saveEntries([entry, ...entries]);
        setNewGoalTitle('');
        setNewCategory('');
        setNewCompletedDate(new Date().toISOString().split('T')[0]);
        setNewReflection('');
        setShowNewEntry(false);
        setActivePrompt(REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)]);
    };

    const updateReflection = async (index: number) => {
        const updated = [...entries];
        updated[index] = { ...updated[index], reflection: editReflection.trim() };
        await saveEntries(updated);
        setEditingIndex(null);
        setEditReflection('');
    };

    const deleteEntry = async (index: number) => {
        const updated = entries.filter((_, i) => i !== index);
        await saveEntries(updated);
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            Health: '💪', Career: '💼', Relationships: '❤️', Purpose: '🎯',
            Social: '🤝', Learning: '📚', Finance: '💰', Spiritual: '🙏',
            Creative: '🎨', General: '⭐',
        };
        return icons[category] || '⭐';
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            Health: 'from-green-500 to-emerald-600',
            Career: 'from-blue-500 to-indigo-600',
            Relationships: 'from-pink-500 to-rose-600',
            Purpose: 'from-yellow-500 to-amber-600',
            Social: 'from-teal-500 to-cyan-600',
            Learning: 'from-violet-500 to-purple-600',
            Finance: 'from-emerald-500 to-green-600',
            Spiritual: 'from-indigo-500 to-blue-600',
            Creative: 'from-orange-500 to-red-500',
            General: 'from-gray-500 to-gray-600',
        };
        return colors[category] || 'from-gray-500 to-gray-600';
    };

    if (loading) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 pt-16 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading your journey...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <AuthNavbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 pt-16">
                <div className="max-w-4xl mx-auto px-4 py-12">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 bg-indigo-500/20 px-4 py-2 rounded-full text-xs font-bold text-indigo-300 uppercase tracking-wider mb-4">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Journey Journal
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3" style={{ textShadow: '0 0 40px rgba(139,92,246,0.5)' }}>
                            Your Journey So Far
                        </h1>
                        <p className="text-slate-400 text-lg max-w-lg mx-auto">
                            Reflect on completed goals and capture what you've learned along the way.
                        </p>
                    </div>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                            <div className="text-3xl font-bold text-white">{entries.length}</div>
                            <div className="text-xs text-slate-400 font-medium">Goals Reflected</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                            <div className="text-3xl font-bold text-white">{entries.filter(e => e.reflection).length}</div>
                            <div className="text-xs text-slate-400 font-medium">Reflections Written</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                            <div className="text-3xl font-bold text-white">
                                {new Set(entries.map(e => e.category)).size}
                            </div>
                            <div className="text-xs text-slate-400 font-medium">Categories</div>
                        </div>
                    </div>

                    {/* Add Entry Button */}
                    {!showNewEntry && (
                        <button
                            onClick={() => setShowNewEntry(true)}
                            className="w-full mb-8 py-4 border-2 border-dashed border-indigo-500/40 rounded-2xl text-indigo-400 font-semibold hover:bg-indigo-500/10 hover:border-indigo-400/60 transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Record a Completed Goal
                        </button>
                    )}

                    {/* New Entry Form */}
                    {showNewEntry && (
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8 animate-fade-in">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span className="text-2xl">🎯</span>
                                Record a Completed Goal
                            </h3>

                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Goal Title *</label>
                                    <input
                                        type="text"
                                        value={newGoalTitle}
                                        onChange={(e) => setNewGoalTitle(e.target.value)}
                                        placeholder="e.g., Ran my first 5K"
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                                        <input
                                            type="text"
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            placeholder="e.g., Health"
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Completed</label>
                                        <input
                                            type="date"
                                            value={newCompletedDate}
                                            onChange={(e) => setNewCompletedDate(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-indigo-400 focus:outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Reflection Prompt */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reflection</label>
                                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-4 py-2.5 mb-3 flex items-start gap-2">
                                    <span className="text-indigo-400 text-sm mt-0.5">💡</span>
                                    <div className="flex-1">
                                        <p className="text-indigo-300 text-sm italic">{activePrompt}</p>
                                        <button
                                            onClick={() => setActivePrompt(REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)])}
                                            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium mt-1 transition"
                                        >
                                            ↻ Different prompt
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    value={newReflection}
                                    onChange={(e) => setNewReflection(e.target.value)}
                                    placeholder="Share your thoughts..."
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none text-sm resize-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={addEntry}
                                    disabled={!newGoalTitle.trim() || saving}
                                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Saving...' : '✓ Save Entry'}
                                </button>
                                <button
                                    onClick={() => setShowNewEntry(false)}
                                    className="px-6 py-3 border border-white/20 text-slate-400 rounded-xl font-semibold hover:bg-white/5 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    {entries.length === 0 && !showNewEntry ? (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">📖</div>
                            <h3 className="text-xl font-bold text-white mb-2">Your Journal Awaits</h3>
                            <p className="text-slate-400 max-w-md mx-auto">
                                When you complete goals on your roadmap, record them here with reflections
                                to track your growth over time.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {entries.map((entry, index) => (
                                <div
                                    key={index}
                                    className="relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all group"
                                >
                                    {/* Category Accent Bar */}
                                    <div className={`h-1.5 bg-gradient-to-r ${getCategoryColor(entry.category)}`} />

                                    <div className="p-6">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 bg-gradient-to-br ${getCategoryColor(entry.category)} rounded-xl flex items-center justify-center text-lg shadow-lg flex-shrink-0`}>
                                                    {getCategoryIcon(entry.category)}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white">{entry.goalTitle}</h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs font-semibold text-indigo-400">{entry.category}</span>
                                                        <span className="text-xs text-slate-500">•</span>
                                                        <span className="text-xs text-slate-400">
                                                            Completed {new Date(entry.completedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => deleteEntry(index)}
                                                className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                                title="Delete entry"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Reflection */}
                                        {editingIndex === index ? (
                                            <div className="mt-3">
                                                <textarea
                                                    value={editReflection}
                                                    onChange={(e) => setEditReflection(e.target.value)}
                                                    rows={3}
                                                    className="w-full px-4 py-3 bg-white/10 border border-indigo-400/40 rounded-xl text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none text-sm resize-none"
                                                    placeholder="Add your reflection..."
                                                />
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => updateReflection(index)}
                                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingIndex(null); setEditReflection(''); }}
                                                        className="px-4 py-2 text-slate-400 hover:text-white text-sm transition"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : entry.reflection ? (
                                            <div className="mt-3 bg-white/5 rounded-xl p-4 border border-white/10">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-slate-500 text-sm mt-0.5">💭</span>
                                                    <p className="text-slate-300 text-sm leading-relaxed flex-1">{entry.reflection}</p>
                                                </div>
                                                <button
                                                    onClick={() => { setEditingIndex(index); setEditReflection(entry.reflection); }}
                                                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium mt-2 transition"
                                                >
                                                    Edit reflection
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setEditingIndex(index); setEditReflection(''); }}
                                                className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                Add a reflection
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
