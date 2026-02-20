'use client';

// app/dashboard/admin/analytics/values/page.tsx
// Values analytics - most selected values and priority distribution

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ValueCount {
    name: string;
    count: number;
    avgPriority: number;
    priorityBreakdown: { [key: number]: number };
}

export default function ValuesAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [valuesData, setValuesData] = useState<ValueCount[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [showTop, setShowTop] = useState(20);

    useEffect(() => {
        fetchValuesAnalytics();
    }, []);

    const fetchValuesAnalytics = async () => {
        try {
            setLoading(true);

            const { data: entries, error } = await supabase
                .from('workbook_entries')
                .select('content')
                .eq('category', 'values');

            if (error) throw error;

            setTotalUsers(entries?.length || 0);

            const valueCounts = new Map<string, {
                count: number;
                totalPriority: number;
                priorities: number[];
            }>();

            entries?.forEach(entry => {
                const selectedValues = entry.content?.selected_values || [];
                selectedValues.forEach((value: any) => {
                    const existing = valueCounts.get(value.name) || {
                        count: 0,
                        totalPriority: 0,
                        priorities: [],
                    };

                    valueCounts.set(value.name, {
                        count: existing.count + 1,
                        totalPriority: existing.totalPriority + value.priority,
                        priorities: [...existing.priorities, value.priority],
                    });
                });
            });

            const valuesArray: ValueCount[] = Array.from(valueCounts.entries())
                .map(([name, data]) => {
                    const priorityBreakdown: { [key: number]: number } = {};
                    data.priorities.forEach(p => {
                        priorityBreakdown[p] = (priorityBreakdown[p] || 0) + 1;
                    });

                    return {
                        name,
                        count: data.count,
                        avgPriority: data.totalPriority / data.count,
                        priorityBreakdown,
                    };
                })
                .sort((a, b) => b.count - a.count);

            setValuesData(valuesArray);
        } catch (err) {
            console.error('Values analytics error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-800 rounded w-1/4 mb-4" />
                    <div className="h-64 bg-gray-800 rounded" />
                </div>
            </div>
        );
    }

    const topValues = valuesData.slice(0, showTop);
    const maxCount = topValues[0]?.count || 1;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Values Analytics</h1>
                <p className="text-sm text-gray-500 mt-1">Analysis of {totalUsers} users</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-white mb-1">{valuesData.length}</div>
                    <p className="text-sm text-gray-400">Unique Values</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-white mb-1">{totalUsers}</div>
                    <p className="text-sm text-gray-400">Users Analyzed</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-white mb-1">
                        {totalUsers > 0 ? (valuesData.reduce((sum, v) => sum + v.count, 0) / totalUsers).toFixed(1) : '0'}
                    </div>
                    <p className="text-sm text-gray-400">Avg Per User</p>
                </div>
            </div>

            {/* Top Values */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-semibold">Most Selected Values</h3>
                    <div className="flex gap-2">
                        {[10, 20, 50].map(num => (
                            <button
                                key={num}
                                onClick={() => setShowTop(num)}
                                className={`px-3 py-1 rounded-lg text-xs transition ${showTop === num
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:text-white'
                                    }`}
                            >
                                Top {num}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {topValues.map((value, index) => {
                        const percentage = totalUsers > 0 ? (value.count / totalUsers) * 100 : 0;
                        const barWidth = (value.count / maxCount) * 100;

                        return (
                            <div key={value.name}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span className="text-xs font-bold text-gray-500 w-6 text-right">#{index + 1}</span>
                                        <span className="text-sm text-white font-medium truncate">{value.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-gray-500">Avg: {value.avgPriority.toFixed(1)}</span>
                                        <span className="text-sm text-white font-bold w-12 text-right">{value.count}</span>
                                        <span className="text-xs text-gray-500 w-12 text-right">{percentage.toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
                                        style={{ width: `${barWidth}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Priority Heatmap */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-6">Priority Distribution (Top 10)</h3>
                <div className="space-y-6">
                    {valuesData.slice(0, 10).map((value) => {
                        const priorities = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                        return (
                            <div key={value.name}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-white font-medium">{value.name}</span>
                                    <span className="text-xs text-gray-500">{value.count} selections</span>
                                </div>
                                <div className="grid grid-cols-10 gap-1">
                                    {priorities.map(p => {
                                        const count = value.priorityBreakdown[p] || 0;
                                        const pct = value.count > 0 ? (count / value.count) * 100 : 0;
                                        const opacity = Math.max(0.1, pct / 100);

                                        return (
                                            <div key={p} className="flex flex-col items-center">
                                                <div
                                                    className="w-full h-16 rounded bg-purple-500 relative group cursor-pointer"
                                                    style={{ opacity }}
                                                    title={`Priority ${p}: ${count} users`}
                                                >
                                                    {count > 0 && (
                                                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                                            {count}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-600 mt-1">#{p}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={fetchValuesAnalytics}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>
        </div>
    );
}
