'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';

type Goal = {
    id: string;
    category: string;
    title: string;
    type: 'goal' | 'habit' | 'behavior_change';
    target_date: string | null;
    progress: number;
    activities: Activity[];
    created_at: string;
    completed: boolean;
};

type Activity = {
    id: string;
    text: string;
    is_habit: boolean;
    habit_days?: boolean[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    completed: boolean;
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
    const [activeTab, setActiveTab] = useState<'active' | 'habits' | 'archive' | 'reflect'>('active');
    const [categories, setCategories] = useState<CategoryDetail[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [addingGoalTo, setAddingGoalTo] = useState<string | null>(null);

    // New goal form state
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [newGoalType, setNewGoalType] = useState<'goal' | 'habit' | 'behavior_change'>('goal');
    const [newGoalDate, setNewGoalDate] = useState('');
    const [newActivities, setNewActivities] = useState<string[]>(['']);

    // Stats
    const [stats, setStats] = useState({
        totalGoals: 0,
        completedGoals: 0,
        currentStreak: 0,
        longestStreak: 0,
        weeklyProgress: 0
    });

    useEffect(() => {
        const loadRoadmap = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }
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

                if (categoriesData) {
                    setCategories(categoriesData.content.categories || []);
                }

                // Check if this is first time visiting Roadmap
                const { data: roadmapData } = await supabase
                    .from('workbook_entries')
                    .select('content')
                    .eq('user_id', userWithProfile.user.id)
                    .eq('category', 'roadmap')
                    .single();

                if (!roadmapData) {
                    // First time - show welcome animation
                    setShowWelcome(true);
                    setTimeout(() => setShowWelcome(false), 3000);
                } else {
                    // Load existing goals
                    setGoals(roadmapData.content.goals || []);
                    calculateStats(roadmapData.content.goals || []);
                }

            } catch (error) {
                console.error('Error loading Roadmap:', error);
            } finally {
                setLoading(false);
            }
        };

        loadRoadmap();
    }, [router]);

    const calculateStats = (goalsList: Goal[]) => {
        const total = goalsList.length;
        const completed = goalsList.filter(g => g.completed).length;

        // Calculate weekly progress based on habits completed this week
        let habitsCompleted = 0;
        let totalHabits = 0;

        goalsList.forEach(goal => {
            goal.activities.forEach(activity => {
                if (activity.is_habit && activity.habit_days) {
                    totalHabits += 7;
                    habitsCompleted += activity.habit_days.filter(Boolean).length;
                }
            });
        });

        const weeklyProgress = totalHabits > 0 ? Math.round((habitsCompleted / totalHabits) * 100) : 0;

        setStats({
            totalGoals: total,
            completedGoals: completed,
            currentStreak: 0, // Calculate based on consecutive days
            longestStreak: 0,
            weeklyProgress
        });
    };

    const saveRoadmap = async () => {
        if (!userId) return;

        try {
            const { error } = await supabase
                .from('workbook_entries')
                .upsert({
                    user_id: userId,
                    category: 'roadmap',
                    content: { goals }
                }, {
                    onConflict: 'user_id,category'
                });

            if (error) throw error;
            calculateStats(goals);
        } catch (error) {
            console.error('Error saving roadmap:', error);
        }
    };

    const addGoal = (category: string) => {
        if (!newGoalTitle.trim()) return;

        const newGoal: Goal = {
            id: `goal_${Date.now()}`,
            category,
            title: newGoalTitle,
            type: newGoalType,
            target_date: newGoalDate || null,
            progress: 0,
            activities: newActivities
                .filter(a => a.trim())
                .map(text => ({
                    id: `activity_${Date.now()}_${Math.random()}`,
                    text,
                    is_habit: newGoalType === 'habit',
                    habit_days: newGoalType === 'habit' ? [false, false, false, false, false, false, false] : undefined,
                    completed: false
                })),
            created_at: new Date().toISOString(),
            completed: false
        };

        setGoals([...goals, newGoal]);

        // Reset form
        setNewGoalTitle('');
        setNewGoalType('goal');
        setNewGoalDate('');
        setNewActivities(['']);
        setAddingGoalTo(null);

        // Save immediately
        setTimeout(saveRoadmap, 100);
    };

    const toggleHabitDay = (goalId: string, activityId: string, dayIndex: number) => {
        setGoals(goals.map(goal => {
            if (goal.id === goalId) {
                return {
                    ...goal,
                    activities: goal.activities.map(activity => {
                        if (activity.id === activityId && activity.habit_days) {
                            const newDays = [...activity.habit_days];
                            newDays[dayIndex] = !newDays[dayIndex];
                            return { ...activity, habit_days: newDays };
                        }
                        return activity;
                    })
                };
            }
            return goal;
        }));

        setTimeout(saveRoadmap, 100);
    };

    const updateGoalProgress = (goalId: string, progress: number) => {
        setGoals(goals.map(goal =>
            goal.id === goalId ? { ...goal, progress } : goal
        ));
        setTimeout(saveRoadmap, 100);
    };

    const completeGoal = (goalId: string) => {
        setGoals(goals.map(goal =>
            goal.id === goalId ? { ...goal, completed: true, progress: 100 } : goal
        ));
        setTimeout(saveRoadmap, 100);
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
                                    {['💪', '❤️', '🤝', '📚', '💼', '💰', '🙏', '🎨'][index] || '⭐'}
                                </div>
                            </div>
                        ))}
                    </div>
                    <h1 className="text-6xl font-bold text-white mb-4 animate-pulse">
                        Creating Your Roadmap
                    </h1>
                    <p className="text-2xl text-purple-200">
                        Bringing your LifeFrame to life...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <AuthNavbar />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pt-16">
                {/* Header with Stats */}
                <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl">
                                    🗺️
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Your Roadmap</h1>
                                    <p className="text-gray-800">Q1 2026 • Your path to contentment</p>
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

                        {/* Stats Bar */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                                <div className="text-2xl font-bold text-indigo-600">{stats.totalGoals}</div>
                                <div className="text-sm text-gray-800">Active Goals</div>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                                <div className="text-2xl font-bold text-green-600">{stats.completedGoals}</div>
                                <div className="text-sm text-gray-800">Completed</div>
                            </div>
                            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4">
                                <div className="text-2xl font-bold text-orange-600">{stats.currentStreak} 🔥</div>
                                <div className="text-sm text-gray-800">Day Streak</div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                                <div className="text-2xl font-bold text-purple-600">{stats.weeklyProgress}%</div>
                                <div className="text-sm text-gray-800">This Week</div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 mt-4 border-b border-gray-200">
                            {[
                                { id: 'active', label: 'Active Goals', icon: '🎯' },
                                { id: 'habits', label: 'Habits', icon: '✓' },
                                { id: 'archive', label: 'Archive', icon: '📦' },
                                { id: 'reflect', label: 'Reflect', icon: '💭' }
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
                    {/* Active Goals Tab */}
                    {activeTab === 'active' && (
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
                                    const categoryGoals = goals.filter(g => g.category === category.name && !g.completed);
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
                                                        {['💪', '❤️', '🤝', '📚', '💼', '💰', '🙏', '🎨'][categories.indexOf(category)] || '⭐'}
                                                    </div>
                                                    <div className="text-left">
                                                        <h3 className="text-xl font-bold text-gray-900">{category.name}</h3>
                                                        <p className="text-sm text-gray-800">{categoryGoals.length} active goals</p>
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
                                                    {/* Existing Goals */}
                                                    {categoryGoals.map(goal => (
                                                        <div key={goal.id} className="border-2 border-indigo-100 rounded-xl p-4">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <h4 className="font-bold text-gray-900">{goal.title}</h4>
                                                                        <span className={`
                                      px-2 py-1 rounded-full text-xs font-semibold
                                      ${goal.type === 'goal' ? 'bg-blue-100 text-blue-700' : ''}
                                      ${goal.type === 'habit' ? 'bg-green-100 text-green-700' : ''}
                                      ${goal.type === 'behavior_change' ? 'bg-purple-100 text-purple-700' : ''}
                                    `}>
                                                                            {goal.type.replace('_', ' ')}
                                                                        </span>
                                                                    </div>
                                                                    {goal.target_date && (
                                                                        <p className="text-sm text-gray-800">
                                                                            Target: {new Date(goal.target_date).toLocaleDateString()}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => completeGoal(goal.id)}
                                                                    className="text-green-600 hover:text-green-700 font-semibold text-sm"
                                                                >
                                                                    ✓ Complete
                                                                </button>
                                                            </div>

                                                            {/* Progress Bar */}
                                                            <div className="mb-4">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-sm font-semibold text-gray-800">Progress</span>
                                                                    <span className="text-sm font-bold text-indigo-600">{goal.progress}%</span>
                                                                </div>
                                                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                                                                        style={{ width: `${goal.progress}%` }}
                                                                    ></div>
                                                                </div>
                                                                <input
                                                                    type="range"
                                                                    min="0"
                                                                    max="100"
                                                                    value={goal.progress}
                                                                    onChange={(e) => updateGoalProgress(goal.id, parseInt(e.target.value))}
                                                                    className="w-full mt-2"
                                                                />
                                                            </div>

                                                            {/* Activities */}
                                                            <div className="space-y-2">
                                                                {goal.activities.map(activity => (
                                                                    <div key={activity.id} className="bg-gray-50 rounded-lg p-3">
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={activity.completed}
                                                                                onChange={() => {
                                                                                    setGoals(goals.map(g =>
                                                                                        g.id === goal.id ? {
                                                                                            ...g,
                                                                                            activities: g.activities.map(a =>
                                                                                                a.id === activity.id ? { ...a, completed: !a.completed } : a
                                                                                            )
                                                                                        } : g
                                                                                    ));
                                                                                    setTimeout(saveRoadmap, 100);
                                                                                }}
                                                                                className="w-5 h-5 rounded border-2 border-gray-300"
                                                                            />
                                                                            <span className={`flex-1 ${activity.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                                                                {activity.text}
                                                                            </span>
                                                                        </div>

                                                                        {/* Habit Tracker */}
                                                                        {activity.is_habit && activity.habit_days && (
                                                                            <div className="flex gap-1 ml-8">
                                                                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                                                                                    <button
                                                                                        key={index}
                                                                                        onClick={() => toggleHabitDay(goal.id, activity.id, index)}
                                                                                        className={`
                                              w-8 h-8 rounded-full text-xs font-bold transition-all
                                              ${activity.habit_days![index]
                                                                                                ? 'bg-green-500 text-white shadow-lg scale-110'
                                                                                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                                                                            }
                                            `}
                                                                                    >
                                                                                        {day}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Add Goal Button */}
                                                    {addingGoalTo === category.name ? (
                                                        <div className="border-2 border-dashed border-indigo-300 rounded-xl p-6 bg-indigo-50">
                                                            <h4 className="font-bold text-gray-900 mb-4">Add New Goal</h4>

                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="block text-sm font-semibold text-gray-800 mb-2">Goal Type</label>
                                                                    <div className="flex gap-2">
                                                                        {[
                                                                            { value: 'goal', label: 'Goal', icon: '🎯' },
                                                                            { value: 'habit', label: 'Habit', icon: '✓' },
                                                                            { value: 'behavior_change', label: 'Behavior', icon: '🔄' }
                                                                        ].map(type => (
                                                                            <button
                                                                                key={type.value}
                                                                                onClick={() => setNewGoalType(type.value as any)}
                                                                                className={`
                                          flex-1 px-4 py-2 rounded-lg font-semibold transition
                                          ${newGoalType === type.value
                                                                                        ? 'bg-indigo-600 text-white'
                                                                                        : 'bg-white text-gray-800 hover:bg-gray-100'
                                                                                    }
                                        `}
                                                                            >
                                                                                {type.icon} {type.label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="block text-sm font-semibold text-gray-800 mb-2">Title</label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="e.g., Lose 10 pounds"
                                                                        value={newGoalTitle}
                                                                        onChange={(e) => setNewGoalTitle(e.target.value)}
                                                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none text-gray-900"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="block text-sm font-semibold text-gray-800 mb-2">Target Date (Optional)</label>
                                                                    <input
                                                                        type="date"
                                                                        value={newGoalDate}
                                                                        onChange={(e) => setNewGoalDate(e.target.value)}
                                                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none text-gray-900"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="block text-sm font-semibold text-gray-800 mb-2">Activities</label>
                                                                    {newActivities.map((activity, index) => (
                                                                        <div key={index} className="flex gap-2 mb-2">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="e.g., Exercise 5x/week"
                                                                                value={activity}
                                                                                onChange={(e) => {
                                                                                    const updated = [...newActivities];
                                                                                    updated[index] = e.target.value;
                                                                                    setNewActivities(updated);
                                                                                }}
                                                                                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none text-gray-900"
                                                                            />
                                                                            {index > 0 && (
                                                                                <button
                                                                                    onClick={() => setNewActivities(newActivities.filter((_, i) => i !== index))}
                                                                                    className="text-red-500 hover:text-red-700"
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

                                                                <div className="flex gap-3">
                                                                    <button
                                                                        onClick={() => addGoal(category.name)}
                                                                        className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition"
                                                                    >
                                                                        Create Goal
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setAddingGoalTo(null)}
                                                                        className="px-6 py-3 border-2 border-gray-300 rounded-lg font-bold text-gray-800 hover:border-gray-400 transition"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setAddingGoalTo(category.name)}
                                                            className="w-full py-4 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 hover:bg-indigo-50 font-semibold transition"
                                                        >
                                                            + Add Goal to {category.name}
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

                    {/* Habits Tab */}
                    {activeTab === 'habits' && (
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Daily Habit Tracker</h2>
                            <div className="space-y-4">
                                {goals
                                    .filter(g => !g.completed)
                                    .flatMap(goal =>
                                        goal.activities
                                            .filter(a => a.is_habit)
                                            .map(activity => ({
                                                goalId: goal.id,
                                                activity,
                                                category: goal.category
                                            }))
                                    )
                                    .map(({ goalId, activity, category }) => (
                                        <div key={activity.id} className="border-2 border-gray-200 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{activity.text}</h3>
                                                    <p className="text-sm text-gray-800">{category}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                                                    <div key={index} className="flex-1 text-center">
                                                        <div className="text-xs text-gray-800 mb-1">{day}</div>
                                                        <button
                                                            onClick={() => toggleHabitDay(goalId, activity.id, index)}
                                                            className={`
                                w-full aspect-square rounded-lg text-2xl transition-all
                                ${activity.habit_days?.[index]
                                                                    ? 'bg-green-500 text-white shadow-lg scale-110'
                                                                    : 'bg-gray-100 hover:bg-gray-200'
                                                                }
                              `}
                                                        >
                                                            {activity.habit_days?.[index] ? '✓' : ''}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Archive Tab */}
                    {activeTab === 'archive' && (
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Completed Goals</h2>
                            <div className="space-y-4">
                                {goals.filter(g => g.completed).map(goal => (
                                    <div key={goal.id} className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                                                ✓
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900">{goal.title}</h3>
                                                <p className="text-sm text-gray-800">{goal.category}</p>
                                            </div>
                                            <span className="text-sm text-gray-600">
                                                Completed {new Date(goal.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reflect Tab */}
                    {activeTab === 'reflect' && (
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quarterly Reflection</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block font-bold text-gray-900 mb-2">What went well this quarter?</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-600 focus:outline-none text-gray-900"
                                        placeholder="Reflect on your wins..."
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-900 mb-2">What could be improved?</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-600 focus:outline-none text-gray-900"
                                        placeholder="Areas for growth..."
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-900 mb-2">Goals for next quarter?</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-600 focus:outline-none text-gray-900"
                                        placeholder="What's next..."
                                    ></textarea>
                                </div>
                                <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition">
                                    Save Reflection
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
