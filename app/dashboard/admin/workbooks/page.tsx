'use client';

// app/dashboard/admin/workbooks/page.tsx
// Workbook completion stats and breakdown

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface WorkbookStats {
    totalUsers: number;
    completedAll: number;
    completionRate: number;
    bySection: {
        values: number;
        interests: number;
        life_categories: number;
        roadmap: number;
    };
    dropOffPoint: string;
}

function ProgressRing({ percentage, color }: { percentage: number; color: string }) {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#1f2937" strokeWidth="8" />
            <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-700"
            />
            <text
                x="50"
                y="50"
                textAnchor="middle"
                dominantBaseline="middle"
                className="rotate-90"
                fill="white"
                fontSize="14"
                fontWeight="bold"
                transform="rotate(90, 50, 50)"
            >
                {percentage}%
            </text>
        </svg>
    );
}

export default function AdminWorkbooksPage() {
    const [stats, setStats] = useState<WorkbookStats | null>(null);
    const [recentCompletions, setRecentCompletions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);

                const [profilesResult, entriesResult] = await Promise.all([
                    supabase.from('profiles').select('id, workbook_completed', { count: 'exact' }),
                    supabase.from('workbook_entries').select('user_id, category, updated_at'),
                ]);

                const profiles = profilesResult.data || [];
                const entries = entriesResult.data || [];
                const totalUsers = profilesResult.count || 0;

                // Count by section
                const valueUsers = new Set(entries.filter(e => e.category === 'values').map(e => e.user_id)).size;
                const interestUsers = new Set(entries.filter(e => e.category === 'interests').map(e => e.user_id)).size;
                const categoryUsers = new Set(entries.filter(e => e.category === 'life_categories').map(e => e.user_id)).size;
                const roadmapUsers = new Set(entries.filter(e => e.category === 'roadmap').map(e => e.user_id)).size;

                const completedAll = profiles.filter(p => p.workbook_completed).length;
                const completionRate = totalUsers > 0 ? Math.round((completedAll / totalUsers) * 100) : 0;

                // Find drop-off point (biggest % drop)
                const sections = [
                    { name: 'Values', count: valueUsers },
                    { name: 'Interests', count: interestUsers },
                    { name: 'Life Categories', count: categoryUsers },
                    { name: 'Roadmap', count: roadmapUsers },
                ];

                let dropOff = 'None';
                let maxDrop = 0;
                for (let i = 1; i < sections.length; i++) {
                    const drop = sections[i - 1].count - sections[i].count;
                    if (drop > maxDrop) {
                        maxDrop = drop;
                        dropOff = `${sections[i - 1].name} → ${sections[i].name}`;
                    }
                }

                setStats({
                    totalUsers,
                    completedAll,
                    completionRate,
                    bySection: {
                        values: valueUsers,
                        interests: interestUsers,
                        life_categories: categoryUsers,
                        roadmap: roadmapUsers,
                    },
                    dropOffPoint: dropOff,
                });

                // Get recent completions
                const recent = entries
                    .filter(e => e.category === 'roadmap')
                    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                    .slice(0, 5);
                setRecentCompletions(recent);

            } catch (err) {
                console.error('Workbook stats error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [supabase]);

    const sections = [
        { key: 'values', label: 'Values', color: '#8b5cf6', description: 'Users who saved their values' },
        { key: 'interests', label: 'Interests', color: '#3b82f6', description: 'Users who saved their interests' },
        { key: 'life_categories', label: 'Life Categories', color: '#10b981', description: 'Users who set life categories' },
        { key: 'roadmap', label: 'Roadmap', color: '#f97316', description: 'Users who created a roadmap' },
    ] as const;

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-gray-800/50 rounded-2xl p-6 animate-pulse h-32" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Workbook Stats</h1>
                <p className="text-sm text-gray-500 mt-1">Track user progress through the workbook</p>
            </div>

            {/* Top stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
                    <div className="text-4xl font-bold text-white mb-1">{stats?.totalUsers ?? 0}</div>
                    <p className="text-sm text-gray-400">Total Users</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
                    <div className="text-4xl font-bold text-green-400 mb-1">{stats?.completedAll ?? 0}</div>
                    <p className="text-sm text-gray-400">Completed All</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
                    <div className="text-4xl font-bold text-purple-400 mb-1">{stats?.completionRate ?? 0}%</div>
                    <p className="text-sm text-gray-400">Completion Rate</p>
                </div>
            </div>

            {/* Funnel Visualization */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-6">Completion Funnel</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {sections.map((section) => {
                        const count = stats?.bySection[section.key] ?? 0;
                        const pct = stats?.totalUsers
                            ? Math.round((count / stats.totalUsers) * 100)
                            : 0;

                        return (
                            <div key={section.key} className="flex flex-col items-center text-center">
                                <ProgressRing percentage={pct} color={section.color} />
                                <p className="text-white font-semibold mt-3">{section.label}</p>
                                <p className="text-2xl font-bold text-white mt-1">{count}</p>
                                <p className="text-xs text-gray-500 mt-1">{section.description}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Drop-off point */}
                {stats?.dropOffPoint && stats.dropOffPoint !== 'None' && (
                    <div className="mt-6 bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-orange-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-sm font-medium">Main drop-off point: {stats.dropOffPoint}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-6">
                            This is where the most users stop. Consider improving this section's UX.
                        </p>
                    </div>
                )}
            </div>

            {/* Section completion bar chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-5">Section Breakdown</h3>
                <div className="space-y-5">
                    {sections.map((section) => {
                        const count = stats?.bySection[section.key] ?? 0;
                        const pct = stats?.totalUsers
                            ? Math.round((count / stats.totalUsers) * 100)
                            : 0;

                        return (
                            <div key={section.key}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-300 font-medium">{section.label}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-white font-bold">{count} users</span>
                                        <span className="text-xs text-gray-500">{pct}%</span>
                                    </div>
                                </div>
                                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${pct}%`, backgroundColor: section.color }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent roadmap completions */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Recent Roadmap Completions</h3>
                {recentCompletions.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No roadmap completions yet</p>
                ) : (
                    <div className="space-y-3">
                        {recentCompletions.map((entry, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-white font-mono">{entry.user_id.slice(0, 12)}...</p>
                                        <p className="text-xs text-gray-500">Roadmap completed</p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {new Date(entry.updated_at).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}