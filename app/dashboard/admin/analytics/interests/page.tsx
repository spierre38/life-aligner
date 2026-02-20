'use client';

// app/dashboard/admin/analytics/interests/page.tsx
// Interests analytics

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface InterestCount {
    name: string;
    count: number;
    type: 'existing' | 'exploring';
}

export default function InterestsAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [existingInterests, setExistingInterests] = useState<InterestCount[]>([]);
    const [exploringInterests, setExploringInterests] = useState<InterestCount[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [avgExisting, setAvgExisting] = useState(0);
    const [avgExploring, setAvgExploring] = useState(0);

    useEffect(() => {
        fetchInterestsAnalytics();
    }, []);

    const fetchInterestsAnalytics = async () => {
        try {
            setLoading(true);

            const { data: entries, error } = await supabase
                .from('workbook_entries')
                .select('content')
                .eq('category', 'interests');

            if (error) throw error;

            setTotalUsers(entries?.length || 0);

            const existingCounts = new Map<string, number>();
            const exploringCounts = new Map<string, number>();
            let totalExisting = 0;
            let totalExploring = 0;

            entries?.forEach(entry => {
                const existing = entry.content?.existing || [];
                const exploring = entry.content?.exploring || [];

                totalExisting += existing.length;
                totalExploring += exploring.length;

                existing.forEach((interest: string) => {
                    if (interest && interest.trim()) {
                        existingCounts.set(interest, (existingCounts.get(interest) || 0) + 1);
                    }
                });

                exploring.forEach((interest: string) => {
                    if (interest && interest.trim()) {
                        exploringCounts.set(interest, (exploringCounts.get(interest) || 0) + 1);
                    }
                });
            });

            setAvgExisting(totalUsers > 0 ? totalExisting / totalUsers : 0);
            setAvgExploring(totalUsers > 0 ? totalExploring / totalUsers : 0);

            const existingArray: InterestCount[] = Array.from(existingCounts.entries())
                .map(([name, count]) => ({ name, count, type: 'existing' as const }))
                .sort((a, b) => b.count - a.count);

            const exploringArray: InterestCount[] = Array.from(exploringCounts.entries())
                .map(([name, count]) => ({ name, count, type: 'exploring' as const }))
                .sort((a, b) => b.count - a.count);

            setExistingInterests(existingArray);
            setExploringInterests(exploringArray);
        } catch (err) {
            console.error('Interests analytics error:', err);
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

    const renderInterestsList = (interests: InterestCount[], color: string, title: string) => {
        const maxCount = interests[0]?.count || 1;

        return (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-6">{title}</h3>
                {interests.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No {title.toLowerCase()} recorded yet</p>
                ) : (
                    <div className="space-y-4">
                        {interests.slice(0, 20).map((interest, index) => {
                            const percentage = totalUsers > 0 ? (interest.count / totalUsers) * 100 : 0;
                            const barWidth = (interest.count / maxCount) * 100;

                            return (
                                <div key={interest.name}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-gray-500 w-6 text-right">#{index + 1}</span>
                                            <span className="text-sm text-white font-medium">{interest.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-white font-bold">{interest.count}</span>
                                            <span className="text-xs text-gray-500 w-12 text-right">{percentage.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${color} rounded-full transition-all duration-700`}
                                            style={{ width: `${barWidth}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Interests Analytics</h1>
                <p className="text-sm text-gray-500 mt-1">Analysis of {totalUsers} users</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-white mb-1">{existingInterests.length}</div>
                    <p className="text-sm text-gray-400">Existing Interests</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-white mb-1">{avgExisting.toFixed(1)}</div>
                    <p className="text-sm text-gray-400">Avg Existing/User</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-white mb-1">{exploringInterests.length}</div>
                    <p className="text-sm text-gray-400">Exploring Interests</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-white mb-1">{avgExploring.toFixed(1)}</div>
                    <p className="text-sm text-gray-400">Avg Exploring/User</p>
                </div>
            </div>

            {/* Existing Interests */}
            {renderInterestsList(existingInterests, 'bg-gradient-to-r from-blue-500 to-cyan-500', 'Top Existing Interests')}

            {/* Exploring Interests */}
            {renderInterestsList(exploringInterests, 'bg-gradient-to-r from-orange-500 to-pink-500', 'Top Exploring Interests')}

            {/* Overlap Analysis */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-6">Interests That Appear in Both Lists</h3>
                {(() => {
                    const existingNames = new Set(existingInterests.map(i => i.name.toLowerCase()));
                    const overlapping = exploringInterests
                        .filter(i => existingNames.has(i.name.toLowerCase()))
                        .slice(0, 10);

                    if (overlapping.length === 0) {
                        return <p className="text-gray-500 text-center py-4">No overlapping interests found</p>;
                    }

                    return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {overlapping.map(interest => (
                                <div
                                    key={interest.name}
                                    className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-3 text-center"
                                >
                                    <p className="text-sm font-medium text-white">{interest.name}</p>
                                    <p className="text-xs text-gray-400 mt-1">Common interest</p>
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </div>

            <div className="flex justify-center">
                <button
                    onClick={fetchInterestsAnalytics}
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
