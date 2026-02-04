'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';

type RoadmapItem = {
    id: string;
    category: string;
    type: 'goal' | 'behavior_change';
    title: string;
    why: string; // Why this matters (connection to values/purpose)
    activities: Activity[];
    quarter: string; // e.g., "Q1 2026"
    reflections: Reflection[];
    archived: boolean;
    archived_date?: string;
};

type Activity = {
    id: string;
    text: string;
    completed_dates: string[]; // Track when it was done
    notes: string; // What you learned from doing this
};

type Reflection = {
    id: string;
    date: string;
    what_worked: string;
    what_didnt: string;
    learning: string;
    next_steps: string;
};

type CategoryDetail = {
    name: string;
    subCategories: string[];
};

export default function RoadmapPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);
    const [activeTab, setActiveTab] = useState<'current' | 'archive' | 'reflect'>('current');
    const [categories, setCategories] = useState<CategoryDetail[]>([]);
    const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [addingTo, setAddingTo] = useState<string | null>(null);
    const [reflectingOn, setReflectingOn] = useState<string | null>(null);
    const [currentQuarter, setCurrentQuarter] = useState('Q1 2026');

    // New item form state
    const [newType, setNewType] = useState<'goal' | 'behavior_change'>('goal');
    const [newTitle, setNewTitle] = useState('');
    const [newWhy, setNewWhy] = useState('');
    const [newActivities, setNewActivities] = useState<string[]>(['', '', '']);

    // Reflection form state
    const [reflectionWhatWorked, setReflectionWhatWorked] = useState('');
    const [reflectionWhatDidnt, setReflectionWhatDidnt] = useState('');
    const [reflectionLearning, setReflectionLearning] = useState('');
    const [reflectionNextSteps, setReflectionNextSteps] = useState('');

    useEffect(() => {
        let mounted = true;

        // Calculate current quarter
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const quarter = Math.floor(month / 3) + 1;
        setCurrentQuarter(`Q${quarter} ${year}`);

        const loadRoadmap = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }
                if (!mounted) return;
                setUserId(userWithProfile.user.id);

                // Check if LifeFrame is complete
                const { data: worksheets, error: worksheetError } = await supabase
                    .from('workbook_entries')
                    .select('category')
                    .eq('user_id', userWithProfile.user.id)
                    .in('category', ['values', 'interests', 'life_categories']);

                if (worksheetError) throw worksheetError;

                const hasValues = worksheets?.some(w => w.category === 'values');
                const hasInterests = worksheets?.some(w => w.category === 'interests');
                const hasCategories = worksheets?.some(w => w.category === 'life_categories');

                if (!hasValues || !hasInterests || !hasCategories) {
                    router.push('/workbook/lifeframe');
                    return;
                }

                // Load life categories
                const { data: categoriesData } = await supabase
                    .from('workbook_entries')
                    .select('content')
                    .eq('user_id', userWithProfile.user.id)
                    .eq('category', 'life_categories')
                    .single();

                if (categoriesData && mounted) {
                    setCategories(categoriesData.content.categories || []);
                }

                // Load roadmap
                const { data: roadmapData } = await supabase
                    .from('workbook_entries')
                    .select('content')
                    .eq('user_id', userWithProfile.user.id)
                    .eq('category', 'roadmap')
                    .single();

                if (!mounted) return;

                if (!roadmapData) {
                    setShowWelcome(true);
                    setTimeout(() => {
                        if (mounted) setShowWelcome(false);
                    }, 3000);
                } else {
                    setRoadmapItems(roadmapData.content.items || []);
                }

            } catch (error) {
                console.error('Error loading Roadmap:', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadRoadmap();

        return () => {
            mounted = false;
        };
    }, [router]);

    const saveRoadmap = async () => {
        if (!userId) return;

        try {
            const { error } = await supabase
                .from('workbook_entries')
                .upsert({
                    user_id: userId,
                    category: 'roadmap',
                    content: { items: roadmapItems, updated_at: new Date().toISOString() }
                }, {
                    onConflict: 'user_id,category'
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error saving roadmap:', error);
        }
    };

    const addItem = (category: string) => {
        if (!newTitle.trim()) return;

        const newItem: RoadmapItem = {
            id: `item_${Date.now()}`,
            category,
            type: newType,
            title: newTitle,
            why: newWhy,
            activities: newActivities
                .filter(a => a.trim())
                .map(text => ({
                    id: `activity_${Date.now()}_${Math.random()}`,
                    text,
                    completed_dates: [],
                    notes: ''
                })),
            quarter: currentQuarter,
            reflections: [],
            archived: false
        };

        const updatedItems = [...roadmapItems, newItem];
        setRoadmapItems(updatedItems);

        // Reset form
        setNewTitle('');
        setNewWhy('');
        setNewType('goal');
        setNewActivities(['', '', '']);
        setAddingTo(null);

        // Save with the updated items
        saveRoadmapImmediate(updatedItems);
    };

    const saveRoadmapImmediate = async (items: RoadmapItem[]) => {
        if (!userId) return;

        try {
            const { error } = await supabase
                .from('workbook_entries')
                .upsert({
                    user_id: userId,
                    category: 'roadmap',
                    content: { items, updated_at: new Date().toISOString() }
                }, {
                    onConflict: 'user_id,category'
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error saving roadmap:', error);
        }
    };

    const logActivity = (itemId: string, activityId: string) => {
        const today = new Date().toISOString().split('T')[0];

        const updatedItems = roadmapItems.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    activities: item.activities.map(activity => {
                        if (activity.id === activityId) {
                            // Toggle: if already logged today, remove it; otherwise add it
                            const hasToday = activity.completed_dates.includes(today);
                            return {
                                ...activity,
                                completed_dates: hasToday
                                    ? activity.completed_dates.filter(d => d !== today)
                                    : [...activity.completed_dates, today]
                            };
                        }
                        return activity;
                    })
                };
            }
            return item;
        });

        setRoadmapItems(updatedItems);
        saveRoadmapImmediate(updatedItems);
    };

    const addReflection = (itemId: string) => {
        if (!reflectionLearning.trim()) return;

        const newReflection: Reflection = {
            id: `reflection_${Date.now()}`,
            date: new Date().toISOString(),
            what_worked: reflectionWhatWorked,
            what_didnt: reflectionWhatDidnt,
            learning: reflectionLearning,
            next_steps: reflectionNextSteps
        };

        const updatedItems = roadmapItems.map(item =>
            item.id === itemId
                ? { ...item, reflections: [...item.reflections, newReflection] }
                : item
        );

        setRoadmapItems(updatedItems);

        // Reset reflection form
        setReflectionWhatWorked('');
        setReflectionWhatDidnt('');
        setReflectionLearning('');
        setReflectionNextSteps('');
        setReflectingOn(null);

        saveRoadmapImmediate(updatedItems);
    };

    const archiveItem = (itemId: string) => {
        const updatedItems = roadmapItems.map(item =>
            item.id === itemId
                ? { ...item, archived: true, archived_date: new Date().toISOString() }
                : item
        );
        setRoadmapItems(updatedItems);
        saveRoadmapImmediate(updatedItems);
    };

    const unarchiveItem = (itemId: string) => {
        const updatedItems = roadmapItems.map(item =>
            item.id === itemId
                ? { ...item, archived: false, archived_date: undefined, quarter: currentQuarter }
                : item
        );
        setRoadmapItems(updatedItems);
        saveRoadmapImmediate(updatedItems);
    };

    // Helper function to get category icon
    const getCategoryIcon = (categoryName: string) => {
        const iconMap: Record<string, string> = {
            'Health': '💪',
            'Relationships': '❤️',
            'Social': '🤝',
            'Learning': '📚',
            'Career': '💼',
            'Finance': '💰',
            'Spiritual': '🙏',
            'Creative': '🎨'
        };
        return iconMap[categoryName] || '⭐';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-800">Loading your Roadmap...</p>
                </div>
            </div>
        );
    }

    // Welcome Animation
    if (showWelcome) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <div className="mb-8">
                        {categories.map((cat, index) => (
                            <div
                                key={cat.name}
                                className="inline-block mx-2 animate-bounce"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-2xl">
                                    {getCategoryIcon(cat.name)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <h1 className="text-6xl font-bold text-white mb-4 animate-pulse">
                        Creating Your Roadmap
                    </h1>
                    <p className="text-2xl text-purple-200">
                        Your journey to contentment begins...
                    </p>
                </div>
            </div>
        );
    }

    const activeItems = roadmapItems.filter(item => !item.archived);
    const archivedItems = roadmapItems.filter(item => item.archived);

    return (
        <>
            <AuthNavbar />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pt-16">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
                    <div className="max-w-7xl mx-auto px-4 py-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl">
                                    🗺️
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Your Roadmap</h1>
                                    <p className="text-gray-800">{currentQuarter} • Continuous Improvement</p>
                                </div>
                            </div>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="text-gray-800 hover:text-gray-900"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Philosophy Reminder */}
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">💡</div>
                                <div className="text-sm text-gray-800">
                                    <strong>Remember:</strong> Your Roadmap is about <strong>learning and growing</strong>, not checking boxes.
                                    Success = effort + learning, whether you "achieve" the goal or not. Update activities every 3 months based on what you learn.
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                                <div className="text-2xl font-bold text-indigo-600">{activeItems.length}</div>
                                <div className="text-sm text-gray-800">Active {currentQuarter}</div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                                <div className="text-2xl font-bold text-purple-600">
                                    {activeItems.reduce((sum, item) => sum + item.reflections.length, 0)}
                                </div>
                                <div className="text-sm text-gray-800">Reflections</div>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                                <div className="text-2xl font-bold text-green-600">{archivedItems.length}</div>
                                <div className="text-sm text-gray-800">Archived</div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mt-4 border-b border-gray-200">
                            {[
                                { id: 'current', label: `${currentQuarter}`, icon: '🎯' },
                                { id: 'reflect', label: 'Reflect & Learn', icon: '💭' },
                                { id: 'archive', label: 'Archive', icon: '📦' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`
                    px-6 py-3 font-semibold transition-all
                    ${activeTab === tab.id
                                            ? 'border-b-4 border-indigo-600 text-indigo-600'
                                            : 'text-gray-800 hover:text-gray-900'
                                        }
                  `}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 py-8">
                    {/* Current Quarter Tab */}
                    {activeTab === 'current' && (
                        <div className="space-y-6">
                            {categories.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="text-6xl mb-4">🎯</div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Your LifeFrame First</h2>
                                    <button
                                        onClick={() => router.push('/workbook/lifeframe')}
                                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700"
                                    >
                                        Go to LifeFrame
                                    </button>
                                </div>
                            ) : (
                                categories.map(category => {
                                    const categoryItems = activeItems.filter(item => item.category === category.name);
                                    const isExpanded = expandedCategory === category.name;

                                    return (
                                        <div key={category.name} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                            {/* Category Header */}
                                            <button
                                                onClick={() => setExpandedCategory(isExpanded ? null : category.name)}
                                                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl">
                                                        {getCategoryIcon(category.name)}
                                                    </div>
                                                    <div className="text-left">
                                                        <h3 className="text-xl font-bold text-gray-900">{category.name}</h3>
                                                        <p className="text-sm text-gray-800">{categoryItems.length} active items</p>
                                                    </div>
                                                </div>
                                                <svg
                                                    className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {/* Expanded Content */}
                                            {isExpanded && (
                                                <div className="p-6 pt-0 space-y-4">
                                                    {/* Existing Items */}
                                                    {categoryItems.map(item => (
                                                        <div key={item.id} className="border-2 border-indigo-100 rounded-xl p-6 bg-gradient-to-br from-white to-indigo-50">
                                                            <div className="flex items-start justify-between mb-4">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <h4 className="font-bold text-xl text-gray-900">{item.title}</h4>
                                                                        <span className={`
                                      px-3 py-1 rounded-full text-xs font-bold
                                      ${item.type === 'goal' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'}
                                    `}>
                                                                            {item.type === 'goal' ? '🎯 Goal' : '🔄 Behavior Change'}
                                                                        </span>
                                                                    </div>
                                                                    {item.why && (
                                                                        <p className="text-sm text-gray-700 italic mb-3">
                                                                            <strong>Why this matters:</strong> {item.why}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => archiveItem(item.id)}
                                                                    className="text-purple-600 hover:text-purple-800 font-semibold text-sm whitespace-nowrap"
                                                                >
                                                                    📦 Archive
                                                                </button>
                                                            </div>

                                                            {/* Activities - Focus on DOING */}
                                                            <div className="space-y-3 mb-4">
                                                                <h5 className="font-semibold text-gray-900">Activities (3-month window):</h5>
                                                                {item.activities.map(activity => {
                                                                    const today = new Date().toISOString().split('T')[0];
                                                                    const doneToday = activity.completed_dates.includes(today);
                                                                    const doneCount = activity.completed_dates.length;

                                                                    return (
                                                                        <div key={activity.id} className="bg-white rounded-lg p-4 border-2 border-gray-200">
                                                                            <div className="flex items-center gap-3 mb-2">
                                                                                <button
                                                                                    onClick={() => logActivity(item.id, activity.id)}
                                                                                    className={`
                                            w-10 h-10 rounded-lg flex items-center justify-center font-bold transition
                                            ${doneToday
                                                                                            ? 'bg-green-500 text-white'
                                                                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-400'
                                                                                        }
                                          `}
                                                                                >
                                                                                    {doneToday ? '✓' : '○'}
                                                                                </button>
                                                                                <div className="flex-1">
                                                                                    <span className="text-gray-900 font-medium">{activity.text}</span>
                                                                                    <div className="text-xs text-gray-600 mt-1">
                                                                                        {doneCount > 0 ? `Done ${doneCount} times` : 'Not started yet'}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            {activity.notes && (
                                                                                <div className="ml-13 text-sm text-gray-700 bg-yellow-50 p-2 rounded">
                                                                                    <strong>Notes:</strong> {activity.notes}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* Reflections */}
                                                            {item.reflections.length > 0 && (
                                                                <div className="mb-4">
                                                                    <h5 className="font-semibold text-gray-900 mb-2">Past Reflections:</h5>
                                                                    <div className="space-y-2">
                                                                        {item.reflections.map(reflection => (
                                                                            <div key={reflection.id} className="bg-purple-50 rounded-lg p-3 text-sm">
                                                                                <div className="font-semibold text-purple-900 mb-1">
                                                                                    {new Date(reflection.date).toLocaleDateString()}
                                                                                </div>
                                                                                <div className="text-gray-800">
                                                                                    <strong>Learned:</strong> {reflection.learning}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Add Reflection Button */}
                                                            <button
                                                                onClick={() => setReflectingOn(item.id)}
                                                                className="w-full py-3 border-2 border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 font-semibold transition"
                                                            >
                                                                💭 Add Reflection
                                                            </button>

                                                            {/* Reflection Form */}
                                                            {reflectingOn === item.id && (
                                                                <div className="mt-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                                                                    <h5 className="font-bold text-gray-900 mb-3">Reflect on This {item.type === 'goal' ? 'Goal' : 'Behavior Change'}</h5>
                                                                    <div className="space-y-3">
                                                                        <div>
                                                                            <label className="block text-sm font-semibold text-gray-800 mb-1">What worked well?</label>
                                                                            <textarea
                                                                                rows={2}
                                                                                value={reflectionWhatWorked}
                                                                                onChange={(e) => setReflectionWhatWorked(e.target.value)}
                                                                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none text-gray-900"
                                                                                placeholder="What activities were effective?"
                                                                            ></textarea>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-sm font-semibold text-gray-800 mb-1">What didn't work?</label>
                                                                            <textarea
                                                                                rows={2}
                                                                                value={reflectionWhatDidnt}
                                                                                onChange={(e) => setReflectionWhatDidnt(e.target.value)}
                                                                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none text-gray-900"
                                                                                placeholder="What obstacles did you face?"
                                                                            ></textarea>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-sm font-semibold text-gray-800 mb-1">What did you learn? *</label>
                                                                            <textarea
                                                                                rows={3}
                                                                                value={reflectionLearning}
                                                                                onChange={(e) => setReflectionLearning(e.target.value)}
                                                                                className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-600 focus:outline-none text-gray-900"
                                                                                placeholder="This is the most important part! What insights did you gain?"
                                                                            ></textarea>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-sm font-semibold text-gray-800 mb-1">Next steps?</label>
                                                                            <textarea
                                                                                rows={2}
                                                                                value={reflectionNextSteps}
                                                                                onChange={(e) => setReflectionNextSteps(e.target.value)}
                                                                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none text-gray-900"
                                                                                placeholder="What will you try next?"
                                                                            ></textarea>
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={() => addReflection(item.id)}
                                                                                disabled={!reflectionLearning.trim()}
                                                                                className={`
                                          flex-1 py-2 rounded-lg font-bold transition
                                          ${reflectionLearning.trim()
                                                                                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                                                                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                                    }
                                        `}
                                                                            >
                                                                                Save Reflection
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setReflectingOn(null)}
                                                                                className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-800 hover:bg-gray-100"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {/* Add New Item Form */}
                                                    {addingTo === category.name ? (
                                                        <div className="border-2 border-dashed border-indigo-300 rounded-xl p-6 bg-indigo-50">
                                                            <h4 className="font-bold text-gray-900 mb-4">Add Goal or Behavior Change</h4>

                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="block text-sm font-semibold text-gray-800 mb-2">Type</label>
                                                                    <div className="flex gap-2">
                                                                        {[
                                                                            { value: 'goal', label: 'Goal', icon: '🎯', desc: 'Something to work towards' },
                                                                            { value: 'behavior_change', label: 'Behavior Change', icon: '🔄', desc: 'A habit to develop' }
                                                                        ].map(type => (
                                                                            <button
                                                                                key={type.value}
                                                                                onClick={() => setNewType(type.value as any)}
                                                                                className={`
                                          flex-1 p-3 rounded-lg font-semibold transition text-left
                                          ${newType === type.value
                                                                                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                                                                                        : 'bg-white text-gray-800 hover:bg-gray-100'
                                                                                    }
                                        `}
                                                                            >
                                                                                <div>{type.icon} {type.label}</div>
                                                                                <div className="text-xs mt-1 opacity-80">{type.desc}</div>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                                        {newType === 'goal' ? 'What\'s your goal?' : 'What behavior do you want to change?'}
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder={newType === 'goal' ? 'e.g., Start LifeAligner business' : 'e.g., Exercise 5 days/week'}
                                                                        value={newTitle}
                                                                        onChange={(e) => setNewTitle(e.target.value)}
                                                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none text-gray-900"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                                        Why does this matter to you?
                                                                    </label>
                                                                    <textarea
                                                                        rows={2}
                                                                        placeholder="Connect this to your values or purpose..."
                                                                        value={newWhy}
                                                                        onChange={(e) => setNewWhy(e.target.value)}
                                                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none text-gray-900"
                                                                    ></textarea>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                                        Activities (3-month window) - What will you actually DO?
                                                                    </label>
                                                                    <p className="text-xs text-gray-600 mb-2">
                                                                        Aim for 3-5 concrete actions. Example: "Hire developer", "Talk to 10 potential users", "Build MVP"
                                                                    </p>
                                                                    {newActivities.map((activity, index) => (
                                                                        <div key={index} className="flex gap-2 mb-2">
                                                                            <input
                                                                                type="text"
                                                                                placeholder={`Activity ${index + 1}`}
                                                                                value={activity}
                                                                                onChange={(e) => {
                                                                                    const updated = [...newActivities];
                                                                                    updated[index] = e.target.value;
                                                                                    setNewActivities(updated);
                                                                                }}
                                                                                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none text-gray-900"
                                                                            />
                                                                            {index > 2 && (
                                                                                <button
                                                                                    onClick={() => setNewActivities(newActivities.filter((_, i) => i !== index))}
                                                                                    className="text-red-500 hover:text-red-700 px-2"
                                                                                >
                                                                                    ✕
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    <button
                                                                        onClick={() => setNewActivities([...newActivities, ''])}
                                                                        className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold"
                                                                    >
                                                                        + Add Activity
                                                                    </button>
                                                                </div>

                                                                <div className="flex gap-3 pt-2">
                                                                    <button
                                                                        onClick={() => addItem(category.name)}
                                                                        disabled={!newTitle.trim()}
                                                                        className={`
                                      flex-1 py-3 rounded-lg font-bold transition
                                      ${newTitle.trim()
                                                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                            }
                                    `}
                                                                    >
                                                                        Add to Roadmap
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setAddingTo(null)}
                                                                        className="px-6 py-3 border-2 border-gray-300 rounded-lg font-bold text-gray-800 hover:border-gray-400 transition"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setAddingTo(category.name)}
                                                            className="w-full py-4 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 hover:bg-indigo-50 font-semibold transition"
                                                        >
                                                            + Add to {category.name}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Reflect & Learn Tab */}
                    {activeTab === 'reflect' && (
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quarterly Reflection</h2>
                            <p className="text-gray-800 mb-6">
                                Learning from your experiences is how you grow. Reflect on what you've tried and what you've learned.
                            </p>

                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-green-50 rounded-xl p-6">
                                    <h3 className="font-bold text-green-900 mb-2">✓ What's Working</h3>
                                    <ul className="space-y-2 text-sm">
                                        {activeItems.flatMap(item =>
                                            item.reflections
                                                .filter(r => r.what_worked)
                                                .slice(-3)
                                                .map(r => (
                                                    <li key={r.id} className="text-gray-800">• {r.what_worked}</li>
                                                ))
                                        )}
                                    </ul>
                                </div>
                                <div className="bg-orange-50 rounded-xl p-6">
                                    <h3 className="font-bold text-orange-900 mb-2">💡 Key Learnings</h3>
                                    <ul className="space-y-2 text-sm">
                                        {activeItems.flatMap(item =>
                                            item.reflections
                                                .slice(-3)
                                                .map(r => (
                                                    <li key={r.id} className="text-gray-800">• {r.learning}</li>
                                                ))
                                        )}
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                                <h3 className="font-bold text-purple-900 mb-4">Remember:</h3>
                                <ul className="space-y-2 text-gray-800">
                                    <li>✓ <strong>Multiple outcomes can be positive</strong> - Progress is success</li>
                                    <li>✓ <strong>Negative outcomes can be positive</strong> - Learning is valuable</li>
                                    <li>✓ <strong>It's about the journey</strong> - Not the destination</li>
                                    <li>✓ <strong>Update every 3 months</strong> - Based on what you learned</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Archive Tab */}
                    {activeTab === 'archive' && (
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Archived Goals & Behaviors</h2>
                                <p className="text-gray-800">
                                    These aren't "completed" or "failed" — they're your learning history. Review them to see how far you've come.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {archivedItems.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <p>No archived items yet. Keep working on your current goals!</p>
                                    </div>
                                ) : (
                                    archivedItems.map(item => (
                                        <div key={item.id} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-gray-900">{item.title}</h3>
                                                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                                            {item.category}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        Archived: {item.archived_date ? new Date(item.archived_date).toLocaleDateString() : 'Unknown'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => unarchiveItem(item.id)}
                                                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                                                >
                                                    ↩ Unarchive
                                                </button>
                                            </div>

                                            {/* Show learnings from this item */}
                                            {item.reflections.length > 0 && (
                                                <div className="mt-4 space-y-2">
                                                    <h4 className="text-sm font-semibold text-gray-700">What You Learned:</h4>
                                                    {item.reflections.map(reflection => (
                                                        <div key={reflection.id} className="bg-white rounded p-3 text-sm">
                                                            <div className="text-gray-600 text-xs mb-1">
                                                                {new Date(reflection.date).toLocaleDateString()}
                                                            </div>
                                                            <div className="text-gray-800">{reflection.learning}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Show activities that were tried */}
                                            <div className="mt-4">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Activities Tried:</h4>
                                                <div className="space-y-1">
                                                    {item.activities.map(activity => (
                                                        <div key={activity.id} className="text-sm text-gray-600">
                                                            • {activity.text} ({activity.completed_dates.length} times)
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
