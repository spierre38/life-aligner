'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
    title: string;
    activities: Activity[];
    archived: boolean;
};

type UrgentActivity = {
    activityId: string;
    activityText: string;
    category: string;
    goalTitle: string;
    daysSinceLastLog: number | null;
    urgencyScore: number;
};

export default function NextActionsWidget() {
    const router = useRouter();
    const [urgentActivities, setUrgentActivities] = useState<UrgentActivity[]>([]);
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

            // Calculate urgency for all activities
            const today = new Date();
            const allActivities: UrgentActivity[] = [];

            activeItems.forEach(item => {
                item.activities.forEach(activity => {
                    const logs = activity.logs || [];
                    const lastLog = logs.length > 0
                        ? logs[logs.length - 1]
                        : null;

                    let daysSinceLastLog: number | null = null;
                    if (lastLog) {
                        const lastLogDate = new Date(lastLog.date);
                        daysSinceLastLog = Math.floor((today.getTime() - lastLogDate.getTime()) / (1000 * 60 * 60 * 24));
                    }

                    // Calculate urgency score
                    let urgencyScore = 0;
                    if (daysSinceLastLog === null) {
                        urgencyScore = 100; // Never done = highest priority
                    } else if (daysSinceLastLog >= 7) {
                        urgencyScore = 80; // 7+ days = high
                    } else if (daysSinceLastLog >= 3) {
                        urgencyScore = 60; // 3-6 days = medium
                    } else {
                        urgencyScore = 20; // 0-2 days = low
                    }

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

            // Sort by urgency and take top 3
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

    const getUrgencyColor = (urgencyScore: number) => {
        if (urgencyScore >= 80) return 'bg-red-50 border-red-200';
        if (urgencyScore >= 60) return 'bg-orange-50 border-orange-200';
        return 'bg-yellow-50 border-yellow-200';
    };

    const getUrgencyBadge = (urgencyScore: number) => {
        if (urgencyScore >= 80) return { text: 'High', color: 'bg-red-500' };
        if (urgencyScore >= 60) return { text: 'Medium', color: 'bg-orange-500' };
        return { text: 'Low', color: 'bg-yellow-500' };
    };

    const formatLastDone = (days: number | null) => {
        if (days === null) return 'Never';
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        const weeks = Math.floor(days / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-20 bg-gray-100 rounded"></div>
                        <div className="h-20 bg-gray-100 rounded"></div>
                        <div className="h-20 bg-gray-100 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (urgentActivities.length === 0) {
        return (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-8 border-2 border-green-200">
                <div className="text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
                    <p className="text-gray-700 mb-4">
                        You're on top of your activities. Keep up the great work!
                    </p>
                    <button
                        onClick={() => router.push('/roadmap')}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                    >
                        View Roadmap
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white text-xl">
                        🎯
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Next Actions</h3>
                        <p className="text-sm text-gray-600">Top 3 activities needing attention</p>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/roadmap')}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                    View All →
                </button>
            </div>

            {/* Urgent Activities */}
            <div className="space-y-3">
                {urgentActivities.map((activity, index) => {
                    const badge = getUrgencyBadge(activity.urgencyScore);

                    return (
                        <button
                            key={activity.activityId}
                            onClick={() => router.push('/roadmap')}
                            className={`
                w-full text-left p-4 rounded-xl border-2 transition-all
                hover:shadow-md hover:scale-[1.02]
                ${getUrgencyColor(activity.urgencyScore)}
              `}
                        >
                            <div className="flex items-start gap-3">
                                {/* Number Badge */}
                                <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center flex-shrink-0 font-bold text-sm text-gray-700">
                                    {index + 1}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-gray-900 mb-1 truncate">
                                                {activity.activityText}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <span>{getCategoryIcon(activity.category)}</span>
                                                <span>{activity.category}</span>
                                                <span className="text-gray-400">•</span>
                                                <span className="truncate">{activity.goalTitle}</span>
                                            </div>
                                        </div>

                                        {/* Urgency Badge */}
                                        <span className={`
                      ${badge.color} text-white text-xs font-bold px-2 py-1 rounded-full
                      flex-shrink-0
                    `}>
                                            {badge.text}
                                        </span>
                                    </div>

                                    {/* Last Done */}
                                    <div className="text-xs text-gray-700 font-medium">
                                        Last done: {formatLastDone(activity.daysSinceLastLog)}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Footer Tip */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-start gap-2 text-xs text-gray-600">
                    <span>💡</span>
                    <span>
                        Activities are prioritized by how long it's been since you last logged them.
                        Click any activity to go to your Roadmap.
                    </span>
                </div>
            </div>
        </div>
    );
}
