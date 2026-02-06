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
    type: 'goal' | 'behavior_change';
    title: string;
    activities: Activity[];
    archived: boolean;
};

type SuggestedActivity = {
    itemId: string;
    activityId: string;
    activityText: string;
    category: string;
    goalTitle: string;
    goalType: 'goal' | 'behavior_change';
    daysSinceLastLog: number | null;
    suggestionScore: number;
    reason: string;
};

export default function DailyCheckIn() {
    const router = useRouter();
    const [suggestedActivities, setSuggestedActivities] = useState<SuggestedActivity[]>([]);
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
            const allSuggestions: SuggestedActivity[] = [];
            let countToday = 0;

            activeItems.forEach(item => {
                item.activities.forEach(activity => {
                    const logs = activity.logs || [];
                    const doneToday = activity.completed_dates.includes(today);

                    if (doneToday) {
                        countToday++;
                        return; // Skip activities already done today
                    }

                    const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

                    let daysSinceLastLog: number | null = null;
                    if (lastLog) {
                        const lastLogDate = new Date(lastLog.date);
                        const todayDate = new Date(today);
                        daysSinceLastLog = Math.floor((todayDate.getTime() - lastLogDate.getTime()) / (1000 * 60 * 60 * 24));
                    }

                    // Calculate suggestion score (similar to urgency but includes behavior patterns)
                    let suggestionScore = 0;
                    let reason = '';

                    if (daysSinceLastLog === null) {
                        // Never done - high priority for new starts
                        suggestionScore = 90;
                        reason = "Let's get started on this!";
                    } else if (daysSinceLastLog >= 7) {
                        // Week+ gap - high priority
                        suggestionScore = 85;
                        reason = "It's been a week - time to get back to it!";
                    } else if (daysSinceLastLog >= 3) {
                        // 3-6 days - good time to do it
                        suggestionScore = 70;
                        reason = "Good time to keep momentum going";
                    } else if (daysSinceLastLog === 2) {
                        // 2 days - maintain rhythm
                        suggestionScore = 50;
                        reason = "Keep the rhythm going";
                    } else if (daysSinceLastLog === 1) {
                        // Did yesterday - might be daily habit
                        suggestionScore = 40;
                        reason = "Make it a daily habit";
                    }

                    // Boost for behavior changes (habits are daily)
                    if (item.type === 'behavior_change') {
                        suggestionScore += 10;
                    }

                    // Boost based on recent consistency (if logging regularly)
                    if (logs.length >= 3) {
                        const recentLogs = logs.slice(-5);
                        const avgDaysBetween = recentLogs.length > 1
                            ? recentLogs.reduce((sum, log, i) => {
                                if (i === 0) return 0;
                                const prevDate = new Date(recentLogs[i - 1].date);
                                const currDate = new Date(log.date);
                                return sum + Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
                            }, 0) / (recentLogs.length - 1)
                            : 0;

                        // If normally done every 2-3 days and it's been 2-3 days
                        if (avgDaysBetween >= 2 && avgDaysBetween <= 3 && daysSinceLastLog !== null && daysSinceLastLog >= 2) {
                            suggestionScore += 15;
                            reason = "Time for your regular check-in";
                        }
                    }

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

            // Sort by score and take top 5
            const topSuggestions = allSuggestions
                .sort((a, b) => b.suggestionScore - a.suggestionScore)
                .slice(0, 5);

            setSuggestedActivities(topSuggestions);
            setTodayCount(countToday);
        } catch (error) {
            console.error('Error loading suggestions:', error);
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

    const formatLastDone = (days: number | null) => {
        if (days === null) return 'First time!';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        const weeks = Math.floor(days / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    };

    const getTimeOfDayGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-24 bg-gray-100 rounded"></div>
                        <div className="h-24 bg-gray-100 rounded"></div>
                        <div className="h-24 bg-gray-100 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (suggestedActivities.length === 0) {
        return (
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-2xl shadow-lg p-8 border-2 border-purple-200">
                <div className="text-center">
                    <div className="text-6xl mb-4">✨</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Amazing Work Today!</h3>
                    <p className="text-gray-700 mb-4">
                        You've logged all your activities for today. Take a moment to celebrate! 🎉
                    </p>
                    {todayCount > 0 && (
                        <p className="text-sm text-purple-700 mb-4">
                            You've completed <strong>{todayCount}</strong> activities today
                        </p>
                    )}
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => router.push('/roadmap')}
                            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
                        >
                            View Roadmap
                        </button>
                        <button
                            onClick={loadSuggestions}
                            className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold border-2 border-purple-300 hover:bg-purple-50 transition"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-lg p-6 border-2 border-indigo-200">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl">
                        ☀️
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">{getTimeOfDayGreeting()}!</h3>
                        <p className="text-sm text-gray-700">Here's what to focus on today</p>
                    </div>
                </div>

                {todayCount > 0 && (
                    <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3 mt-3">
                        <div className="flex items-center gap-2 text-sm text-green-800">
                            <span className="text-lg">✓</span>
                            <span>
                                <strong>{todayCount}</strong> {todayCount === 1 ? 'activity' : 'activities'} already logged today - great progress!
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Suggested Activities */}
            <div className="space-y-3 mb-4">
                {suggestedActivities.map((activity, index) => (
                    <button
                        key={activity.activityId}
                        onClick={() => router.push('/roadmap')}
                        className="w-full text-left p-4 bg-white rounded-xl border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-lg transition-all hover:scale-[1.02]"
                    >
                        <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <div className="w-8 h-8 rounded-lg border-2 border-indigo-300 flex items-center justify-center flex-shrink-0 text-indigo-400 hover:bg-indigo-50 transition">
                                <span className="text-xl">○</span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 mb-1">
                                    {activity.activityText}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                                    <span>{getCategoryIcon(activity.category)}</span>
                                    <span>{activity.category}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="truncate">{activity.goalTitle}</span>
                                </div>

                                <div className="flex items-center gap-3 text-xs">
                                    <span className="text-indigo-700 font-medium">
                                        {activity.reason}
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-600">
                                        Last: {formatLastDone(activity.daysSinceLastLog)}
                                    </span>
                                </div>
                            </div>

                            {/* Type Badge */}
                            <div className={`
                px-2 py-1 rounded-full text-[10px] font-bold flex-shrink-0
                ${activity.goalType === 'behavior_change'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                }
              `}>
                                {activity.goalType === 'behavior_change' ? '🔄 Habit' : '🎯 Goal'}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t-2 border-indigo-200">
                <div className="flex items-start gap-2 text-xs text-gray-700">
                    <span>💡</span>
                    <span>
                        These activities are prioritized based on when you last logged them.
                        Click any to go log it on your Roadmap!
                    </span>
                </div>
                <button
                    onClick={() => router.push('/roadmap')}
                    className="text-sm text-indigo-700 hover:text-indigo-900 font-semibold flex-shrink-0 ml-4"
                >
                    View All →
                </button>
            </div>
        </div>
    );
}
