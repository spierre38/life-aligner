'use client';

// app/dashboard/admin/activity/page.tsx
// Recent user activity feed

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface ActivityItem {
    id: string;
    user_id: string;
    user_name: string;
    type: 'signup' | 'workbook_save' | 'roadmap_save' | 'values_save' | 'interests_save' | 'categories_save';
    description: string;
    timestamp: string;
    metadata?: Record<string, any>;
}

const ACTIVITY_ICONS: Record<ActivityItem['type'], { icon: React.ReactNode; color: string; bg: string }> = {
    signup: {
        color: 'text-green-400',
        bg: 'bg-green-500/20',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
        ),
    },
    values_save: {
        color: 'text-purple-400',
        bg: 'bg-purple-500/20',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        ),
    },
    interests_save: {
        color: 'text-blue-400',
        bg: 'bg-blue-500/20',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
        ),
    },
    categories_save: {
        color: 'text-teal-400',
        bg: 'bg-teal-500/20',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        ),
    },
    roadmap_save: {
        color: 'text-orange-400',
        bg: 'bg-orange-500/20',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
        ),
    },
    workbook_save: {
        color: 'text-pink-400',
        bg: 'bg-pink-500/20',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
        ),
    },
};

function timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AdminActivityPage() {
    const supabase = createClient();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | ActivityItem['type']>('all');
    const [autoRefresh, setAutoRefresh] = useState(false);

    const fetchActivity = async () => {
        try {
            setLoading(true);

            // Get recent workbook entries as activity
            const { data: entries } = await supabase
                .from('workbook_entries')
                .select('id, user_id, category, created_at, updated_at')
                .order('updated_at', { ascending: false })
                .limit(50);

            // Get recent signups
            const { data: newUsers } = await supabase
                .from('profiles')
                .select('id, full_name, created_at')
                .order('created_at', { ascending: false })
                .limit(20);

            const activityItems: ActivityItem[] = [];

            // Map workbook entries to activity
            (entries || []).forEach(entry => {
                const typeMap: Record<string, ActivityItem['type']> = {
                    values: 'values_save',
                    interests: 'interests_save',
                    life_categories: 'categories_save',
                    roadmap: 'roadmap_save',
                };

                const type = typeMap[entry.category] || 'workbook_save';
                const labelMap: Record<string, string> = {
                    values: 'saved their Values',
                    interests: 'saved their Interests',
                    life_categories: 'saved Life Categories',
                    roadmap: 'saved their Roadmap',
                };

                activityItems.push({
                    id: entry.id,
                    user_id: entry.user_id,
                    user_name: entry.user_id.slice(0, 8),
                    type,
                    description: labelMap[entry.category] || 'saved workbook data',
                    timestamp: entry.updated_at,
                });
            });

            // Map signups to activity
            (newUsers || []).forEach(user => {
                activityItems.push({
                    id: `signup-${user.id}`,
                    user_id: user.id,
                    user_name: user.full_name || user.id.slice(0, 8),
                    type: 'signup',
                    description: 'created an account',
                    timestamp: user.created_at,
                });
            });

            // Sort by timestamp
            activityItems.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            setActivities(activityItems.slice(0, 50));
        } catch (err) {
            console.error('Activity fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivity();
    }, []);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchActivity, 30000);
        return () => clearInterval(interval);
    }, [autoRefresh]);

    const FILTERS = [
        { value: 'all', label: 'All' },
        { value: 'signup', label: 'Signups' },
        { value: 'values_save', label: 'Values' },
        { value: 'interests_save', label: 'Interests' },
        { value: 'categories_save', label: 'Categories' },
        { value: 'roadmap_save', label: 'Roadmap' },
    ] as const;

    const filtered = filter === 'all'
        ? activities
        : activities.filter(a => a.type === filter);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Activity</h1>
                    <p className="text-sm text-gray-500 mt-1">Real-time user activity feed</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Auto refresh toggle */}
                    <button
                        onClick={() => setAutoRefresh(prev => !prev)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition ${autoRefresh
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-gray-800 text-gray-400 hover:text-white'
                            }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                        {autoRefresh ? 'Live' : 'Auto-refresh'}
                    </button>
                    <button
                        onClick={fetchActivity}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-xl transition text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 bg-gray-800 rounded-xl p-1 w-fit flex-wrap">
                {FILTERS.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === f.value
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Activity Feed */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Loading activity...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500 text-sm">No activity found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800">
                        {filtered.map((activity) => {
                            const config = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.workbook_save;

                            return (
                                <div key={`${activity.id}-${activity.timestamp}`} className="flex items-start gap-4 p-4 hover:bg-gray-800/30 transition">
                                    {/* Icon */}
                                    <div className={`w-9 h-9 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                        <span className={config.color}>{config.icon}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white">
                                            <span className="font-medium">{activity.user_name}</span>
                                            {' '}
                                            <span className="text-gray-400">{activity.description}</span>
                                        </p>
                                        <p className="text-xs text-gray-600 mt-0.5 font-mono">
                                            {activity.user_id.slice(0, 16)}...
                                        </p>
                                    </div>

                                    {/* Timestamp */}
                                    <span className="text-xs text-gray-500 flex-shrink-0 mt-0.5">
                                        {timeAgo(activity.timestamp)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-600 text-center">
                Showing last 50 activities • Updates when you refresh
            </p>
        </div>
    );
}