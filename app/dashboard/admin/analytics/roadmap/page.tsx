'use client';

// app/dashboard/admin/analytics/roadmap/page.tsx
// Roadmap analytics - goals by category, activity patterns

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface GoalByCategory {
    category: string;
    count: number;
    percentage: number;
}

interface GoalType {
    type: string;
    count: number;
}

interface ConnectedValue {
    value: string;
    count: number;
}

export default function RoadmapAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [categoriesData, setCategoriesData] = useState<GoalByCategory[]>([]);
    const [typesData, setTypesData] = useState<GoalType[]>([]);
    const [connectedValues, setConnectedValues] = useState<ConnectedValue[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalGoals, setTotalGoals] = useState(0);
    const [avgGoalsPerUser, setAvgGoalsPerUser] = useState(0);
    const [avgActivitiesPerGoal, setAvgActivitiesPerGoal] = useState(0);

    useEffect(() => {
        fetchRoadmapAnalytics();
    }, []);

    const fetchRoadmapAnalytics = async () => {
        try {
            setLoading(true);

            const { data: entries, error } = await supabase
                .from('workbook_entries')
                .select('content')
                .eq('category', 'roadmap');

            if (error) throw error;

            setTotalUsers(entries?.length || 0);

            const categoryCounts = new Map<string, number>();
            const typeCounts = new Map<string, number>();
            const valueCounts = new Map<string, number>();
            let goalsCount = 0;
            let activitiesCount = 0;

            entries?.forEach(entry => {
                const items = entry.content?.items || [];
                goalsCount += items.length;

                items.forEach((item: any) => {
                    // Count by category
                    const category = item.category || 'Uncategorized';
                    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);

                    // Count by type
                    const type = item.type || 'goal';
                    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);

                    // Count activities
                    const activities = item.activities || [];
                    activitiesCount += activities.length;

                    // Count connected values
                    const values = item.connected_values || [];
                    values.forEach((value: string) => {
                        if (value && value.trim()) {
                            valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
                        }
                    });
                });
            });

            setTotalGoals(goalsCount);
            setAvgGoalsPerUser(totalUsers > 0 ? goalsCount / totalUsers : 0);
            setAvgActivitiesPerGoal(goalsCount > 0 ? activitiesCount / goalsCount : 0);

            // Convert to sorted arrays
            const categoriesArray: GoalByCategory[] = Array.from(categoryCounts.entries())
                .map(([category, count]) => ({
                    category,
                    count,
                    percentage: goalsCount > 0 ? (count / goalsCount) * 100 : 0,
                }))
                .sort((a, b) => b.count - a.count);

            const typesArray: GoalType[] = Array.from(typeCounts.entries())
                .map(([type, count]) => ({ type, count }))
                .sort((a, b) => b.count - a.count);

            const valuesArray: ConnectedValue[] = Array.from(valueCounts.entries())
                .map(([value, count]) => ({ value, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 15);

            setCategoriesData(categoriesArray);
            setTypesData(typesArray);
            setConnectedValues(valuesArray);
        } catch (err) {
            console.error('Roadmap analytics error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-gray-800 rounded w-1/4" />
                <div className="h-64 bg-gray-800 rounded" />
            </div>
        );
    }

    const maxCategoryCount = categoriesData[0]?.count || 1;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Roadmap Analytics</h1>
                <p className="text-sm text-gray-500 mt-1">Analysis of {totalUsers} users</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-white mb-1">{totalGoals}</div>
                    <p className="text-sm text-gray-400">Total Goals</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-white mb-1">{avgGoalsPerUser.toFixed(1)}</div>
                    <p className="text-sm text-gray-400">Avg Goals/User</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-white mb-1">{avgActivitiesPerGoal.toFixed(1)}</div>
                    <p className="text-sm text-gray-400">Avg Activities/Goal</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-white mb-1">{categoriesData.length}</div>
                    <p className="text-sm text-gray-400">Unique Categories</p>
                </div>
            </div>

            {/* Goals by Category */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-6">Goals by Life Category</h3>
                {categoriesData.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No goals categorized yet</p>
                ) : (
                    <div className="space-y-4">
                        {categoriesData.map((cat, index) => {
                            const barWidth = (cat.count / maxCategoryCount) * 100;

                            return (
                                <div key={cat.category}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-gray-500 w-6 text-right">#{index + 1}</span>
                                            <span className="text-sm text-white font-medium">{cat.category}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-white font-bold">{cat.count}</span>
                                            <span className="text-xs text-gray-500 w-12 text-right">{cat.percentage.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all duration-700"
                                            style={{ width: `${barWidth}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Goal Types */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-6">Goal vs Behavior Change</h3>
                <div className="grid grid-cols-2 gap-4">
                    {typesData.map(typeData => {
                        const percentage = totalGoals > 0 ? (typeData.count / totalGoals) * 100 : 0;
                        const isGoal = typeData.type === 'goal';

                        return (
                            <div
                                key={typeData.type}
                                className={`rounded-xl p-6 border-2 ${isGoal
                                        ? 'bg-orange-500/10 border-orange-500/30'
                                        : 'bg-purple-500/10 border-purple-500/30'
                                    }`}
                            >
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-white mb-2">{typeData.count}</div>
                                    <p className="text-sm text-gray-300 capitalize mb-1">{typeData.type}s</p>
                                    <p className="text-xs text-gray-500">{percentage.toFixed(1)}% of total</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Connected Values */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-6">Most Connected Values</h3>
                {connectedValues.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No connected values yet</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {connectedValues.map(value => (
                            <div
                                key={value.value}
                                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-orange-500 transition text-center"
                            >
                                <div className="text-2xl font-bold text-white mb-1">{value.count}</div>
                                <p className="text-xs text-gray-300">{value.value}</p>
                            </div>
                        ))}
                    </div>
                )}
                <p className="text-xs text-gray-600 mt-4 text-center">
                    Values users connect to their goals most often
                </p>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={fetchRoadmapAnalytics}
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