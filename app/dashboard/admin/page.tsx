'use client';

// app/dashboard/admin/page.tsx
// Executive Admin Overview & Platform Command Center

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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
    // Curriculum stats
    totalVideosWatched: number;
    usersStartedVideos: number;
    usersCompletedAllVideos: number;
}

interface RecentUser {
    id: string;
    full_name: string | null;
    created_at: string;
    subscription_status: string;
    workbook_completed: boolean;
    role: string;
    videosWatchedCount: number;
}

// ─── Glassmorphic Stat Card ───────────────────────────────────────────────────

function ModernStatCard({
    title,
    value,
    subtitle,
    badge,
    color = 'purple',
    icon,
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    badge?: string;
    color?: 'purple' | 'blue' | 'emerald' | 'amber' | 'cyan';
    icon: React.ReactNode;
}) {
    const accents = {
        purple: {
            border: 'border-purple-500/20 hover:border-purple-500/40',
            bg: 'from-purple-500/[0.08] to-purple-600/[0.02]',
            iconBg: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
            badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
            glow: 'rgba(168, 85, 247, 0.15)',
        },
        blue: {
            border: 'border-blue-500/20 hover:border-blue-500/40',
            bg: 'from-blue-500/[0.08] to-blue-600/[0.02]',
            iconBg: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
            badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
            glow: 'rgba(59, 130, 246, 0.15)',
        },
        emerald: {
            border: 'border-emerald-500/20 hover:border-emerald-500/40',
            bg: 'from-emerald-500/[0.08] to-emerald-600/[0.02]',
            iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
            badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
            glow: 'rgba(16, 185, 129, 0.15)',
        },
        amber: {
            border: 'border-amber-500/20 hover:border-amber-500/40',
            bg: 'from-amber-500/[0.08] to-amber-600/[0.02]',
            iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
            badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
            glow: 'rgba(245, 158, 11, 0.15)',
        },
        cyan: {
            border: 'border-cyan-500/20 hover:border-cyan-500/40',
            bg: 'from-cyan-500/[0.08] to-cyan-600/[0.02]',
            iconBg: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
            badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
            glow: 'rgba(6, 182, 212, 0.15)',
        },
    };

    const c = accents[color];

    return (
        <div
            className={`relative group rounded-2xl p-5 bg-gradient-to-b ${c.bg} border ${c.border} backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-black/40 overflow-hidden`}
        >
            <div
                className="pointer-events-none absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl transition-opacity group-hover:opacity-100 opacity-60"
                style={{ background: c.glow }}
            />

            <div className="flex items-start justify-between mb-3 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                    {icon}
                </div>
                {badge && (
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${c.badge}`}>
                        {badge}
                    </span>
                )}
            </div>

            <div className="relative z-10">
                <div className="text-3xl font-extrabold text-white tracking-tight mb-1">
                    {value}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {title}
                </div>
                {subtitle && (
                    <div className="text-xs text-gray-500 mt-1">
                        {subtitle}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - 7);

            // Parallel queries across profiles and workbook entries
            const [
                profilesResult,
                newTodayResult,
                newWeekResult,
                workbookResult,
                allProfilesResult,
                recentUsersResult,
            ] = await Promise.all([
                // Total users count
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
                    .select('category, user_id'),

                // Video progress and subscription breakdown across profiles
                supabase
                    .from('profiles')
                    .select('subscription_status, workbook_completed, video_progress'),

                // Recent 6 users
                supabase
                    .from('profiles')
                    .select('id, full_name, subscription_status, workbook_completed, role, created_at, video_progress')
                    .order('created_at', { ascending: false })
                    .limit(6),
            ]);

            const workbookData = workbookResult.data || [];
            const valuesSaved = workbookData.filter(e => e.category === 'values').length;
            const interestsSaved = workbookData.filter(e => e.category === 'interests').length;
            const categoriesSaved = workbookData.filter(e => e.category === 'life_categories').length;
            const roadmapsSaved = workbookData.filter(e => e.category === 'roadmap').length;

            const allProfiles = allProfilesResult.data || [];
            const freeUsers = allProfiles.filter(p => p.subscription_status === 'free').length;
            const paidUsers = allProfiles.filter(p => p.subscription_status === 'paid').length;
            const lifetimeUsers = allProfiles.filter(p => p.subscription_status === 'lifetime').length;
            const workbookCompletions = allProfiles.filter(p => p.workbook_completed).length;

            // Video engagement calculations
            let totalVideosWatched = 0;
            let usersStartedVideos = 0;
            let usersCompletedAllVideos = 0;

            allProfiles.forEach(p => {
                const prog = p.video_progress as { watched?: string[] } | null;
                const watchedCount = Array.isArray(prog?.watched) ? prog.watched.length : 0;
                if (watchedCount > 0) {
                    usersStartedVideos++;
                    totalVideosWatched += watchedCount;
                }
                if (watchedCount >= 19) {
                    usersCompletedAllVideos++;
                }
            });

            const totalUsers = profilesResult.count || 0;
            const completionRate = totalUsers > 0
                ? Math.round((workbookCompletions / totalUsers) * 100)
                : 0;

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
                totalVideosWatched,
                usersStartedVideos,
                usersCompletedAllVideos,
            });

            const recentProfiles = recentUsersResult.data || [];
            setRecentUsers(recentProfiles.map(p => {
                const prog = p.video_progress as { watched?: string[] } | null;
                const watchedCount = Array.isArray(prog?.watched) ? prog.watched.length : 0;
                return {
                    id: p.id,
                    full_name: p.full_name,
                    created_at: p.created_at,
                    subscription_status: p.subscription_status || 'free',
                    workbook_completed: !!p.workbook_completed,
                    role: p.role || 'user',
                    videosWatchedCount: watchedCount,
                };
            }));

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
                        <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 animate-pulse">
                            <div className="h-4 bg-white/10 rounded mb-4 w-1/2" />
                            <div className="h-8 bg-white/10 rounded mb-2 w-1/3" />
                            <div className="h-3 bg-white/5 rounded w-2/3" />
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
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-xl transition font-medium"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const totalUsers = stats?.totalUsers || 1;

    return (
        <div className="space-y-8">
            {/* Top Command Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Executive Command Center</h1>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live System
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        Tim Collins Framework · Last synced {lastRefreshed.toLocaleTimeString()}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/admin/cohorts"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-purple-600/25 transition-all hover:scale-[1.02]"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                        Instructor Cohorts
                    </Link>

                    <button
                        onClick={fetchStats}
                        className="inline-flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 hover:text-white px-3.5 py-2.5 rounded-xl transition text-xs font-semibold"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Primary KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ModernStatCard
                    title="Total Registered"
                    value={stats?.totalUsers ?? 0}
                    subtitle={`+${stats?.newUsersThisWeek ?? 0} this week · +${stats?.newUsersToday ?? 0} today`}
                    badge="Platform"
                    color="purple"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    }
                />

                <ModernStatCard
                    title="LifeFrame Complete"
                    value={stats?.workbookCompletions ?? 0}
                    subtitle={`${stats?.completionRate ?? 0}% student completion rate`}
                    badge="Milestone"
                    color="emerald"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />

                <ModernStatCard
                    title="Videos Completed"
                    value={stats?.totalVideosWatched ?? 0}
                    subtitle={`${stats?.usersStartedVideos ?? 0} active video learners`}
                    badge="Curriculum"
                    color="cyan"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />

                <ModernStatCard
                    title="Roadmaps Active"
                    value={stats?.roadmapsSaved ?? 0}
                    subtitle="Students setting live goals"
                    badge="Execution"
                    color="amber"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                    }
                />
            </div>

            {/* University Cohort Highlight Card */}
            <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-blue-900/30 border border-purple-500/30 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                <div className="pointer-events-none absolute right-0 top-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-3">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            </svg>
                            Academic & Cohort Management
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                            Instructor Cohort Progress Matrix
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">
                            Track student milestones step-by-step, review who is stuck, audit video watching progression, and export accreditation-ready grade sheets in CSV format.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href="/dashboard/admin/cohorts"
                            className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all hover:scale-105 flex items-center gap-2"
                        >
                            Open Cohort Roster
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>

            {/* LifeFrame Pedagogical Funnel + Video Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Progression Funnel */}
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-white font-bold text-base">LifeFrame Progression Funnel</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Drop-off and completion at each pedagogical milestone</p>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 font-semibold border border-purple-500/20">
                            Funnel
                        </span>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                step: '1. Registered Users',
                                count: stats?.totalUsers ?? 0,
                                pct: 100,
                                color: 'from-purple-500 to-indigo-500',
                            },
                            {
                                step: '2. Values Defined (Step 1)',
                                count: stats?.valuesSaved ?? 0,
                                pct: Math.round(((stats?.valuesSaved ?? 0) / totalUsers) * 100),
                                color: 'from-indigo-500 to-blue-500',
                            },
                            {
                                step: '3. Interests Explored (Step 2)',
                                count: stats?.interestsSaved ?? 0,
                                pct: Math.round(((stats?.interestsSaved ?? 0) / totalUsers) * 100),
                                color: 'from-blue-500 to-cyan-500',
                            },
                            {
                                step: '4. Life Categories & Purpose (Step 3)',
                                count: stats?.categoriesSaved ?? 0,
                                pct: Math.round(((stats?.categoriesSaved ?? 0) / totalUsers) * 100),
                                color: 'from-cyan-500 to-emerald-500',
                            },
                            {
                                step: '5. Roadmap Goals Active',
                                count: stats?.roadmapsSaved ?? 0,
                                pct: Math.round(((stats?.roadmapsSaved ?? 0) / totalUsers) * 100),
                                color: 'from-emerald-500 to-teal-400',
                            },
                        ].map((s) => (
                            <div key={s.step} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-300 font-medium">{s.step}</span>
                                    <span className="text-gray-400 font-semibold">
                                        {s.count} <span className="text-gray-500 font-normal">({s.pct}%)</span>
                                    </span>
                                </div>
                                <div className="h-2.5 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.05]">
                                    <div
                                        className={`h-full bg-gradient-to-r ${s.color} rounded-full transition-all duration-1000`}
                                        style={{ width: `${Math.min(s.pct, 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Curriculum & Video Engagement */}
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-white font-bold text-base">Video Curriculum Engagement</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Tracking engagement across all 19 Framework videos</p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/20">
                                19 Videos Live
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                <div className="text-2xl font-black text-white">
                                    {stats?.totalUsers ? (Math.round(((stats.totalVideosWatched || 0) / (stats.totalUsers * 19)) * 100)) : 0}%
                                </div>
                                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-1">
                                    Curriculum Progress
                                </div>
                                <div className="text-[11px] text-gray-500 mt-0.5">Average cohort completion</div>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                <div className="text-2xl font-black text-emerald-400">
                                    {stats?.usersCompletedAllVideos ?? 0}
                                </div>
                                <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-1">
                                    100% Watched
                                </div>
                                <div className="text-[11px] text-gray-500 mt-0.5">Finished all 19 videos</div>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/[0.08] to-blue-500/[0.08] border border-purple-500/20">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0">
                                    ✓
                                </div>
                                <div className="text-xs text-gray-300">
                                    <strong className="text-white font-semibold">90% Watch Threshold Enabled:</strong> Video completion badges sync instantly with local optimistic updates.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs text-gray-400">
                        <span>External Analytics:</span>
                        <a
                            href={`https://analytics.google.com/analytics/web/#/p${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.replace('G-', '')}/reports/overview`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1.5 transition"
                        >
                            Open GA4 Dashboard →
                        </a>
                    </div>
                </div>
            </div>

            {/* Recent Signups Table */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-white font-bold text-base">Recent Registrations</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Latest students joining the framework</p>
                    </div>
                    <Link
                        href="/dashboard/admin/users"
                        className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition"
                    >
                        View all users →
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-white/[0.08] text-gray-400 font-semibold uppercase tracking-wider">
                                <th className="pb-3 pr-4">Student</th>
                                <th className="pb-3 px-4">Joined</th>
                                <th className="pb-3 px-4">LifeFrame</th>
                                <th className="pb-3 px-4">Videos</th>
                                <th className="pb-3 px-4">Plan</th>
                                <th className="pb-3 pl-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {recentUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">
                                        No users registered yet
                                    </td>
                                </tr>
                            ) : (
                                recentUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3.5 pr-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs flex-shrink-0">
                                                    {(user.full_name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-white truncate text-xs">
                                                        {user.full_name || 'Anonymous User'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 font-mono">
                                                        {user.id.slice(0, 8)}...
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-400">
                                            {new Date(user.created_at).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {user.workbook_completed ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                    ✓ Complete
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                    In Progress
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="text-gray-300 font-medium">
                                                {user.videosWatchedCount} <span className="text-gray-500">/ 19</span>
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="capitalize text-gray-400 text-[11px]">
                                                {user.subscription_status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 pl-4 text-right">
                                            <Link
                                                href={`/dashboard/admin/cohorts?user=${user.id}`}
                                                className="text-purple-400 hover:text-purple-300 font-medium text-[11px] hover:underline"
                                            >
                                                Inspect →
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}