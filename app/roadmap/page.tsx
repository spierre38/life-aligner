'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';
import QuickLogModal from '@/app/components/QuickLogModal';
import LifeFrameConnection from '@/app/components/LifeFrameConnection';
import { useToast } from '@/app/components/Toast';
import { SkeletonGoalCard } from '@/app/components/Skeleton';

type ActivityLog = {
    date: string; // ISO format "2026-02-03"
    feeling: 'great' | 'okay' | 'hard';
    note: string;
    logged_at: string; // Full timestamp
};

type Activity = {
    id: string;
    text: string;
    completed_dates: string[]; // Keep for backward compatibility
    logs: ActivityLog[]; // NEW - detailed log history
    notes: string; // Deprecated but keep for compatibility
};

type Reflection = {
    id: string;
    date: string;
    what_worked: string;
    what_didnt: string;
    learning: string;
    next_steps: string;
};

type RoadmapItem = {
    id: string;
    category: string;
    type: 'goal' | 'behavior_change';
    title: string;
    why: string;
    activities: Activity[];
    quarter: string;
    reflections: Reflection[];
    archived: boolean;
    archived_date?: string;
    connected_values?: string[]; // Connected LifeFrame values
    connected_purpose?: string[]; // Connected LifeFrame purpose elements
};

type CategoryDetail = {
    name: string;
    subCategories: string[];
};

// ConnectionSelector Component for editing LifeFrame connections
function ConnectionSelector({
    itemId,
    currentValues,
    currentPurpose,
    userValues,
    userPurpose,
    onUpdate
}: {
    itemId: string;
    currentValues: string[];
    currentPurpose: string[];
    userValues: string[];
    userPurpose: string[];
    onUpdate: (values: string[], purpose: string[]) => void;
}) {
    const [showSelector, setShowSelector] = useState(false);
    const [selectedValues, setSelectedValues] = useState<string[]>(currentValues);
    const [selectedPurpose, setSelectedPurpose] = useState<string[]>(currentPurpose);

    const toggleValue = (value: string) => {
        const updated = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        setSelectedValues(updated);
        onUpdate(updated, selectedPurpose);
    };

    const togglePurpose = (purpose: string) => {
        const updated = selectedPurpose.includes(purpose)
            ? selectedPurpose.filter(p => p !== purpose)
            : [...selectedPurpose, purpose];
        setSelectedPurpose(updated);
        onUpdate(selectedValues, updated);
    };

    const hasConnections = selectedValues.length > 0 || selectedPurpose.length > 0;

    if (userValues.length === 0 && userPurpose.length === 0) {
        return (
            <div className="text-xs text-gray-600 italic">
                Complete your Values and Purpose worksheets to connect them here.
            </div>
        );
    }

    return (
        <div>
            {/* Display badges when selector is closed */}
            {!showSelector && hasConnections && (
                <div className="mb-3">
                    <LifeFrameConnection
                        selectedValues={selectedValues}
                        selectedPurpose={selectedPurpose}
                    />
                </div>
            )}

            {/* Toggle button */}
            {!showSelector ? (
                <button
                    onClick={() => setShowSelector(true)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                >
                    {hasConnections ? '✏️ Edit connections' : '🔗 Connect to LifeFrame'}
                </button>
            ) : (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-200">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-900 text-sm">Connect to Your LifeFrame</h4>
                        <button
                            onClick={() => setShowSelector(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Values selector */}
                    {userValues.length > 0 && (
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-700 mb-2">
                                💎 Values this goal aligns with:
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {userValues.map((value) => (
                                    <button
                                        key={value}
                                        onClick={() => toggleValue(value)}
                                        className={`
                                            px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all
                                            ${selectedValues.includes(value)
                                                ? 'bg-blue-100 text-blue-700 border-blue-300'
                                                : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'
                                            }
                                        `}
                                    >
                                        {selectedValues.includes(value) && '✓ '}
                                        {value}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Purpose selector */}
                    {userPurpose.length > 0 && (
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-700 mb-2">
                                🎯 Purpose elements this supports:
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {userPurpose.map((purpose) => (
                                    <button
                                        key={purpose}
                                        onClick={() => togglePurpose(purpose)}
                                        className={`
                                            px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all
                                            ${selectedPurpose.includes(purpose)
                                                ? 'bg-purple-100 text-purple-700 border-purple-300'
                                                : 'bg-white text-gray-600 border-gray-300 hover:border-purple-300'
                                            }
                                        `}
                                    >
                                        {selectedPurpose.includes(purpose) && '✓ '}
                                        {purpose}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tip */}
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-start gap-2 text-xs text-purple-800">
                            <span>💡</span>
                            <span>
                                Connecting goals to your values and purpose helps you stay motivated when things get tough.
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowSelector(false)}
                        className="w-full mt-3 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-sm"
                    >
                        Done
                    </button>
                </div>
            )}
        </div>
    );
}

export default function RoadmapPage() {
    const router = useRouter();
    const { showToast } = useToast();
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

    // NEW: Modal state for quick logging
    const [loggingActivity, setLoggingActivity] = useState<{
        itemId: string;
        activityId: string;
        activityText: string;
        existingCount: number;
    } | null>(null);

    // New item form state
    const [newType, setNewType] = useState<'goal' | 'behavior_change'>('goal');
    const [newTitle, setNewTitle] = useState('');
    const [newWhy, setNewWhy] = useState('');
    const [newActivities, setNewActivities] = useState<string[]>(['', '', '']);
    const [newValues, setNewValues] = useState<string[]>([]); // NEW: Selected values
    const [newPurpose, setNewPurpose] = useState<string[]>([]); // NEW: Selected purpose

    // LifeFrame data (loaded from user's workbook)
    const [userValues, setUserValues] = useState<string[]>([]); // User's core values
    const [userPurpose, setUserPurpose] = useState<string[]>([]); // User's purpose elements

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

                // Load LifeFrame data (values and purpose)
                const { data: valuesData } = await supabase
                    .from('workbook_entries')
                    .select('content')
                    .eq('user_id', userWithProfile.user.id)
                    .eq('category', 'values')
                    .single();

                if (valuesData && mounted) {
                    // Extract selected values from the values workbook
                    if (valuesData.content.selected_values) {
                        const valueNames = valuesData.content.selected_values.map((v: any) =>
                            typeof v === 'string' ? v : v.name
                        );
                        setUserValues(valueNames);
                    }
                }

                // Load purpose from life_categories (Purpose subcategories)
                const { data: purposeData } = await supabase
                    .from('workbook_entries')
                    .select('content')
                    .eq('user_id', userWithProfile.user.id)
                    .eq('category', 'life_categories')
                    .single();

                if (purposeData && mounted) {
                    const categories = purposeData.content.categories || [];
                    const purposeCategory = categories.find((cat: any) =>
                        cat.name === 'Purpose' && cat.subCategories?.length > 0
                    );

                    if (purposeCategory?.subCategories) {
                        setUserPurpose(purposeCategory.subCategories);
                    }
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
                    // MIGRATION: Ensure activities have logs array
                    const migratedItems = (roadmapData.content.items || []).map((item: RoadmapItem) => ({
                        ...item,
                        activities: item.activities.map((activity: any) => ({
                            ...activity,
                            logs: activity.logs || [] // Initialize if doesn't exist
                        }))
                    }));
                    setRoadmapItems(migratedItems);
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

    // ========================================================================
    // FEATURE 1.2: QUICK LOGGING FUNCTIONS
    // ========================================================================

    const startLogActivity = (itemId: string, activityId: string, activityText: string, existingCount: number) => {
        setLoggingActivity({ itemId, activityId, activityText, existingCount });
    };

    const saveLogActivity = (feeling: 'great' | 'okay' | 'hard', note: string) => {
        if (!loggingActivity) return;

        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();

        const updatedItems = roadmapItems.map(item => {
            if (item.id === loggingActivity.itemId) {
                return {
                    ...item,
                    activities: item.activities.map(activity => {
                        if (activity.id === loggingActivity.activityId) {
                            const newLog: ActivityLog = {
                                date: today,
                                feeling,
                                note,
                                logged_at: now
                            };

                            return {
                                ...activity,
                                completed_dates: activity.completed_dates.includes(today)
                                    ? activity.completed_dates
                                    : [...activity.completed_dates, today],
                                logs: [...activity.logs, newLog]
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
        setLoggingActivity(null);
        showToast('Activity logged successfully! 🎉', 'success');
    };

    const getFeelingEmoji = (feeling: 'great' | 'okay' | 'hard') => {
        const map = { great: '😊', okay: '😐', hard: '😔' };
        return map[feeling];
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
                    logs: [], // Initialize empty logs array
                    notes: ''
                })),
            quarter: currentQuarter,
            reflections: [],
            archived: false,
            connected_values: newValues.length > 0 ? newValues : undefined, // Add selected values
            connected_purpose: newPurpose.length > 0 ? newPurpose : undefined // Add selected purpose
        };

        const updatedItems = [...roadmapItems, newItem];
        setRoadmapItems(updatedItems);

        // Reset form
        setNewTitle('');
        setNewWhy('');
        setNewType('goal');
        setNewActivities(['', '', '']);
        setNewValues([]); // Reset values selection
        setNewPurpose([]); // Reset purpose selection
        setAddingTo(null);

        // Save with the updated items
        saveRoadmapImmediate(updatedItems);

        // Show success message
        const itemType = newType === 'goal' ? 'Goal' : 'Behavior Change';
        showToast(`${itemType} created successfully!`, 'success');
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

    const updateItemConnections = (itemId: string, values: string[], purpose: string[]) => {
        const updatedItems = roadmapItems.map(item =>
            item.id === itemId
                ? { ...item, connected_values: values, connected_purpose: purpose }
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

            {/* FEATURE 1.2: Quick Log Modal */}
            {loggingActivity && (
                <QuickLogModal
                    activityText={loggingActivity.activityText}
                    existingCount={loggingActivity.existingCount}
                    onSave={saveLogActivity}
                    onCancel={() => setLoggingActivity(null)}
                />
            )}

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

                                                                    {/* Feature 1.3 - Editable LifeFrame Connection */}
                                                                    <div className="mb-4">
                                                                        <ConnectionSelector
                                                                            itemId={item.id}
                                                                            currentValues={item.connected_values || []}
                                                                            currentPurpose={item.connected_purpose || []}
                                                                            userValues={userValues}
                                                                            userPurpose={userPurpose}
                                                                            onUpdate={(values, purpose) => {
                                                                                updateItemConnections(item.id, values, purpose);
                                                                            }}
                                                                        />
                                                                    </div>
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
                                                                    const doneCount = activity.logs.length;
                                                                    const recentLogs = activity.logs.slice(-3).reverse();

                                                                    return (
                                                                        <div key={activity.id} className="bg-white rounded-lg p-4 border-2 border-gray-200">
                                                                            <div className="flex items-center gap-3 mb-2">
                                                                                {/* Activity logging button with 📝 emoji */}
                                                                                <button
                                                                                    onClick={() => startLogActivity(item.id, activity.id, activity.text, doneCount)}
                                                                                    className={`
                                                                                        w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all text-xl
                                                                                        ${doneToday
                                                                                            ? 'bg-green-500 text-white hover:bg-green-600 shadow-md hover:scale-110'
                                                                                            : 'bg-white hover:bg-indigo-50 border-2 border-indigo-300 text-indigo-600 hover:border-indigo-400 hover:scale-105'
                                                                                        }
                                                                                    `}
                                                                                    title={doneToday ? "Done today! Click to log again" : "Click to log this activity"}
                                                                                >
                                                                                    📝
                                                                                </button>
                                                                                <div className="flex-1">
                                                                                    <span className="text-gray-900 font-medium">{activity.text}</span>
                                                                                    <div className="text-xs text-gray-600 mt-1">
                                                                                        {doneCount > 0 ? (
                                                                                            <>
                                                                                                <span className={doneToday ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                                                                                                    {doneToday && '✓ '}Done {doneCount} times
                                                                                                </span>
                                                                                                {doneToday && <span className="text-gray-500"> (today!)</span>}
                                                                                            </>
                                                                                        ) : (
                                                                                            <span className="text-indigo-600">Click 📝 to start logging</span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* NEW: Show recent logs with feelings */}
                                                                            {recentLogs.length > 0 && (
                                                                                <div className="ml-13 space-y-1">
                                                                                    {recentLogs.map((log, idx) => (
                                                                                        <div key={idx} className="text-xs bg-gray-50 p-2 rounded flex items-start gap-2">
                                                                                            <span className="text-base">{getFeelingEmoji(log.feeling)}</span>
                                                                                            <div className="flex-1">
                                                                                                <div className="text-gray-500">{new Date(log.date).toLocaleDateString()}</div>
                                                                                                {log.note && (
                                                                                                    <div className="text-gray-800 mt-1">"{log.note}"</div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
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

                                                                {/* NEW: LifeFrame Connection - Feature 1.3 */}
                                                                {(userValues.length > 0 || userPurpose.length > 0) && (
                                                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
                                                                        <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                                                                            <span>🔗</span>
                                                                            <span>Connect to Your LifeFrame (Optional)</span>
                                                                        </h4>
                                                                        <p className="text-xs text-purple-700 mb-3">
                                                                            Link this goal to your core values or purpose to stay motivated
                                                                        </p>

                                                                        {/* Values Selection */}
                                                                        {userValues.length > 0 && (
                                                                            <div className="mb-3">
                                                                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                                                                    💎 Values
                                                                                </label>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {userValues.map((value) => {
                                                                                        const isSelected = newValues.includes(value);
                                                                                        return (
                                                                                            <button
                                                                                                key={value}
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setNewValues(
                                                                                                        isSelected
                                                                                                            ? newValues.filter(v => v !== value)
                                                                                                            : [...newValues, value]
                                                                                                    );
                                                                                                }}
                                                                                                className={`
                                                                                                    px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all
                                                                                                    ${isSelected
                                                                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                                                                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                                                                                    }
                                                                                                `}
                                                                                            >
                                                                                                {value}
                                                                                            </button>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                                {newValues.length > 0 && (
                                                                                    <div className="text-xs text-green-700 mt-1">
                                                                                        ✓ {newValues.length} selected
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {/* Purpose Selection */}
                                                                        {userPurpose.length > 0 && (
                                                                            <div>
                                                                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                                                                    🎯 Purpose
                                                                                </label>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {userPurpose.map((purpose) => {
                                                                                        const isSelected = newPurpose.includes(purpose);
                                                                                        return (
                                                                                            <button
                                                                                                key={purpose}
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setNewPurpose(
                                                                                                        isSelected
                                                                                                            ? newPurpose.filter(p => p !== purpose)
                                                                                                            : [...newPurpose, purpose]
                                                                                                    );
                                                                                                }}
                                                                                                className={`
                                                                                                    px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all
                                                                                                    ${isSelected
                                                                                                        ? 'bg-purple-600 text-white border-purple-600'
                                                                                                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                                                                                                    }
                                                                                                `}
                                                                                            >
                                                                                                {purpose}
                                                                                            </button>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                                {newPurpose.length > 0 && (
                                                                                    <div className="text-xs text-green-700 mt-1">
                                                                                        ✓ {newPurpose.length} selected
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

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

                            {/* Orphaned Goals Section - Goals from deleted categories */}
                            {(() => {
                                const categoryNames = categories.map(c => c.name);
                                const orphanedItems = activeItems.filter(item => !categoryNames.includes(item.category));

                                if (orphanedItems.length === 0) return null;

                                return (
                                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6 shadow-lg">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="text-4xl">⚠️</div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-yellow-900 mb-2">
                                                    Goals from Deleted Categories ({orphanedItems.length})
                                                </h3>
                                                <p className="text-sm text-yellow-800 mb-4">
                                                    These goals are from life categories that no longer exist. You should archive them since they don't fit your current life structure.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {orphanedItems.map(item => (
                                                <div key={item.id} className="bg-white border-2 border-yellow-200 rounded-xl p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                                                                    {item.category}
                                                                </span>
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.type === 'goal' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
                                                                    }`}>
                                                                    {item.type === 'goal' ? '🎯 Goal' : '🔄 Behavior Change'}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-bold text-gray-900">{item.title}</h4>
                                                            {item.why && (
                                                                <p className="text-sm text-gray-600 mt-1 italic">
                                                                    Why: {item.why}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => archiveItem(item.id)}
                                                            className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-semibold text-sm"
                                                        >
                                                            Archive
                                                        </button>
                                                    </div>
                                                    {item.activities.length > 0 && (
                                                        <div className="mt-2 text-sm text-gray-600">
                                                            <strong>Activities:</strong> {item.activities.map(a => a.text).join(', ')}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4 flex gap-3">
                                            <button
                                                onClick={() => {
                                                    orphanedItems.forEach(item => archiveItem(item.id));
                                                    showToast('All orphaned goals archived!', 'success');
                                                }}
                                                className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-bold"
                                            >
                                                Archive All {orphanedItems.length} Goals
                                            </button>
                                            <button
                                                onClick={() => router.push('/workbook/life-categories')}
                                                className="px-6 py-3 border-2 border-yellow-600 text-yellow-800 rounded-lg hover:bg-yellow-100 transition font-bold"
                                            >
                                                Edit Life Categories
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
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
