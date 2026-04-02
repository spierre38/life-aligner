'use client';

import { useState, useEffect } from 'react';
import { getPartnerRoadmap, getPartnerValues, getPartnerActivity } from '@/lib/accountability';

interface PartnerProgressModalProps {
    partner: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
    onClose: () => void;
}

export default function PartnerProgressModal({ partner, onClose }: PartnerProgressModalProps) {
    const [roadmap, setRoadmap] = useState<any>(null);
    const [values, setValues] = useState<any>(null);
    const [activity, setActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'roadmap' | 'values' | 'activity'>('roadmap');

    useEffect(() => {
        loadData();
    }, [partner.id]);

    const loadData = async () => {
        setLoading(true);

        const [roadmapRes, valuesRes, activityRes] = await Promise.all([
            getPartnerRoadmap(partner.id),
            getPartnerValues(partner.id),
            getPartnerActivity(partner.id)
        ]);

        setRoadmap(roadmapRes.data);
        setValues(valuesRes.data);
        setActivity(activityRes.data || []);

        setLoading(false);
    };

    const roadmapItems = roadmap?.content?.items || [];
    const selectedValues = values?.content?.selected_values || [];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                                {partner.full_name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{partner.full_name}&apos;s Progress</h2>
                                <p className="text-gray-600">View their journey</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 px-6 flex gap-6 flex-shrink-0">
                    {[
                        { value: 'roadmap', label: 'Goals', icon: '🎯' },
                        { value: 'values', label: 'Values', icon: '💎' },
                        { value: 'activity', label: 'Activity', icon: '📊' }
                    ].map(({ value, label, icon }) => (
                        <button
                            key={value}
                            onClick={() => setTab(value as any)}
                            className={`px-4 py-3 font-semibold border-b-2 transition-colors ${tab === value
                                    ? 'text-purple-600 border-purple-600'
                                    : 'text-gray-500 border-transparent hover:text-gray-700'
                                }`}
                        >
                            <span className="mr-2">{icon}</span>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading...</p>
                        </div>
                    ) : tab === 'roadmap' ? (
                        roadmapItems.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">🌱</div>
                                <p className="text-gray-600">No goals yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {roadmapItems.map((item: any, i: number) => (
                                    <div key={i} className="bg-gray-50 rounded-xl p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                                    {item.goal || item.behavior_change}
                                                </h3>
                                                {item.category && (
                                                    <p className="text-sm text-gray-600 mb-3">
                                                        <strong>Category:</strong> {item.category}
                                                    </p>
                                                )}
                                                {item.activities && item.activities.length > 0 && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-700 mb-2">Activities:</p>
                                                        <ul className="space-y-1">
                                                            {item.activities.map((activity: any, j: number) => (
                                                                <li key={j} className="text-sm text-gray-700 flex items-start gap-2">
                                                                    <span className="text-green-500 mt-0.5">✓</span>
                                                                    {typeof activity === 'string' ? activity : activity.text || 'Untitled'}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : tab === 'values' ? (
                        selectedValues.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">💎</div>
                                <p className="text-gray-600">No values selected yet</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {selectedValues.map((value: any, i: number) => (
                                    <div key={i} className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-gray-900">{value.name}</h3>
                                            <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-bold">
                                                #{value.priority}
                                            </span>
                                        </div>
                                        {value.description && (
                                            <p className="text-sm text-gray-600">{value.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        activity.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📊</div>
                                <p className="text-gray-600">No recent activity</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activity.map((item: any, i: number) => (
                                    <div key={i} className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl">
                                                {item.activity_type === 'goal_completed' ? '🎯' :
                                                    item.activity_type === 'milestone_posted' ? '🎉' :
                                                        item.activity_type === 'roadmap_updated' ? '📝' : '✨'}
                                            </span>
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {item.activity_type.replace('_', ' ')}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
