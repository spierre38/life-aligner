'use client';

import { trackRoadmapSaved, trackActivityLogged, trackGoalAdded, trackRoadmapComplete, trackEvent } from '@/lib/analytics';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/accountability';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';
import QuickLogModal from '@/app/components/QuickLogModal';
import LifeFrameConnection from '@/app/components/LifeFrameConnection';
import { AddToTodoButton } from '@/app/components/AddToTodoButton';
import { useToast } from '@/app/components/Toast';
import { SkeletonGoalCard } from '@/app/components/Skeleton';
import { GoalSuggestionWizard, SelectedGoal } from './components/GoalSuggestionWizard';
import { RoadmapCanvas, LaneData, Goal as VisualGoal, Activity as VisualActivity } from './components/RoadmapCanvas';
import { DailyFocusPanel } from './components/DailyFocusPanel';
import { ChapterCard } from './components/ChapterCard';
import { ArchiveStorybook } from './components/ArchiveStorybook';
import { CompletionCelebration } from './components/CompletionCelebration';
import DailyInsightCard from './components/DailyInsightCard';
import JourneyProgressBanner from './components/JourneyProgressBanner';

// ============================================================================
// SVG ICONS - Professional replacements for emojis
// ============================================================================

const RoadmapIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
);

const GoalIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const BehaviorIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const ReflectionIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const ArchiveIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
);

const DocumentIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

// Category Icons
const CategoryIcons: Record<string, React.FC<{ className?: string }>> = {
    'Health': ({ className = "w-6 h-6" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    ),
    'Relationships': ({ className = "w-6 h-6" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    ),
    'Career': ({ className = "w-6 h-6" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    'Social': ({ className = "w-6 h-6" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    ),
    'Learning': ({ className = "w-6 h-6" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
    ),
    'Finance': ({ className = "w-6 h-6" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    'Spiritual': ({ className = "w-6 h-6" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
    ),
    'Creative': ({ className = "w-6 h-6" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
    ),
    'Purpose': ({ className = "w-6 h-6" }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    ),
};

const getCategoryIconComponent = (categoryName: string) => {
    return CategoryIcons[categoryName] || CategoryIcons['Purpose'];
};


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
    const [completedGoalTitle, setCompletedGoalTitle] = useState<string | null>(null);

    // NEW: Goal suggestion wizard
    const [showSuggestionWizard, setShowSuggestionWizard] = useState(false);

    // NEW: Visual roadmap view mode
    const [viewMode, setViewMode] = useState<'visual' | 'list'>('list');

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

                // Load all data in parallel instead of sequentially
                const [categoriesResult, valuesResult, roadmapResult] = await Promise.all([
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
                        .eq('category', 'values')
                        .single(),
                    supabase
                        .from('workbook_entries')
                        .select('content')
                        .eq('user_id', userWithProfile.user.id)
                        .eq('category', 'roadmap')
                        .single(),
                ]);

                if (!mounted) return;

                // Extract categories
                if (categoriesResult.data) {
                    setCategories(categoriesResult.data.content.categories || []);

                    // Extract purpose from the same categories data (eliminates duplicate query)
                    const allCategories = categoriesResult.data.content.categories || [];
                    const purposeCategory = allCategories.find((cat: any) =>
                        cat.name === 'Purpose' && cat.subCategories?.length > 0
                    );
                    if (purposeCategory?.subCategories) {
                        setUserPurpose(purposeCategory.subCategories);
                    }
                }

                // Extract values
                if (valuesResult.data) {
                    if (valuesResult.data.content.selected_values) {
                        const valueNames = valuesResult.data.content.selected_values.map((v: any) =>
                            typeof v === 'string' ? v : v.name
                        );
                        setUserValues(valueNames);
                    }
                }

                // Extract roadmap
                if (!roadmapResult.data) {
                    // Show welcome animation first, then suggestion wizard
                    setShowWelcome(true);
                    setTimeout(() => {
                        if (mounted) {
                            setShowWelcome(false);
                            setShowSuggestionWizard(true);
                        }
                    }, 3000);
                } else {
                    // MIGRATION: Ensure activities have logs array
                    const migratedItems = (roadmapResult.data.content.items || []).map((item: RoadmapItem) => ({
                        ...item,
                        activities: item.activities.map((activity: any) => ({
                            ...activity,
                            logs: activity.logs || [] // Initialize if doesn't exist
                        }))
                    }));

                    // If items array is empty, show wizard after welcome
                    if (migratedItems.length === 0) {
                        setShowWelcome(true);
                        setTimeout(() => {
                            if (mounted) {
                                setShowWelcome(false);
                                setShowSuggestionWizard(true);
                            }
                        }, 3000);
                    }

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
            trackRoadmapSaved(roadmapItems.length);
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

        // Log social activity for partners
        const goalMatch = updatedItems.find(i => i.id === loggingActivity.itemId);
        logActivity('goal_completed', { 
            activity_text: loggingActivity.activityText,
            goal_title: goalMatch?.title || 'a goal'
        }).catch(err => console.error('Failed to log social activity:', err));
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

        // Track analytics
        trackGoalAdded(category, newType);

        // If this is the user's 3rd goal, consider the roadmap "complete" (initial milestone reached)
        const activeCount = updatedItems.filter(item => !item.archived).length;
        if (activeCount === 3) {
            trackRoadmapComplete(activeCount);
        }

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
        const itemToArchive = roadmapItems.find(item => item.id === itemId);
        const updatedItems = roadmapItems.map(item =>
            item.id === itemId
                ? { ...item, archived: true, archived_date: new Date().toISOString() }
                : item
        );
        setRoadmapItems(updatedItems);
        saveRoadmapImmediate(updatedItems);
        if (itemToArchive) {
            setCompletedGoalTitle(itemToArchive.title);
            logActivity('milestone_posted', {
                goal_title: itemToArchive.title,
                message: "Completed a major goal and added it to the Archive Storybook!"
            }).catch(console.error);
        }
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

    // ============================================================================
    // NEW: GOAL SUGGESTION HANDLERS
    // ============================================================================

    const handleSuggestionComplete = async (selectedGoals: SelectedGoal[]) => {
        if (!userId) return;

        // Convert selected templates to RoadmapItems
        const newItems: RoadmapItem[] = selectedGoals.map(selected => ({
            id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            category: selected.category,
            type: 'goal',
            title: selected.goal,
            why: '',
            activities: selected.activities.map(text => ({
                id: `activity_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                text,
                completed_dates: [],
                logs: [],
                notes: ''
            })),
            quarter: currentQuarter,
            reflections: [],
            archived: false,
            connected_values: selected.connectedValues,
            connected_purpose: selected.connectedPurpose
        }));

        // Save to database
        const updatedItems = [...roadmapItems, ...newItems];
        setRoadmapItems(updatedItems);
        await saveRoadmapImmediate(updatedItems);

        // Close wizard
        setShowSuggestionWizard(false);

        // Track analytics
        trackEvent({ action: 'complete_goal_wizard', category: 'roadmap', value: selectedGoals.length });

        // Show success
        showToast(`Added ${selectedGoals.length} goals to your roadmap! 🎉`, 'success');

        // Social feed logging
        selectedGoals.forEach(suggestion => {
            logActivity('roadmap_updated', {
                goal_title: suggestion.goal || 'New Goal',
                action: 'added_goal'
            }).catch(err => console.error('Failed to log social activity:', err));
        });
    };

    const handleSuggestionSkip = () => {
        setShowSuggestionWizard(false);
    };

    // ============================================================================
    // NEW: VISUAL ROADMAP HANDLERS
    // ============================================================================

    const getCategoryColor = (category: string): string => {
        const colorMap: Record<string, string> = {
            Health: '#10B981',
            Career: '#6366F1',
            Relationships: '#EC4899',
            Purpose: '#8B5CF6',
            Social: '#F59E0B',
            Learning: '#3B82F6',
            Finance: '#14B8A6',
            Spiritual: '#A855F7',
            Creative: '#F97316'
        };
        return colorMap[category] || '#6366F1';
    };

    const transformToLaneData = (): LaneData[] => {
        const categoryMap = new Map<string, RoadmapItem[]>();

        // Group items by category
        roadmapItems.filter(item => !item.archived).forEach(item => {
            if (!categoryMap.has(item.category)) {
                categoryMap.set(item.category, []);
            }
            categoryMap.get(item.category)!.push(item);
        });

        const lanes: LaneData[] = [];

        categoryMap.forEach((items, categoryName) => {
            // Convert to visual format
            const goals: VisualGoal[] = items.map((item, index) => {
                const activities: VisualActivity[] = item.activities.map(activity => ({
                    id: activity.id,
                    text: activity.text,
                    completed: activity.logs && activity.logs.length > 0,
                    completedCount: activity.logs?.length || 0,
                    logs: activity.logs
                }));

                return {
                    id: item.id,
                    title: item.title,
                    type: item.type,
                    why: item.why,
                    activities,
                    position: (index / items.length) * 100,
                    connectedValues: item.connected_values,
                    connectedPurpose: item.connected_purpose
                };
            });

            // Calculate progress
            const totalActivities = goals.reduce((sum, g) => sum + g.activities.length, 0);
            const completedActivities = goals.reduce((sum, g) =>
                sum + g.activities.filter(a => a.completed).length, 0
            );
            const progress = totalActivities > 0
                ? Math.round((completedActivities / totalActivities) * 100)
                : 0;

            lanes.push({
                id: categoryName,
                category: categoryName,
                emoji: getCategoryIcon(categoryName),
                color: getCategoryColor(categoryName),
                goals,
                overallProgress: progress
            });
        });

        return lanes;
    };

    const handleUpdateGoalFromVisual = async (laneId: string, goalId: string, updates: Partial<VisualGoal>) => {
        // Only spread compatible fields (exclude activities which has a different type)
        const { activities: _ignoredActivities, ...safeUpdates } = updates;

        const updatedItems = roadmapItems.map(item => {
            if (item.id === goalId) {
                return { ...item, ...safeUpdates };
            }
            return item;
        });

        setRoadmapItems(updatedItems);
        await saveRoadmapImmediate(updatedItems);
    };

    const handleToggleActivityFromVisual = async (laneId: string, goalId: string, activityId: string) => {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();

        const updatedItems = roadmapItems.map(item => {
            if (item.id === goalId) {
                return {
                    ...item,
                    activities: item.activities.map(activity => {
                        if (activity.id === activityId) {
                            const hasLogToday = activity.logs?.some(log => log.date === today);

                            if (hasLogToday) {
                                // Remove today's log
                                return {
                                    ...activity,
                                    logs: activity.logs?.filter(log => log.date !== today) || [],
                                    completed_dates: activity.completed_dates.filter(d => d !== today)
                                };
                            } else {
                                // Add today's log
                                const newLog: ActivityLog = {
                                    date: today,
                                    feeling: 'okay' as const,
                                    note: 'Quick toggle from map view',
                                    logged_at: now
                                };
                                return {
                                    ...activity,
                                    logs: [...(activity.logs || []), newLog],
                                    completed_dates: [...activity.completed_dates, today]
                                };
                            }
                        }
                        return activity;
                    })
                };
            }
            return item;
        });

        setRoadmapItems(updatedItems);
        await saveRoadmapImmediate(updatedItems);
    };

    const handleAddGoalFromVisual = (category: string) => {
        setAddingTo(category);
        setExpandedCategory(category);
        setViewMode('list'); // Switch to list view to show form
    };

    // Direct log from DailyFocusPanel (bypasses modal)
    const handleDailyFocusLog = (itemId: string, activityId: string, feeling: 'great' | 'okay' | 'hard', note: string) => {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();

        const updatedItems = roadmapItems.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    activities: item.activities.map(activity => {
                        if (activity.id === activityId) {
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
                                logs: [...(activity.logs || []), newLog]
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

        // Track analytics
        const category = roadmapItems.find(i => i.id === itemId)?.category || 'unknown';
        trackActivityLogged(category);
    };

    // ============================================================================
    // ENGAGEMENT: STREAK, DAILY FOCUS & WEEKLY STATS
    // ============================================================================

    const calculateStreak = (): { current: number; longest: number; todayLogged: boolean } => {
        // Collect ALL log dates across all activities
        const allDates = new Set<string>();
        roadmapItems.filter(i => !i.archived).forEach(item => {
            item.activities.forEach(activity => {
                (activity.logs || []).forEach(log => {
                    allDates.add(log.date);
                });
            });
        });

        const today = new Date().toISOString().split('T')[0];
        const todayLogged = allDates.has(today);

        // Sort dates descending
        const sorted = Array.from(allDates).sort((a, b) => b.localeCompare(a));
        if (sorted.length === 0) return { current: 0, longest: 0, todayLogged: false };

        // Calculate current streak (from today or yesterday backwards)
        let current = 0;
        const startDate = new Date(todayLogged ? today : sorted[0]);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Only count if most recent log is today or yesterday
        if (!todayLogged && sorted[0] !== yesterdayStr) {
            // Streak is broken
        } else {
            const checkDate = new Date(todayLogged ? today : yesterdayStr);
            let missesAllowed = 1; // streak saver: 1 miss per 7 days
            let daysCounted = 0;

            while (true) {
                const dateStr = checkDate.toISOString().split('T')[0];
                if (allDates.has(dateStr)) {
                    current++;
                    daysCounted++;
                } else {
                    if (missesAllowed > 0 && daysCounted >= 3) {
                        missesAllowed--;
                        // Don't count but don't break
                    } else {
                        break;
                    }
                }
                checkDate.setDate(checkDate.getDate() - 1);
            }
        }

        // Calculate longest streak
        let longest = 0;
        let tempStreak = 0;
        for (let i = 0; i < sorted.length; i++) {
            if (i === 0) {
                tempStreak = 1;
            } else {
                const prevDate = new Date(sorted[i - 1]);
                const currDate = new Date(sorted[i]);
                const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    tempStreak++;
                } else {
                    longest = Math.max(longest, tempStreak);
                    tempStreak = 1;
                }
            }
        }
        longest = Math.max(longest, tempStreak, current);

        return { current, longest, todayLogged };
    };

    const getStreakMilestone = (days: number): { message: string; emoji: string } | null => {
        const milestones: Record<number, { message: string; emoji: string }> = {
            3: { message: "3 days strong! You're building a habit", emoji: '🌱' },
            7: { message: "1 week streak! Real momentum now", emoji: '🔥' },
            14: { message: "2 weeks! This is becoming part of you", emoji: '⚡' },
            30: { message: "30 days! You've transformed a habit", emoji: '🏆' },
            60: { message: "60 days! Incredible discipline", emoji: '💎' },
            90: { message: "90 days! You're unstoppable", emoji: '👑' },
        };
        return milestones[days] || null;
    };

    const getTodaysFocus = (count: number = 3): { item: RoadmapItem; activity: Activity }[] => {
        const today = new Date().toISOString().split('T')[0];
        const candidates: { item: RoadmapItem; activity: Activity; score: number }[] = [];

        roadmapItems.filter(i => !i.archived).forEach(item => {
            item.activities.forEach(activity => {
                const logCount = (activity.logs || []).length;
                const loggedToday = (activity.logs || []).some(l => l.date === today);
                if (loggedToday) return; // Skip already-done-today

                // Score: lower = more neglected = higher priority
                const daysSinceLastLog = activity.logs && activity.logs.length > 0
                    ? Math.floor((Date.now() - new Date(activity.logs[activity.logs.length - 1].date).getTime()) / (1000 * 60 * 60 * 24))
                    : 30; // Cap at 30 for never-logged activities

                candidates.push({
                    item,
                    activity,
                    score: daysSinceLastLog * 10 - logCount // prioritize neglected & low-count
                });
            });
        });

        // Sort by score descending (most neglected first)
        return candidates
            .sort((a, b) => b.score - a.score)
            .slice(0, count)
            .map(c => ({ item: c.item, activity: c.activity }));
    };

    const getWeeklyStats = (): { thisWeek: number; lastWeek: number; trend: 'up' | 'down' | 'same' } => {
        const now = new Date();
        const startOfThisWeek = new Date(now);
        startOfThisWeek.setDate(now.getDate() - now.getDay());
        startOfThisWeek.setHours(0, 0, 0, 0);

        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

        let thisWeek = 0;
        let lastWeek = 0;

        roadmapItems.filter(i => !i.archived).forEach(item => {
            item.activities.forEach(activity => {
                (activity.logs || []).forEach(log => {
                    const logDate = new Date(log.date);
                    if (logDate >= startOfThisWeek) thisWeek++;
                    else if (logDate >= startOfLastWeek) lastWeek++;
                });
            });
        });

        const trend = thisWeek > lastWeek ? 'up' : thisWeek < lastWeek ? 'down' : 'same';
        return { thisWeek, lastWeek, trend };
    };

    // Streak celebration state
    const streakData = calculateStreak();
    const milestone = getStreakMilestone(streakData.current);

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

            {/* Completion Celebration Overlay */}
            {completedGoalTitle && (
                <CompletionCelebration
                    goalTitle={completedGoalTitle}
                    onClose={() => setCompletedGoalTitle(null)}
                    onNavigateToArchive={() => {
                        setActiveTab('archive');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                />
            )}

            {/* NEW: Goal Suggestion Wizard */}
            {showSuggestionWizard && (
                <GoalSuggestionWizard
                    userCategories={categories.map(c => c.name)}
                    userValues={userValues}
                    userPurpose={userPurpose}
                    onComplete={handleSuggestionComplete}
                    onSkip={handleSuggestionSkip}
                />
            )}

            {/* FEATURE 1.2: Quick Log Modal */}
            {loggingActivity && (
                <QuickLogModal
                    activityText={loggingActivity.activityText}
                    existingCount={loggingActivity.existingCount}
                    onSave={saveLogActivity}
                    onCancel={() => setLoggingActivity(null)}
                />
            )}

            <div className="min-h-screen pt-16 relative" style={{ background: 'linear-gradient(180deg, #FEF3E2 0%, #FDE8D0 15%, #F5E6D8 30%, #E8DDD4 50%, #DDD6CE 70%, #D4CFC8 100%)' }}>
                {/* Terrain silhouette */}
                <div className="fixed bottom-0 left-0 right-0 h-48 pointer-events-none z-0 opacity-[0.07]">
                    <svg viewBox="0 0 1440 320" className="w-full h-full" preserveAspectRatio="none">
                        <path fill="#5B4A3F" d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,218.7C672,213,768,171,864,154.7C960,139,1056,149,1152,165.3C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
                        <path fill="#6B5B4F" d="M0,288L48,272C96,256,192,224,288,208C384,192,480,192,576,197.3C672,203,768,213,864,224C960,235,1056,245,1152,234.7C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
                    </svg>
                </div>

                {/* JOURNEY HEADER */}
                <div className="sticky top-16 z-40 backdrop-blur-md bg-gradient-to-r from-amber-800/90 via-orange-900/90 to-amber-800/90 border-b border-amber-700/30 shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Top Row */}
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-amber-50">Your Journey</h1>
                                    <p className="text-xs text-amber-200/80">{currentQuarter} · Keep moving forward</p>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="hidden md:flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
                                    <div className="text-lg font-bold text-amber-200">{activeItems.length}</div>
                                    <div className="text-[10px] text-amber-100/70 uppercase tracking-wider">Active</div>
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
                                    <div className="text-lg font-bold text-amber-200">
                                        {activeItems.reduce((sum, item) => sum + item.reflections.length, 0)}
                                    </div>
                                    <div className="text-[10px] text-amber-100/70 uppercase tracking-wider">Reflections</div>
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
                                    <div className="text-lg font-bold text-green-300">{archivedItems.length}</div>
                                    <div className="text-[10px] text-amber-100/70 uppercase tracking-wider">Complete</div>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push('/dashboard')}
                                className="text-amber-300/60 hover:text-amber-100 transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 -mb-px">
                            {[
                                { id: 'current', label: 'Trail', icon: GoalIcon },
                                { id: 'reflect', label: 'Journal', icon: ReflectionIcon },
                                { id: 'archive', label: 'Milestones', icon: ArchiveIcon }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2.5 font-semibold text-sm transition-all rounded-t-lg
                                        ${activeTab === tab.id
                                            ? 'bg-white/15 text-amber-100 border-b-2 border-amber-400'
                                            : 'text-amber-300/60 hover:text-amber-100'
                                        }
                                    `}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
                    {/* Current Quarter Tab */}
                    {activeTab === 'current' && (
                        <div className="space-y-6">
                            {/* Journey Progress Banner */}
                            <JourneyProgressBanner
                                totalGoals={roadmapItems.length}
                                completedGoals={archivedItems.length}
                                activeGoals={activeItems.length}
                                totalActivitiesLogged={roadmapItems.reduce((sum, item) => 
                                    sum + item.activities.reduce((aSum, act) => aSum + (act.logs?.length || 0), 0), 0
                                )}
                                streakDays={streakData.current}
                            />

                            {/* Daily Insight Card */}
                            <DailyInsightCard roadmapItems={roadmapItems} />

                            {/* Daily Focus Panel — streaks, today's activities, inline logging */}
                            <DailyFocusPanel
                                streak={streakData}
                                focusActivities={getTodaysFocus(3).map(({ item, activity }) => ({
                                    itemId: item.id,
                                    activityId: activity.id,
                                    activityText: activity.text,
                                    goalTitle: item.title,
                                    category: item.category,
                                    existingCount: (activity.logs || []).length
                                }))}
                                weeklyStats={getWeeklyStats()}
                                milestone={milestone}
                                onLogActivity={handleDailyFocusLog}
                            />

                            {/* View Mode Toggle & Suggestions */}
                            <div className="flex items-center justify-between mb-6">
                                <button
                                    onClick={() => setShowSuggestionWizard(true)}
                                    className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-semibold hover:bg-amber-200 transition text-sm border border-amber-200"
                                >
                                    💡 Get Goal Suggestions
                                </button>

                                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => {
                                            setViewMode('visual');
                                            trackEvent({ action: 'switch_view_mode', category: 'roadmap', label: 'visual' });
                                        }}
                                        className={`px-4 py-2 rounded-md font-semibold text-sm transition ${
                                            viewMode === 'visual'
                                                ? 'bg-white text-indigo-600 shadow'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        🗺️ Map View
                                    </button>
                                    <button
                                        onClick={() => {
                                            setViewMode('list');
                                            trackEvent({ action: 'switch_view_mode', category: 'roadmap', label: 'list' });
                                        }}
                                        className={`px-4 py-2 rounded-md font-semibold text-sm transition ${
                                            viewMode === 'list'
                                                ? 'bg-white text-indigo-600 shadow'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        📋 List View
                                    </button>
                                </div>
                            </div>

                            {/* NEW: Visual Map View */}
                            {viewMode === 'visual' && (
                                <RoadmapCanvas
                                    lanes={transformToLaneData()}
                                    onUpdateGoal={handleUpdateGoalFromVisual}
                                    onToggleActivity={handleToggleActivityFromVisual}
                                    onAddGoal={handleAddGoalFromVisual}
                                />
                            )}

                            {/* EXISTING: List View (wrapped in conditional) */}
                            {viewMode === 'list' && (<>

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
                                        <div key={category.name} className="relative">
                                            {/* Connecting trail line */}
                                            <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-300/40 to-amber-200/20 -z-0" style={{ top: '-12px' }} />
                                            
                                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_4px_20px_rgba(120,80,40,0.08)] overflow-hidden border border-amber-100/50">
                                            {/* Category Header - Waypoint */}
                                            <button
                                                onClick={() => setExpandedCategory(isExpanded ? null : category.name)}
                                                className="w-full p-4 flex items-center justify-between hover:bg-amber-50/50 transition group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Trail marker dot */}
                                                    <div className="relative">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 ${
                                                            categoryItems.length > 0 
                                                                ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30'
                                                                : 'bg-gradient-to-br from-stone-400 to-stone-500 shadow-stone-400/20'
                                                        }`}>
                                                            {React.createElement(getCategoryIconComponent(category.name), { className: "w-5 h-5" })}
                                                        </div>
                                                        {categoryItems.length > 0 && (
                                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-white">
                                                                {categoryItems.length}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-left">
                                                        <h3 className="text-lg font-bold text-stone-800">{category.name}</h3>
                                                        <p className="text-xs text-stone-500">
                                                            {categoryItems.length === 0 ? 'No goals yet — start your path' : `${categoryItems.length} goal${categoryItems.length !== 1 ? 's' : ''} on this trail`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <svg
                                                    className={`w-5 h-5 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
                                                        <div key={item.id} className="border-2 border-amber-100 rounded-xl p-6 bg-gradient-to-br from-white to-amber-50/30">
                                                            <div className="flex items-start justify-between mb-4">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <h4 className="font-bold text-xl text-gray-900">{item.title}</h4>
                                                                        <span className={`
                                      flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold
                                      ${item.type === 'goal' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-purple-100 text-purple-700 border border-purple-300'}
                                    `}>
                                                                            {item.type === 'goal' ? (
                                                                                <><GoalIcon className="w-3.5 h-3.5" /> Goal</>
                                                                            ) : (
                                                                                <><BehaviorIcon className="w-3.5 h-3.5" /> Behavior</>
                                                                            )}
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
                                                                                {/* Activity logging button with SVG icon */}
                                                                                <button
                                                                                    onClick={() => startLogActivity(item.id, activity.id, activity.text, doneCount)}
                                                                                    className={`
                                                                                        w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all
                                                                                        ${doneToday
                                                                                            ? 'bg-green-500 text-white hover:bg-green-600 shadow-md hover:scale-110'
                                                                                            : 'bg-white hover:bg-indigo-50 border-2 border-indigo-300 text-indigo-600 hover:border-indigo-400 hover:scale-105'
                                                                                        }
                                                                                    `}
                                                                                    title={doneToday ? "Done today! Click to log again" : "Click to log this activity"}
                                                                                >
                                                                                    <DocumentIcon className="w-5 h-5" />
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

                                                                                {/* View in To-Do List */}
                                                                                <AddToTodoButton variant="compact" />
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
                                                            className="w-full py-4 border-2 border-dashed border-amber-300 rounded-xl text-amber-700 hover:bg-amber-50 font-semibold transition"
                                                        >
                                                            + Add to {category.name}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
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
                                                                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${item.type === 'goal' ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-purple-100 text-purple-700 border border-purple-300'
                                                                    }`}>
                                                                    {item.type === 'goal' ? (
                                                                        <><GoalIcon className="w-3.5 h-3.5" /> Goal</>
                                                                    ) : (
                                                                        <><BehaviorIcon className="w-3.5 h-3.5" /> Behavior</>
                                                                    )}
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
                        </>)}
                        </div>
                    )}

                    {/* Reflect & Learn Tab — Journey Journal */}
                    {activeTab === 'reflect' && (
                        <div className="space-y-6">
                            {/* Header card */}
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Journey Journal</h2>
                                        <p className="text-gray-500 text-sm">Reflect on milestones and active goals. Growth comes from looking back.</p>
                                    </div>
                                    <div className="flex gap-3 flex-shrink-0">
                                        <div className="text-center px-4 py-2 bg-purple-50 rounded-xl">
                                            <div className="text-xl font-bold text-purple-700">{archivedItems.length}</div>
                                            <div className="text-xs text-purple-500 font-medium">Completed</div>
                                        </div>
                                        <div className="text-center px-4 py-2 bg-indigo-50 rounded-xl">
                                            <div className="text-xl font-bold text-indigo-700">
                                                {activeItems.reduce((sum, item) => sum + item.reflections.length, 0) + archivedItems.reduce((sum, item) => sum + item.reflections.length, 0)}
                                            </div>
                                            <div className="text-xs text-indigo-500 font-medium">Reflections</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* What's Working / Key Learnings */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-green-50 rounded-xl p-4">
                                    <h3 className="font-bold text-green-900 mb-2 text-sm">✓ What's Working</h3>
                                    <ul className="space-y-1.5 text-sm">
                                        {[...activeItems, ...archivedItems].flatMap(item =>
                                            item.reflections.filter(r => r.what_worked).slice(-3).map(r => (
                                                <li key={r.id} className="text-gray-700 flex items-start gap-1.5"><span className="text-green-500 flex-shrink-0">•</span>{r.what_worked}</li>
                                            ))
                                        )}
                                        {[...activeItems, ...archivedItems].every(item => item.reflections.filter(r => r.what_worked).length === 0) && (
                                            <li className="text-gray-400 italic text-xs">Add reflections to see highlights here</li>
                                        )}
                                    </ul>
                                </div>
                                <div className="bg-amber-50 rounded-xl p-4">
                                    <h3 className="font-bold text-amber-900 mb-2 text-sm">💡 Key Learnings</h3>
                                    <ul className="space-y-1.5 text-sm">
                                        {[...activeItems, ...archivedItems].flatMap(item =>
                                            item.reflections.slice(-3).map(r => (
                                                <li key={r.id} className="text-gray-700 flex items-start gap-1.5"><span className="text-amber-500 flex-shrink-0">•</span>{r.learning}</li>
                                            ))
                                        )}
                                        {[...activeItems, ...archivedItems].every(item => item.reflections.length === 0) && (
                                            <li className="text-gray-400 italic text-xs">Your key learnings will appear here</li>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            {/* Completed Milestones */}
                            {archivedItems.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2"><span className="text-2xl">🏆</span> Completed Milestones</h3>
                                    <div className="space-y-4">
                                        {archivedItems.map(item => (
                                            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
                                                <div className="h-1 bg-gradient-to-r from-purple-400 to-indigo-500" />
                                                <div className="p-5">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-lg">🏆</div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900">{item.title}</h4>
                                                            <span className="text-xs font-semibold text-purple-600">{item.category}</span>
                                                        </div>
                                                    </div>
                                                    {item.reflections.length > 0 && (
                                                        <div className="space-y-2 mb-3">
                                                            {item.reflections.map(r => (
                                                                <div key={r.id} className="bg-purple-50 rounded-lg p-3 text-sm">
                                                                    <div className="text-xs text-purple-500 font-semibold mb-1">{new Date(r.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                                                                    {r.what_worked && <p className="text-gray-700 mb-1"><strong className="text-green-700">✓ Worked:</strong> {r.what_worked}</p>}
                                                                    {r.learning && <p className="text-gray-700"><strong className="text-amber-700">💡 Learned:</strong> {r.learning}</p>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {reflectingOn !== item.id ? (
                                                        <button onClick={() => setReflectingOn(item.id)} className="text-sm text-purple-600 hover:text-purple-800 font-semibold transition flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                            {item.reflections.length === 0 ? 'Reflect on this milestone' : 'Add another reflection'}
                                                        </button>
                                                    ) : (
                                                        <div className="mt-3 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                                                            <p className="text-xs text-indigo-600 italic mb-3">💡 What did you learn from pursuing this goal? How did it change you?</p>
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <label className="block text-xs font-bold text-gray-700 mb-1">What worked well?</label>
                                                                    <textarea rows={2} value={reflectionWhatWorked} onChange={(e) => setReflectionWhatWorked(e.target.value)} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-400 focus:outline-none text-sm text-gray-900 resize-none" placeholder="Activities that were effective..." />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-bold text-gray-700 mb-1">What did you learn? *</label>
                                                                    <textarea rows={2} value={reflectionLearning} onChange={(e) => setReflectionLearning(e.target.value)} className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm text-gray-900 resize-none" placeholder="Your most important insight..." />
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => addReflection(item.id)} disabled={!reflectionLearning.trim()} className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${reflectionLearning.trim() ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Save Reflection</button>
                                                                    <button onClick={() => { setReflectingOn(null); setReflectionWhatWorked(''); setReflectionLearning(''); }} className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50 text-sm">Cancel</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Active goals with reflections */}
                            {activeItems.some(i => i.reflections.length > 0) && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2"><span className="text-2xl">📝</span> In-Progress Goal Reflections</h3>
                                    <div className="space-y-3">
                                        {activeItems.filter(i => i.reflections.length > 0).map(item => (
                                            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-amber-100 p-5">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center text-sm">🎯</div>
                                                    <div><h4 className="font-bold text-gray-900 text-sm">{item.title}</h4><span className="text-xs text-amber-600 font-semibold">{item.category}</span></div>
                                                </div>
                                                <div className="space-y-2">
                                                    {item.reflections.map(r => (
                                                        <div key={r.id} className="bg-amber-50 rounded-lg p-3 text-sm">
                                                            <div className="text-xs text-amber-500 font-semibold mb-1">{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                            {r.what_worked && <p className="text-gray-700 mb-0.5"><strong className="text-green-700">✓</strong> {r.what_worked}</p>}
                                                            {r.learning && <p className="text-gray-700"><strong className="text-amber-700">💡</strong> {r.learning}</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty state */}
                            {archivedItems.length === 0 && activeItems.every(i => i.reflections.length === 0) && (
                                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                                    <div className="text-5xl mb-4">📖</div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Your Journal Awaits</h3>
                                    <p className="text-gray-500 text-sm max-w-sm mx-auto">Add reflections in the Trail tab, or archive a completed goal to start your milestone journal.</p>
                                </div>
                            )}

                            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-5">
                                <h3 className="font-bold text-purple-900 mb-2 text-sm">Remember:</h3>
                                <ul className="space-y-1.5 text-sm text-gray-700">
                                    <li>✓ <strong>Progress is success</strong> — multiple outcomes can be positive</li>
                                    <li>✓ <strong>Learning is valuable</strong> — even setbacks move you forward</li>
                                    <li>✓ <strong>It's about the journey</strong> — not just the destination</li>
                                    <li>✓ <strong>Reflect every 3 months</strong> — based on what you've learned</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Archive Tab */}
                    {activeTab === 'archive' && (
                        <div className="bg-transparent">
                            <ArchiveStorybook 
                                archivedGoals={archivedItems as any}
                                onShare={(goal) => console.log('Share goal', goal.id)}
                                onUnarchive={unarchiveItem}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
