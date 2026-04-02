'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';
import { SkeletonCard } from '@/app/components/Skeleton';
import dynamic from 'next/dynamic';

// Heavy conditional components — loaded as separate chunks
const OnboardingJourney = dynamic(() => import('@/app/components/OnboardingJourney'));
const OnboardingModal = dynamic(() => import('@/app/components/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const DashboardTodoWidget = dynamic(() => import('@/app/components/DashboardTodoWidget').then(m => ({ default: m.DashboardTodoWidget })));

// ============================================================================
// INLINE SVG ILLUSTRATIONS
// ============================================================================

const HeroIllustration = () => (
    <svg viewBox="0 0 400 300" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#764ba2" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="50%" stopColor="#764ba2" />
                <stop offset="100%" stopColor="#f093fb" />
            </linearGradient>
        </defs>

        {/* Background circles */}
        <circle cx="320" cy="50" r="60" fill="url(#heroGradient)" />
        <circle cx="80" cy="240" r="40" fill="url(#heroGradient)" />

        {/* Winding path */}
        <path
            d="M 50,250 Q 100,200 150,220 T 250,180 T 350,150"
            stroke="url(#pathGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
        />

        {/* Steps */}
        <circle cx="50" cy="250" r="10" fill="#667eea" />
        <circle cx="50" cy="250" r="6" fill="white" />

        <circle cx="150" cy="220" r="10" fill="#764ba2" />
        <circle cx="150" cy="220" r="6" fill="white" />

        <circle cx="250" cy="180" r="10" fill="#f093fb" />
        <circle cx="250" cy="180" r="6" fill="white" />

        {/* Star destination */}
        <path
            d="M 350,150 L 355,160 L 366,161 L 357,169 L 360,180 L 350,174 L 340,180 L 343,169 L 334,161 L 345,160 Z"
            fill="#ffd700"
            stroke="#ffaa00"
            strokeWidth="2"
        />
    </svg>
);

const ValuesIllustration = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="valuesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
        </defs>

        <circle cx="100" cy="100" r="60" fill="url(#valuesGradient)" opacity="0.1" />

        {/* Compass lines */}
        <line x1="100" y1="50" x2="100" y2="70" stroke="url(#valuesGradient)" strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="130" x2="100" y2="150" stroke="url(#valuesGradient)" strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="100" x2="70" y2="100" stroke="url(#valuesGradient)" strokeWidth="3" strokeLinecap="round" />
        <line x1="130" y1="100" x2="150" y2="100" stroke="url(#valuesGradient)" strokeWidth="3" strokeLinecap="round" />

        <circle cx="100" cy="100" r="25" fill="url(#valuesGradient)" opacity="0.8" />
        <circle cx="100" cy="100" r="15" fill="white" />

        {/* Value nodes */}
        <circle cx="100" cy="60" r="8" fill="#667eea" />
        <circle cx="140" cy="100" r="8" fill="#764ba2" />
        <circle cx="100" cy="140" r="8" fill="#f093fb" />
        <circle cx="60" cy="100" r="8" fill="#667eea" />
    </svg>
);

const InterestsIllustration = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="interestsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f093fb" />
                <stop offset="100%" stopColor="#f5576c" />
            </linearGradient>
        </defs>

        <circle cx="100" cy="100" r="70" fill="url(#interestsGradient)" opacity="0.1" />

        {/* Central hub */}
        <circle cx="100" cy="100" r="20" fill="url(#interestsGradient)" opacity="0.8" />

        {/* Interest nodes with connections */}
        <line x1="100" y1="80" x2="100" y2="52" stroke="#f093fb" strokeWidth="2" opacity="0.5" />
        <circle cx="100" cy="40" r="12" fill="#f093fb" />

        <line x1="100" y1="100" x2="138" y2="77" stroke="#ff6b9d" strokeWidth="2" opacity="0.5" />
        <circle cx="150" cy="70" r="12" fill="#ff6b9d" />

        <line x1="100" y1="100" x2="138" y2="123" stroke="#f5576c" strokeWidth="2" opacity="0.5" />
        <circle cx="150" cy="130" r="12" fill="#f5576c" />

        <line x1="100" y1="120" x2="100" y2="148" stroke="#ff6b9d" strokeWidth="2" opacity="0.5" />
        <circle cx="100" cy="160" r="12" fill="#ff6b9d" />

        <line x1="100" y1="100" x2="62" y2="123" stroke="#f093fb" strokeWidth="2" opacity="0.5" />
        <circle cx="50" cy="130" r="12" fill="#f093fb" />

        <line x1="100" y1="100" x2="62" y2="77" stroke="#f5576c" strokeWidth="2" opacity="0.5" />
        <circle cx="50" cy="70" r="12" fill="#f5576c" />
    </svg>
);

const CategoriesIllustration = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="categoriesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="50%" stopColor="#764ba2" />
                <stop offset="100%" stopColor="#f093fb" />
            </linearGradient>
        </defs>

        <circle cx="100" cy="100" r="70" fill="url(#categoriesGradient)" opacity="0.1" />

        {/* Pie segments */}
        <path d="M 100,100 L 100,30 A 70,70 0 0,1 161,61 Z" fill="#667eea" opacity="0.7" />
        <path d="M 100,100 L 161,61 A 70,70 0 0,1 161,139 Z" fill="#764ba2" opacity="0.7" />
        <path d="M 100,100 L 161,139 A 70,70 0 0,1 100,170 Z" fill="#f093fb" opacity="0.7" />
        <path d="M 100,100 L 100,170 A 70,70 0 0,1 39,139 Z" fill="#667eea" opacity="0.7" />
        <path d="M 100,100 L 39,139 A 70,70 0 0,1 39,61 Z" fill="#764ba2" opacity="0.7" />
        <path d="M 100,100 L 39,61 A 70,70 0 0,1 100,30 Z" fill="#f093fb" opacity="0.7" />

        {/* Center */}
        <circle cx="100" cy="100" r="30" fill="white" />
        <circle cx="100" cy="100" r="25" fill="url(#categoriesGradient)" opacity="0.8" />
        <circle cx="100" cy="100" r="15" fill="white" />
    </svg>
);

const CelebrationIllustration = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="celebrationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffd700" />
                <stop offset="100%" stopColor="#ff6b6b" />
            </linearGradient>
        </defs>

        {/* Confetti */}
        <rect x="40" y="30" width="8" height="12" fill="#ff6b6b" opacity="0.8" transform="rotate(15 44 36)" />
        <rect x="150" y="40" width="8" height="12" fill="#667eea" opacity="0.8" transform="rotate(-20 154 46)" />
        <rect x="60" y="160" width="8" height="12" fill="#f093fb" opacity="0.8" transform="rotate(25 64 166)" />
        <rect x="140" y="150" width="8" height="12" fill="#ffd700" opacity="0.8" transform="rotate(-15 144 156)" />

        <circle cx="30" cy="80" r="5" fill="#667eea" opacity="0.8" />
        <circle cx="170" cy="90" r="5" fill="#f093fb" opacity="0.8" />
        <circle cx="50" cy="120" r="5" fill="#ffd700" opacity="0.8" />
        <circle cx="160" cy="130" r="5" fill="#ff6b6b" opacity="0.8" />

        {/* Star trophy */}
        <circle cx="100" cy="100" r="50" fill="url(#celebrationGradient)" opacity="0.2" />
        <path
            d="M 100,60 L 110,85 L 135,90 L 115,108 L 120,133 L 100,120 L 80,133 L 85,108 L 65,90 L 90,85 Z"
            fill="url(#celebrationGradient)"
            stroke="#ff6b6b"
            strokeWidth="2"
        />
        <circle cx="100" cy="100" r="15" fill="white" opacity="0.9" />
    </svg>
);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type Activity = {
    id: string;
    text: string;
    logs: Array<{
        date: string;
        feeling: 'great' | 'okay' | 'hard';
        note: string;
        logged_at: string;
    }>;
    completed_dates: string[];
};

type RoadmapItem = {
    id: string;
    category: string;
    type: 'goal' | 'behavior_change';
    title: string;
    activities: Activity[];
    archived: boolean;
};

type WorksheetStatus = {
    values: boolean;
    interests: boolean;
    life_categories: boolean;
};

type RoadmapStats = {
    activeGoals: number;
    completedGoals: number;
    weeklyProgress: number;
};

// ============================================================================
// INTEGRATED DAILY CHECK-IN COMPONENT
// ============================================================================

function IntegratedDailyCheckIn() {
    const router = useRouter();
    const [suggestedActivities, setSuggestedActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [todayCount, setTodayCount] = useState(0);

    useEffect(() => {
        loadSuggestions();
    }, []);

    const loadSuggestions = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: roadmapData } = await supabase
                .from('workbook_entries')
                .select('content')
                .eq('user_id', user.id)
                .eq('category', 'roadmap')
                .single();

            if (!roadmapData) {
                setLoading(false);
                return;
            }

            const items: RoadmapItem[] = roadmapData.content.items || [];
            const activeItems = items.filter(item => !item.archived);

            const today = new Date().toISOString().split('T')[0];
            const allSuggestions: any[] = [];
            let countToday = 0;

            activeItems.forEach(item => {
                item.activities.forEach(activity => {
                    const logs = activity.logs || [];
                    const doneToday = activity.completed_dates.includes(today);

                    if (doneToday) {
                        countToday++;
                        return;
                    }

                    const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
                    let daysSinceLastLog: number | null = null;
                    if (lastLog) {
                        const lastLogDate = new Date(lastLog.date);
                        const todayDate = new Date(today);
                        daysSinceLastLog = Math.floor((todayDate.getTime() - lastLogDate.getTime()) / (1000 * 60 * 60 * 24));
                    }

                    let suggestionScore = 0;
                    let reason = '';

                    if (daysSinceLastLog === null) {
                        suggestionScore = 90;
                        reason = "Let's get started!";
                    } else if (daysSinceLastLog >= 7) {
                        suggestionScore = 85;
                        reason = "Time to get back to it";
                    } else if (daysSinceLastLog >= 3) {
                        suggestionScore = 70;
                        reason = "Keep momentum going";
                    } else if (daysSinceLastLog === 2) {
                        suggestionScore = 50;
                        reason = "Keep the rhythm";
                    } else if (daysSinceLastLog === 1) {
                        suggestionScore = 40;
                        reason = "Daily habit";
                    }

                    if (item.type === 'behavior_change') suggestionScore += 10;

                    allSuggestions.push({
                        itemId: item.id,
                        activityId: activity.id,
                        activityText: activity.text,
                        category: item.category,
                        goalTitle: item.title,
                        goalType: item.type,
                        daysSinceLastLog,
                        suggestionScore,
                        reason
                    });
                });
            });

            const topSuggestions = allSuggestions
                .sort((a, b) => b.suggestionScore - a.suggestionScore)
                .slice(0, 3);

            setSuggestedActivities(topSuggestions);
            setTodayCount(countToday);
        } catch (error) {
            console.error('Error loading suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (categoryName: string) => {
        const icons: Record<string, React.JSX.Element> = {
            'Health': <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
            'Relationships': <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
            'Social': <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584m12.006-.708A6 6 0 0 0 12 12.75a6 6 0 0 0-5.058 2.772M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/></svg>,
            'Learning': <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
            'Career': <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
            'Finance': <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
            'Spiritual': <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2 12h20"/></svg>,
            'Creative': <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="11.5" r="2.5"/><circle cx="17" cy="18.5" r="2.5"/><circle cx="8.5" cy="18.5" r="2.5"/><circle cx="5" cy="11.5" r="2.5"/><path d="M12 12c-1.333-1.333-3.5-1.333-5 0"/></svg>,
        };
        return icons[categoryName] || <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    };

    const formatLastDone = (days: number | null) => {
        if (days === null) return 'First time';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d ago`;
        const weeks = Math.floor(days / 7);
        return `${weeks}w ago`;
    };

    if (loading) {
        return (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-16 bg-gray-100 rounded"></div>
                    <div className="h-16 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    if (suggestedActivities.length === 0) {
        return (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-green-100">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-2xl flex items-center justify-center">
                        <CelebrationIllustration />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
                    <p className="text-gray-600 mb-4">You've logged {todayCount} activities today</p>
                    <button
                        onClick={() => router.push('/roadmap')}
                        className="bg-green-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-green-700 transition-all hover:shadow-lg hover:shadow-green-600/20"
                    >
                        View Roadmap →
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/20">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Today's Focus</h3>
                    <p className="text-sm text-gray-600">Top activities for today</p>
                </div>
                {todayCount > 0 && (
                    <div className="bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                        <span className="text-sm font-semibold text-green-700">{todayCount} done ✓</span>
                    </div>
                )}
            </div>

            {/* Activities */}
            <div className="space-y-2">
                {suggestedActivities.map((activity) => (
                    <button
                        key={activity.activityId}
                        onClick={() => router.push('/roadmap')}
                        className="w-full text-left p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-600/5 transition-all group"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-lg border-2 border-gray-300 group-hover:border-indigo-400 flex items-center justify-center flex-shrink-0 transition-colors mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-indigo-400 transition-colors"></div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                    {activity.activityText}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <span>{getCategoryIcon(activity.category)}</span>
                                    <span>{activity.category}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-500">{formatLastDone(activity.daysSinceLastLog)}</span>
                                </div>
                            </div>

                            <div className={`
                px-2 py-1 rounded-full text-[10px] font-bold flex-shrink-0
                ${activity.goalType === 'behavior_change'
                                    ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                    : 'bg-blue-50 text-blue-600 border border-blue-100'
                                }
              `}>
                                {activity.goalType === 'behavior_change' ? <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Footer */}
            <button
                onClick={() => router.push('/roadmap')}
                className="w-full mt-4 text-center text-sm text-indigo-600 hover:text-indigo-700 font-semibold py-2 hover:bg-indigo-50 rounded-xl transition-colors"
            >
                View All Activities →
            </button>
        </div>
    );
}

// ============================================================================
// INTEGRATED NEXT ACTIONS COMPONENT
// ============================================================================

function IntegratedNextActions() {
    const router = useRouter();
    const [urgentActivities, setUrgentActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUrgentActivities();
    }, []);

    const loadUrgentActivities = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: roadmapData } = await supabase
                .from('workbook_entries')
                .select('content')
                .eq('user_id', user.id)
                .eq('category', 'roadmap')
                .single();

            if (!roadmapData) {
                setLoading(false);
                return;
            }

            const items: RoadmapItem[] = roadmapData.content.items || [];
            const activeItems = items.filter(item => !item.archived);
            const today = new Date();
            const allActivities: any[] = [];

            activeItems.forEach(item => {
                item.activities.forEach(activity => {
                    const logs = activity.logs || [];
                    const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

                    let daysSinceLastLog: number | null = null;
                    if (lastLog) {
                        const lastLogDate = new Date(lastLog.date);
                        daysSinceLastLog = Math.floor((today.getTime() - lastLogDate.getTime()) / (1000 * 60 * 60 * 24));
                    }

                    let urgencyScore = 0;
                    if (daysSinceLastLog === null) urgencyScore = 100;
                    else if (daysSinceLastLog >= 7) urgencyScore = 80;
                    else if (daysSinceLastLog >= 3) urgencyScore = 60;
                    else urgencyScore = 20;

                    allActivities.push({
                        activityId: activity.id,
                        activityText: activity.text,
                        category: item.category,
                        goalTitle: item.title,
                        daysSinceLastLog,
                        urgencyScore
                    });
                });
            });

            const topUrgent = allActivities
                .sort((a, b) => b.urgencyScore - a.urgencyScore)
                .slice(0, 3);

            setUrgentActivities(topUrgent);
        } catch (error) {
            console.error('Error loading urgent activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (categoryName: string) => {
        const icons: Record<string, React.JSX.Element> = {
            'Health': <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
            'Relationships': <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
            'Social': <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584m12.006-.708A6 6 0 0 0 12 12.75a6 6 0 0 0-5.058 2.772M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/></svg>,
            'Learning': <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
            'Career': <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
            'Finance': <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
            'Spiritual': <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2 12h20"/></svg>,
            'Creative': <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="11.5" r="2.5"/><circle cx="17" cy="18.5" r="2.5"/><circle cx="8.5" cy="18.5" r="2.5"/><circle cx="5" cy="11.5" r="2.5"/><path d="M12 12c-1.333-1.333-3.5-1.333-5 0"/></svg>,
        };
        return icons[categoryName] || <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    };

    const getUrgencyBadge = (score: number) => {
        if (score >= 80) return { text: 'High', color: 'bg-red-500' };
        if (score >= 60) return { text: 'Med', color: 'bg-orange-500' };
        return { text: 'Low', color: 'bg-yellow-500' };
    };

    const formatLastDone = (days: number | null) => {
        if (days === null) return 'Never';
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days}d ago`;
        const weeks = Math.floor(days / 7);
        return `${weeks}w ago`;
    };

    if (loading) {
        return (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-16 bg-gray-100 rounded"></div>
                    <div className="h-16 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    if (urgentActivities.length === 0) {
        return (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-green-100">
                <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-3 bg-emerald-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
                    <p className="text-gray-600 mb-4">Great job staying on top of things</p>
                    <button
                        onClick={() => router.push('/roadmap')}
                        className="bg-green-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-green-700 transition-all"
                    >
                        View Roadmap
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/20">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Priority Actions</h3>
                    <p className="text-sm text-gray-600">Activities needing attention</p>
                </div>
            </div>

            <div className="space-y-2">
                {urgentActivities.map((activity, index) => {
                    const badge = getUrgencyBadge(activity.urgencyScore);
                    return (
                        <button
                            key={activity.activityId}
                            onClick={() => router.push('/roadmap')}
                            className="w-full text-left p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-600/5 transition-all group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 font-bold text-sm text-gray-600 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                                    {index + 1}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                                        {activity.activityText}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <span>{getCategoryIcon(activity.category)}</span>
                                        <span>{activity.category}</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-500">{formatLastDone(activity.daysSinceLastLog)}</span>
                                    </div>
                                </div>

                                <span className={`${badge.color} text-white text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0`}>
                                    {badge.text}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            <button
                onClick={() => router.push('/roadmap')}
                className="w-full mt-4 text-center text-sm text-orange-600 hover:text-orange-700 font-semibold py-2 hover:bg-orange-50 rounded-xl transition-colors"
            >
                View All Activities →
            </button>
        </div>
    );
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showWelcome, setShowWelcome] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [status, setStatus] = useState<WorksheetStatus>({
        values: false,
        interests: false,
        life_categories: false
    });
    const [hasRoadmap, setHasRoadmap] = useState(false);
    const [roadmapStats, setRoadmapStats] = useState<RoadmapStats>({
        activeGoals: 0,
        completedGoals: 0,
        weeklyProgress: 0
    });

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }
                if (userWithProfile.profile?.role === 'admin') {
                    router.push('/dashboard/admin');
                    return;
                }
                setUser(userWithProfile);

                if (!userWithProfile.profile?.welcome_seen) {
                    setShowWelcome(true);
                }

                const { data: worksheets } = await supabase
                    .from('workbook_entries')
                    .select('category, content')
                    .eq('user_id', userWithProfile.user.id);

                const completed = {
                    values: worksheets?.some(w => w.category === 'values') || false,
                    interests: worksheets?.some(w => w.category === 'interests') || false,
                    life_categories: worksheets?.some(w => w.category === 'life_categories') || false
                };

                setStatus(completed);

                const roadmapEntry = worksheets?.find(w => w.category === 'roadmap');
                if (roadmapEntry && roadmapEntry.content?.items) {
                    setHasRoadmap(true);
                    const items = roadmapEntry.content.items;
                    const activeItems = items.filter((item: any) => !item.archived);
                    const totalReflections = items.reduce((sum: number, item: any) =>
                        sum + (item.reflections?.length || 0), 0
                    );

                    let totalActivities = 0;
                    let completedActivities = 0;
                    items.forEach((item: any) => {
                        item.activities?.forEach((activity: any) => {
                            totalActivities++;
                            if (activity.completed_dates && activity.completed_dates.length > 0) {
                                completedActivities++;
                            }
                        });
                    });

                    const activityProgress = totalActivities > 0
                        ? Math.round((completedActivities / totalActivities) * 100)
                        : 0;

                    setRoadmapStats({
                        activeGoals: activeItems.length,
                        completedGoals: totalReflections,
                        weeklyProgress: activityProgress
                    });
                } else {
                    setHasRoadmap(false);
                }
            } catch (error) {
                console.error('Error loading dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [router]);

    const worksheetsComplete = Object.values(status).filter(Boolean).length;
    const lifeFrameComplete = status.values && status.interests && status.life_categories;
    const progressPercentage = (worksheetsComplete / 3) * 100;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    if (loading) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-16">
                    <div className="max-w-7xl mx-auto px-4 py-12">
                        <SkeletonCard />
                    </div>
                </div>
            </>
        );
    }

    if (showWelcome) {
        return (
            <OnboardingJourney
                onComplete={() => {
                    setShowWelcome(false);
                    setShowOnboarding(true);
                }}
                userName={user?.profile?.full_name}
            />
        );
    }

    return (
        <>
            <AuthNavbar />

            {/* Onboarding Modal - shows after WelcomeAnimation for new users */}
            {user?.user?.id && showOnboarding && (
                <OnboardingModal
                    userId={user.user.id}
                    onComplete={() => setShowOnboarding(false)}
                />
            )}

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-16">
                <div className="max-w-7xl mx-auto px-4 py-8">

                    {/* HERO SECTION */}
                    <div className="relative mb-12 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
                        <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                        }}></div>

                        <div className="relative z-10 px-8 md:px-12 py-12 md:py-16">
                            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                                <div className="text-white">
                                    <div className="text-lg md:text-xl font-medium mb-2 opacity-90">
                                        {getGreeting()},
                                    </div>
                                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
                                        {user?.profile?.full_name || 'Friend'}!
                                    </h1>
                                    <p className="text-lg md:text-xl text-white/90 mb-6 md:mb-8 leading-relaxed">
                                        {lifeFrameComplete
                                            ? "Your LifeFrame is complete! Now let's build your personalized Roadmap."
                                            : `You're ${worksheetsComplete} of 3 steps into building your LifeFrame foundation.`
                                        }
                                    </p>

                                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/30">
                                            <div className="text-2xl md:text-3xl font-bold">{worksheetsComplete}</div>
                                            <div className="text-xs md:text-sm opacity-90">Done</div>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/30">
                                            <div className="text-2xl md:text-3xl font-bold">{Math.round(progressPercentage)}%</div>
                                            <div className="text-xs md:text-sm opacity-90">Progress</div>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/30">
                                            <div className="text-2xl md:text-3xl font-bold">{hasRoadmap ? roadmapStats.activeGoals : '—'}</div>
                                            <div className="text-xs md:text-sm opacity-90">Goals</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden md:flex items-center justify-center">
                                    <div className="w-64 lg:w-80 h-64 lg:h-80">
                                        <HeroIllustration />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PROGRESS JOURNEY */}
                    <div className="mb-12 md:mb-16">
                        <div className="text-center mb-6 md:mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Your LifeFrame Journey</h2>
                            <p className="text-gray-600">Three steps to build your foundation</p>
                        </div>

                        {/* Progress Timeline */}
                        <div className="max-w-5xl mx-auto mb-6 md:mb-8">
                            <div className="flex items-center justify-between relative px-4">
                                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 -z-10"></div>
                                <div
                                    className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 -translate-y-1/2 transition-all duration-1000 -z-10"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>

                                {[1, 2, 3].map((step) => {
                                    const isComplete = step <= worksheetsComplete;
                                    const isCurrent = step === worksheetsComplete + 1;
                                    return (
                                        <div key={step} className="flex flex-col items-center">
                                            <div className={`
                        w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-base md:text-lg
                        transition-all duration-300 shadow-lg
                        ${isComplete
                                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white scale-110'
                                                    : isCurrent
                                                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white animate-pulse scale-110'
                                                        : 'bg-gray-300 text-gray-600'
                                                }
                      `}>
                                                {isComplete ? '✓' : step}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-2 font-medium hidden md:block">
                                                Step {step}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Step Cards */}
                        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                            {/* Values Card */}
                            <div className={`
                relative rounded-3xl p-6 transition-all duration-300
                ${status.values
                                    ? 'bg-white/80 backdrop-blur-sm border-2 border-green-200 shadow-[0_8px_30px_rgb(34,197,94,0.15)]'
                                    : 'bg-white/80 backdrop-blur-sm border-2 border-indigo-200 shadow-[0_8px_30px_rgb(99,102,241,0.08)] hover:shadow-[0_8px_30px_rgb(99,102,241,0.15)] hover:-translate-y-1'
                                }
              `}>
                                <div className="relative h-40 md:h-48 mb-4 md:mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center overflow-hidden">
                                    <div className="w-32 h-32 md:w-40 md:h-40">
                                        <ValuesIllustration />
                                    </div>
                                </div>

                                <div className="space-y-3 md:space-y-4">
                                    <div>
                                        <div className="inline-flex items-center gap-2 bg-indigo-100 px-3 py-1 rounded-full text-xs md:text-sm font-semibold text-indigo-700 mb-2">
                                            {status.values ? '✓ Complete' : 'Step 1'}
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-bold text-gray-900">Values</h3>
                                        <p className="text-sm md:text-base text-gray-600">Define your guiding principles</p>
                                    </div>

                                    <button
                                        onClick={() => router.push('/workbook/values')}
                                        className={`
                      w-full py-2 md:py-3 rounded-xl font-semibold text-sm md:text-base transition-all
                      ${status.values
                                                ? 'bg-green-50 text-green-600 border-2 border-green-200 hover:bg-green-100'
                                                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-600/20 transform hover:scale-105'
                                            }
                    `}
                                    >
                                        {status.values ? 'Review →' : 'Start →'}
                                    </button>
                                </div>
                            </div>

                            {/* Interests Card */}
                            <div className={`
                relative rounded-3xl p-6 transition-all duration-300
                ${status.interests
                                    ? 'bg-white/80 backdrop-blur-sm border-2 border-green-200 shadow-[0_8px_30px_rgb(34,197,94,0.15)]'
                                    : !status.values
                                        ? 'bg-gray-50/80 backdrop-blur-sm border-2 border-gray-200 opacity-60'
                                        : 'bg-white/80 backdrop-blur-sm border-2 border-pink-200 shadow-[0_8px_30px_rgb(236,72,153,0.08)] hover:shadow-[0_8px_30px_rgb(236,72,153,0.15)] hover:-translate-y-1'
                                }
              `}>
                                <div className="relative h-40 md:h-48 mb-4 md:mb-6 bg-gradient-to-br from-pink-100 to-orange-100 rounded-2xl flex items-center justify-center overflow-hidden">
                                    <div className="w-32 h-32 md:w-40 md:h-40">
                                        <InterestsIllustration />
                                    </div>
                                </div>

                                <div className="space-y-3 md:space-y-4">
                                    <div>
                                        <div className="inline-flex items-center gap-2 bg-pink-100 px-3 py-1 rounded-full text-xs md:text-sm font-semibold text-pink-700 mb-2">
                                            {status.interests ? '✓ Complete' : status.values ? 'Step 2' : 'Locked'}
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-bold text-gray-900">Interests</h3>
                                        <p className="text-sm md:text-base text-gray-600">What brings you joy</p>
                                    </div>

                                    <button
                                        onClick={() => router.push('/workbook/interests')}
                                        disabled={!status.values}
                                        className={`
                      w-full py-2 md:py-3 rounded-xl font-semibold text-sm md:text-base transition-all
                      ${status.interests
                                                ? 'bg-green-50 text-green-600 border-2 border-green-200 hover:bg-green-100'
                                                : !status.values
                                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-pink-600 to-orange-600 text-white hover:shadow-lg hover:shadow-pink-600/20 transform hover:scale-105'
                                            }
                    `}
                                    >
                                        {status.interests ? 'Review →' : !status.values ? 'Locked' : 'Start →'}
                                    </button>
                                </div>
                            </div>

                            {/* Life Categories Card */}
                            <div className={`
                relative rounded-3xl p-6 transition-all duration-300
                ${status.life_categories
                                    ? 'bg-white/80 backdrop-blur-sm border-2 border-green-200 shadow-[0_8px_30px_rgb(34,197,94,0.15)]'
                                    : !status.interests
                                        ? 'bg-gray-50/80 backdrop-blur-sm border-2 border-gray-200 opacity-60'
                                        : 'bg-white/80 backdrop-blur-sm border-2 border-purple-200 shadow-[0_8px_30px_rgb(147,51,234,0.08)] hover:shadow-[0_8px_30px_rgb(147,51,234,0.15)] hover:-translate-y-1'
                                }
              `}>
                                <div className="relative h-40 md:h-48 mb-4 md:mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center overflow-hidden">
                                    <div className="w-32 h-32 md:w-40 md:h-40">
                                        <CategoriesIllustration />
                                    </div>
                                </div>

                                <div className="space-y-3 md:space-y-4">
                                    <div>
                                        <div className="inline-flex items-center gap-2 bg-purple-100 px-3 py-1 rounded-full text-xs md:text-sm font-semibold text-purple-700 mb-2">
                                            {status.life_categories ? '✓ Complete' : status.interests ? 'Step 3' : 'Locked'}
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-bold text-gray-900">Life Categories</h3>
                                        <p className="text-sm md:text-base text-gray-600">Your focus areas & purpose</p>
                                    </div>

                                    <button
                                        onClick={() => router.push('/workbook/life-categories')}
                                        disabled={!status.interests}
                                        className={`
                      w-full py-2 md:py-3 rounded-xl font-semibold text-sm md:text-base transition-all
                      ${status.life_categories
                                                ? 'bg-green-50 text-green-600 border-2 border-green-200 hover:bg-green-100'
                                                : !status.interests
                                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-600/20 transform hover:scale-105'
                                            }
                    `}
                                    >
                                        {status.life_categories ? 'Review →' : !status.interests ? 'Locked' : 'Start →'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* LifeFrame Complete CTA / Locked State */}
                        <div className="mt-8 md:mt-12 max-w-4xl mx-auto">
                            {!status.life_categories ? (
                                // Locked State
                                <div className="relative rounded-3xl overflow-hidden bg-gray-50/80 backdrop-blur-sm border-2 border-gray-200 opacity-60">
                                    <div className="relative z-10 px-8 md:px-12 py-8 md:py-12 text-center">
                                        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                                            <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-gray-500">LifeFrame Locked</h3>
                                        <p className="text-gray-500 text-base md:text-lg mb-6 max-w-2xl mx-auto">
                                            Complete your Values, Interests, and Life Categories to unlock your full LifeFrame constellation.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                // Unlocked / Complete State
                                <div className="relative rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(34,197,94,0.2)]">
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600"></div>
                                    <div className="absolute inset-0 opacity-10" style={{
                                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                                        backgroundSize: '40px 40px'
                                    }}></div>

                                    <div className="relative z-10 px-8 md:px-12 py-8 md:py-12 text-center text-white">
                                        <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4">
                                            <CelebrationIllustration />
                                        </div>
                                        <h3 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">LifeFrame Complete!</h3>
                                        <p className="text-green-100 text-base md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto">
                                            Amazing work! You've laid the foundation. Now view your complete LifeFrame or start building your Roadmap.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                                            <button
                                                onClick={() => router.push('/workbook/lifeframe')}
                                                className="bg-white text-green-600 px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-base md:text-lg hover:shadow-2xl transition-all transform hover:scale-105"
                                            >
                                                View LifeFrame
                                            </button>
                                            <button
                                                onClick={() => window.open('/lifeframe/print', '_blank')}
                                                className="bg-white/90 text-green-600 px-6 md:px-8 py-3 md:py-4 rounded-full font-bold text-base md:text-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                </svg>
                                                Print LifeFrame
                                            </button>
                                            {/* Note: Build Roadmap and Print Roadmap moved below to the dedicated Roadmap section */}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* DEDICATED ROADMAP WIDGETS SECTION */}
                    {status.life_categories && hasRoadmap ? (
                        <div className="mb-12">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Your Roadmap</h2>
                                    <p className="text-gray-600">Daily actions and tracking</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push('/roadmap')}
                                        className="hidden md:block bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-semibold hover:bg-indigo-100 transition-all"
                                    >
                                        Edit Roadmap
                                    </button>
                                    <button
                                        onClick={() => window.open('/roadmap/print', '_blank')}
                                        className="bg-white border-2 border-indigo-100 text-indigo-600 px-4 py-2 rounded-xl font-semibold hover:bg-indigo-50 transition-all flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Print
                                    </button>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <IntegratedDailyCheckIn />
                                <IntegratedNextActions />
                            </div>
                        </div>
                    ) : (
                        <div className="mb-12 md:mb-16">
                            <div className={`relative rounded-3xl p-8 md:p-12 transition-all duration-300 text-center ${status.life_categories
                                ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-[0_8px_30px_rgb(99,102,241,0.1)]'
                                : 'bg-gray-50/80 backdrop-blur-sm border-2 border-gray-200 opacity-60'
                                }`}>
                                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                                    {status.life_categories
                                        ? <svg className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                                        : <svg className="w-8 h-8 md:w-10 md:h-10 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                    }
                                </div>
                                <h3 className={`text-2xl md:text-3xl font-bold mb-4 ${status.life_categories ? 'text-gray-900' : 'text-gray-500'}`}>
                                    {status.life_categories ? 'Ready to Build Your Roadmap?' : 'Roadmap Locked'}
                                </h3>
                                <p className={`text-base md:text-lg mb-8 max-w-2xl mx-auto ${status.life_categories ? 'text-gray-600' : 'text-gray-500'}`}>
                                    {status.life_categories
                                        ? "Now that your foundation is set, let's map out your goals and daily actions."
                                        : "Complete your LifeFrame foundation fully to unlock your goal tracking and daily action Roadmap."}
                                </p>
                                <button
                                    onClick={() => router.push('/roadmap')}
                                    disabled={!status.life_categories}
                                    className={`px-8 py-3 md:py-4 rounded-full font-bold text-base md:text-lg transition-all ${status.life_categories
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-200/50 transform hover:scale-105'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {status.life_categories ? 'Build Roadmap →' : 'Locked'}
                                </button>
                            </div>
                        </div>
                    )}


                    {/* TO-DO LIST WIDGET */}
                    {user?.user?.id && (
                        <div className="mb-12 md:mb-16">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">To-Do List</h2>
                                    <p className="text-gray-600">Quick-add tasks and track your progress</p>
                                </div>
                                <button
                                    onClick={() => router.push('/todo')}
                                    className="bg-amber-50 text-amber-600 border border-amber-200 px-4 py-2 rounded-xl font-semibold hover:bg-amber-100 transition-all text-sm"
                                >
                                    View Yellow Pad →
                                </button>
                            </div>
                            <DashboardTodoWidget userId={user.user.id} />
                        </div>
                    )}

                    {/* QUICK LINKS */}
                    <div className="grid md:grid-cols-3 gap-4 md:gap-6">
                        <div className="group relative rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(99,102,241,0.15)] transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600"></div>
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="relative z-10 p-6 md:p-8 text-white h-40 md:h-48 flex flex-col justify-between">
                                <div>
                                    <div className="text-4xl md:text-5xl mb-2 md:mb-3">📚</div>
                                    <h3 className="text-xl md:text-2xl font-bold">Resources</h3>
                                    <p className="text-white/90 text-xs md:text-sm">Videos, guides & downloads</p>
                                </div>
                                <button
                                    onClick={() => router.push('/resources')}
                                    className="self-start bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 md:px-6 py-2 rounded-full text-sm md:text-base font-semibold transition-all"
                                >
                                    Explore →
                                </button>
                            </div>
                        </div>

                        <div className="group relative rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(236,72,153,0.15)] transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-orange-600"></div>
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="relative z-10 p-6 md:p-8 text-white h-40 md:h-48 flex flex-col justify-between">
                                <div>
                                    <div className="text-4xl md:text-5xl mb-2 md:mb-3">👥</div>
                                    <h3 className="text-xl md:text-2xl font-bold">Community</h3>
                                    <p className="text-white/90 text-xs md:text-sm">Connect with others</p>
                                </div>
                                <button
                                    onClick={() => router.push('/resources')}
                                    className="self-start bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 md:px-6 py-2 rounded-full text-sm md:text-base font-semibold transition-all"
                                >
                                    Join →
                                </button>
                            </div>
                        </div>

                        <div className="group relative rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(34,197,94,0.15)] transition-all duration-300 hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600"></div>
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="relative z-10 p-6 md:p-8 text-white h-40 md:h-48 flex flex-col justify-between">
                                <div>
                                    <div className="text-4xl md:text-5xl mb-2 md:mb-3">💡</div>
                                    <h3 className="text-xl md:text-2xl font-bold">Get Help</h3>
                                    <p className="text-white/90 text-xs md:text-sm">Support & guidance</p>
                                </div>
                                <button
                                    onClick={() => router.push('/resources')}
                                    className="self-start bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 md:px-6 py-2 rounded-full text-sm md:text-base font-semibold transition-all"
                                >
                                    Contact →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}