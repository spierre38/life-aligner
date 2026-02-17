'use client';

// app/dashboard/admin/page.tsx
// Admin overview dashboard with key stats from Supabase

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
    totalUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    activeUsers: number;
    workbookCompletions: number;
    completionRate: number;
    valuesSaved: number;
    interestsSaved: number;
    categoriesSaved: number;
    roadmapsSaved: number;
    freeUsers: number;
    paidUsers: number;
    lifetimeUsers: number;
}

interface RecentUser {
    id: string;
    email: string;
    full_name: string | null;
    created_at: string;
    subscription_status: string;
    workbook_completed: boolean;
    role: string;
}

// ─── Stat Card Component ──────────────────────────────────────────────────────

function StatCard({
    title,
    value,
    subtitle,
    trend,
    color = 'purple',
    icon,
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: { value: number; label: string };
    color?: 'purple' | 'blue' | 'green' | 'orange' | 'pink';
    icon: React.ReactNode;
}) {
    const colors = {
        purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
        blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
        green: 'from-green-500/20 to-green-600/10 border-green-500/30',
        orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
        pink: 'from-pink-500/20 to-pink-600/10 border-pink-500/30',
    };

    const iconColors = {
        purple: 'text-purple-400',
        blue: 'text-blue-400',
        green: 'text-green-400',
        orange: 'text-orange-400',
        pink: 'text-pink-400',
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-6 backdrop-blur-sm`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`${iconColors[color]}`}>{icon}</div>
                {trend && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend.value >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)} {trend.label}
                    </span>
                )}
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-sm font-medium text-gray-300">{title}</div>
            {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
    const supabase = createClient();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get today's start
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            // Get week start
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - 7);

            // Run all queries in parallel for speed
            const [
                profilesResult,
                newTodayResult,
                newWeekResult,
                workbookResult,
                subscriptionResult,
                recentUsersResult,
            ] = await Promise.all([
                // Total users
                supabase.from('profiles').select('id', { count: 'exact' }),

                // New users today
                supabase
                    .from('profiles')
                    .select('id', { count: 'exact' })
                    .gte('created_at', todayStart.toISOString()),

                // New users this week
                supabase
                    .from('profiles')
                    .select('id', { count: 'exact' })
                    .gte('created_at', weekStart.toISOString()),

                // Workbook completions per category
                supabase
                    .from('workbook_entries')
                    .select('category', { count: 'exact' }),

                // Subscription breakdown
                supabase
                    .from('profiles')
                    .select('subscription_status, workbook_completed'),

                // Recent 5 users
                supabase
                    .from('profiles')
                    .select('id, full_name, subscription_status, workbook_completed, role, created_at')
                    .order('created_at', { ascending: false })
                    .limit(5),
            ]);

            // Count workbook entries per category
            const workbookData = workbookResult.data || [];
            const valuesSaved = workbookData.filter(e => e.category === 'values').length;
            const interestsSaved = workbookData.filter(e => e.category === 'interests').length;
            const categoriesSaved = workbookData.filter(e => e.category === 'life_categories').length;
            const roadmapsSaved = workbookData.filter(e => e.category === 'roadmap').length;

            // Subscription breakdown
            const subData = subscriptionResult.data || [];
            const freeUsers = subData.filter(p => p.subscription_status === 'free').length;
            const paidUsers = subData.filter(p => p.subscription_status === 'paid').length;
            const lifetimeUsers = subData.filter(p => p.subscription_status === 'lifetime').length;
            const workbookCompletions = subData.filter(p => p.workbook_completed).length;

            const totalUsers = profilesResult.count || 0;
            const completionRate = totalUsers > 0
                ? Math.round((workbookCompletions / totalUsers) * 100)
                : 0;

            // Get emails for recent users from auth.users via RPC
            // Note: we can only get what's in profiles table directly
            const recentProfiles = recentUsersResult.data || [];

            setStats({
                totalUsers,
                newUsersToday: newTodayResult.count || 0,
                newUsersThisWeek: newWeekResult.count || 0,
                activeUsers: newWeekResult.count || 0,
                workbookCompletions,
                completionRate,
                valuesSaved,
                interestsSaved,
                categoriesSaved,
                roadmapsSaved,
                freeUsers,
                paidUsers,
                lifetimeUsers,
            });

            setRecentUsers(recentProfiles.map(p => ({
                id: p.id,
                email: 'Loading...', // Can't get email from profiles table directly
                full_name: p.full_name,
                created_at: p.created_at,
                subscription_status: p.subscription_status,
                workbook_completed: p.workbook_completed,
                role: p.role,
            })));

            setLastRefreshed(new Date());
        } catch (err) {
            console.error('Error fetching admin stats:', err);
            setError('Failed to load stats. Please refresh.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 animate-pulse">
                            <div className="h-4 bg-gray-700 rounded mb-4 w-1/2" />
                            <div className="h-8 bg-gray-700 rounded mb-2 w-1/3" />
                            <div className="h-3 bg-gray-700 rounded w-2/3" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                    onClick={fetchStats}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Overview</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Last updated: {lastRefreshed.toLocaleTimeString()}
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-xl transition text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Primary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Users"
                    value={stats?.totalUsers ?? 0}
                    subtitle="All time registrations"
                    color="purple"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                />
                <StatCard
                    title="New Today"
                    value={stats?.newUsersToday ?? 0}
                    subtitle="Signups in last 24h"
                    color="blue"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
                />
                <StatCard
                    title="Completions"
                    value={stats?.workbookCompletions ?? 0}
                    subtitle="Full workbooks done"
                    color="green"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard
                    title="Completion Rate"
                    value={`${stats?.completionRate ?? 0}%`}
                    subtitle="Users who finished"
                    color="orange"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                />
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    title="Free Users"
                    value={stats?.freeUsers ?? 0}
                    color="blue"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                />
                <StatCard
                    title="Paid Users"
                    value={stats?.paidUsers ?? 0}
                    color="green"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard
                    title="New This Week"
                    value={stats?.newUsersThisWeek ?? 0}
                    color="pink"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                />
            </div>

            {/* Workbook Progress + Recent Users */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Workbook Section Completion */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-5">Workbook Section Completion</h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Values', count: stats?.valuesSaved ?? 0, color: 'bg-purple-500' },
                            { label: 'Interests', count: stats?.interestsSaved ?? 0, color: 'bg-blue-500' },
                            { label: 'Life Categories', count: stats?.categoriesSaved ?? 0, color: 'bg-green-500' },
                            { label: 'Roadmap', count: stats?.roadmapsSaved ?? 0, color: 'bg-orange-500' },
                        ].map((section) => {
                            const max = Math.max(
                                stats?.valuesSaved ?? 0,
                                stats?.interestsSaved ?? 0,
                                stats?.categoriesSaved ?? 0,
                                stats?.roadmapsSaved ?? 0,
                                1
                            );
                            const pct = Math.round((section.count / max) * 100);

                            return (
                                <div key={section.label}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="text-gray-300">{section.label}</span>
                                        <span className="text-gray-400 font-medium">{section.count} users</span>
                                    </div>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${section.color} rounded-full transition-all duration-700`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Signups */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-white font-semibold">Recent Signups</h3>
                        <a href="/dashboard/admin/users" className="text-xs text-purple-400 hover:text-purple-300 transition">
                            View all →
                        </a>
                    </div>
                    <div className="space-y-3">
                        {recentUsers.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">No users yet</p>
                        ) : (
                            recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                        {(user.full_name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">
                                            {user.full_name || 'Unknown User'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {user.workbook_completed && (
                                            <span className="w-2 h-2 bg-green-400 rounded-full" title="Workbook complete" />
                                        )}
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.subscription_status === 'paid'
                                            ? 'bg-green-500/20 text-green-400'
                                            : user.subscription_status === 'lifetime'
                                                ? 'bg-purple-500/20 text-purple-400'
                                                : 'bg-gray-700 text-gray-400'
                                            }`}>
                                            {user.subscription_status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* GA4 Embed hint */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Google Analytics</h3>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">External</span>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                    View detailed traffic analytics, user journeys, and conversion funnels in your GA4 dashboard.
                </p>
                <a
                    href={`https://analytics.google.com/analytics/web/#/p${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.replace('G-', '')}/reports/overview`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open GA4 Dashboard
                </a>
            </div>
        </div>
    );
}