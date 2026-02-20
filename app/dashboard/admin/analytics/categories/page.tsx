'use client';

// app/dashboard/admin/analytics/categories/page.tsx
// Life categories analytics

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface CategoryCount {
    name: string;
    count: number;
    percentage: number;
}

interface PurposeElement {
    name: string;
    count: number;
}

export default function CategoriesAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [categoriesData, setCategoriesData] = useState<CategoryCount[]>([]);
    const [purposeData, setPurposeData] = useState<PurposeElement[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [avgCategories, setAvgCategories] = useState(0);

    useEffect(() => {
        fetchCategoriesAnalytics();
    }, []);

    const fetchCategoriesAnalytics = async () => {
        try {
            setLoading(true);

            const { data: entries, error } = await supabase
                .from('workbook_entries')
                .select('content')
                .eq('category', 'life_categories');

            if (error) throw error;

            setTotalUsers(entries?.length || 0);

            // Count categories
            const categoryCounts = new Map<string, number>();
            const purposeCounts = new Map<string, number>();
            let totalCategoryCount = 0;

            entries?.forEach(entry => {
                const categories = entry.content?.categories || [];
                const purposes = entry.content?.purpose_elements || [];

                totalCategoryCount += categories.length;

                categories.forEach((cat: any) => {
                    const name = cat.name || 'Unnamed';
                    categoryCounts.set(name, (categoryCounts.get(name) || 0) + 1);
                });

                purposes.forEach((purpose: any) => {
                    if (purpose.name && purpose.name.trim()) {
                        purposeCounts.set(purpose.name, (purposeCounts.get(purpose.name) || 0) + 1);
                    }
                });
            });

            setAvgCategories(totalUsers > 0 ? totalCategoryCount / totalUsers : 0);

            // Convert to sorted arrays
            const categoriesArray: CategoryCount[] = Array.from(categoryCounts.entries())
                .map(([name, count]) => ({
                    name,
                    count,
                    percentage: totalUsers > 0 ? (count / totalUsers) * 100 : 0,
                }))
                .sort((a, b) => b.count - a.count);

            const purposeArray: PurposeElement[] = Array.from(purposeCounts.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);

            setCategoriesData(categoriesArray);
            setPurposeData(purposeArray);
        } catch (err) {
            console.error('Categories analytics error:', err);
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

    const maxCount = categoriesData[0]?.count || 1;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Life Categories Analytics</h1>
                <p className="text-sm text-gray-500 mt-1">Analysis of {totalUsers} users</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-white mb-1">{categoriesData.length}</div>
                    <p className="text-sm text-gray-400">Unique Categories</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-white mb-1">{avgCategories.toFixed(1)}</div>
                    <p className="text-sm text-gray-400">Avg Per User</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-white mb-1">{purposeData.length}</div>
                    <p className="text-sm text-gray-400">Purpose Elements</p>
                </div>
            </div>

            {/* Top Categories */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-6">Most Popular Life Categories</h3>
                <div className="space-y-4">
                    {categoriesData.slice(0, 20).map((cat, index) => {
                        const barWidth = (cat.count / maxCount) * 100;

                        return (
                            <div key={cat.name}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-gray-500 w-6 text-right">#{index + 1}</span>
                                        <span className="text-sm text-white font-medium">{cat.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-white font-bold">{cat.count}</span>
                                        <span className="text-xs text-gray-500 w-12 text-right">{cat.percentage.toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-500 to-teal-500 rounded-full transition-all duration-700"
                                        style={{ width: `${barWidth}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Purpose Elements */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-6">Purpose Elements</h3>
                {purposeData.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No purpose elements recorded yet</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {purposeData.map((purpose, index) => (
                            <div
                                key={purpose.name}
                                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-purple-500 transition"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <span className="text-sm font-medium text-white">{purpose.name}</span>
                                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                                        {purpose.count}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">Selected by {purpose.count} users</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-center">
                <button
                    onClick={fetchCategoriesAnalytics}
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
