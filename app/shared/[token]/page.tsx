'use client';

import { useState, useEffect } from 'react';
import { getSharedRoadmap } from '@/lib/social';
import { useParams } from 'next/navigation';

export default function SharedRoadmapPage() {
    const params = useParams();
    const token = params?.token as string;

    const [roadmap, setRoadmap] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (token) {
            loadRoadmap();
        }
    }, [token]);

    const loadRoadmap = async () => {
        setLoading(true);
        const { data, error } = await getSharedRoadmap(token);

        if (error || !data) {
            setError(true);
        } else {
            setRoadmap(data);
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading roadmap...</p>
                </div>
            </div>
        );
    }

    if (error || !roadmap) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md text-center">
                    <div className="text-6xl mb-6">🔍</div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Roadmap Not Found</h1>
                    <p className="text-gray-600 mb-8">
                        This roadmap link may have been removed or doesn&apos;t exist.
                    </p>
                    <a
                        href="/"
                        className="inline-block px-8 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                    >
                        Go to LifeAligner
                    </a>
                </div>
            </div>
        );
    }

    const roadmapData = roadmap.roadmap_data || {};
    const items = roadmapData.items || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                        <span className="font-semibold">Shared Roadmap</span>
                    </div>
                    <h1 className="text-5xl font-bold mb-4">
                        {roadmap.user_name}&apos;s Journey
                    </h1>
                    <p className="text-xl text-white/90 mb-8">
                        Explore their goals, values, and path to contentment
                    </p>
                    <div className="flex items-center justify-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{roadmap.views_count} views</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Roadmap Content */}
            <div className="max-w-4xl mx-auto px-4 py-12">
                {items.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <div className="text-6xl mb-4">🌱</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Journey Just Beginning</h3>
                        <p className="text-gray-600">
                            {roadmap.user_name} is still building their roadmap
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {items.map((item: any, index: number) => (
                            <div key={index} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
                                {/* Goal Header */}
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-2xl font-bold text-gray-900">{item.goal || item.behavior_change}</h3>
                                            {item.type && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.type === 'goal'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {item.type === 'goal' ? 'Goal' : 'Behavior Change'}
                                                </span>
                                            )}
                                        </div>
                                        {item.category && (
                                            <p className="text-gray-600">
                                                <span className="font-semibold">Life Category:</span> {item.category}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Connected Values */}
                                {item.connected_values && item.connected_values.length > 0 && (
                                    <div className="mb-6">
                                        <p className="text-sm font-semibold text-gray-700 mb-3">Connected Values:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {item.connected_values.map((value: string, i: number) => (
                                                <span
                                                    key={i}
                                                    className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-200"
                                                >
                                                    {value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Activities */}
                                {item.activities && item.activities.length > 0 && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-3">Action Steps:</p>
                                        <ul className="space-y-2">
                                            {item.activities.map((activity: string, i: number) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="text-gray-700">{activity}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* CTA */}
                <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-center text-white">
                    <h3 className="text-3xl font-bold mb-4">Create Your Own Roadmap</h3>
                    <p className="text-xl text-white/90 mb-8">
                        Start your journey to contentment with LifeAligner
                    </p>
                    <a
                        href="/signup"
                        className="inline-block px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:shadow-xl transition-all"
                    >
                        Get Started Free
                    </a>
                </div>
            </div>
        </div>
    );
}
