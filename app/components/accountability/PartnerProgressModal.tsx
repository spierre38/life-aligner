'use client';

import { useState, useEffect } from 'react';
import { getPartnerRoadmap, getPartnerValues, getPartnerActivity } from '@/lib/accountability';

// ── SVG Icon Components ─────────────────────────────────────────────────────
const TargetIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
);

const DiamondIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h12l4 6-10 13L2 9z" /><path d="M2 9h20" /><path d="M10 3l-2 6 4 13 4-13-2-6" />
    </svg>
);

const ChartIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="M7 16V8" /><path d="M11 16V11" /><path d="M15 16V6" /><path d="M19 16V13" />
    </svg>
);

const SeedlingIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V10" /><path d="M6 14c0-4 6-8 6-8s6 4 6 8" /><path d="M7 6c2-2 5-3 5-3s3 1 5 3" />
    </svg>
);

const PartyIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const PencilIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
    </svg>
);

const SparkleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
);

const CheckCircleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const CloseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// Helper: get activity icon by type
const getActivityIcon = (activityType: string) => {
    switch (activityType) {
        case 'goal_completed': return <TargetIcon className="w-6 h-6 text-red-500" />;
        case 'milestone_posted': return <PartyIcon className="w-6 h-6 text-yellow-500" />;
        case 'roadmap_updated': return <PencilIcon className="w-6 h-6 text-blue-500" />;
        default: return <SparkleIcon className="w-6 h-6 text-purple-500" />;
    }
};

// Tab icon configs
const TAB_CONFIG = [
    { value: 'roadmap' as const, label: 'Goals', Icon: TargetIcon, color: 'text-red-500' },
    { value: 'values' as const, label: 'Values', Icon: DiamondIcon, color: 'text-blue-500' },
    { value: 'activity' as const, label: 'Activity', Icon: ChartIcon, color: 'text-emerald-500' },
];

// ── Component ────────────────────────────────────────────────────────────────

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
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 px-6 flex gap-6 flex-shrink-0">
                    {TAB_CONFIG.map(({ value, label, Icon, color }) => (
                        <button
                            key={value}
                            onClick={() => setTab(value)}
                            className={`px-4 py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 ${tab === value
                                    ? 'text-purple-600 border-purple-600'
                                    : 'text-gray-500 border-transparent hover:text-gray-700'
                                }`}
                        >
                            <Icon className={`w-4 h-4 ${tab === value ? 'text-purple-600' : color}`} />
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
                                <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <SeedlingIcon className="w-8 h-8 text-green-500" />
                                </div>
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
                                                                    <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
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
                                <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                    <DiamondIcon className="w-8 h-8 text-blue-500" />
                                </div>
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
                                <div className="mx-auto mb-4 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                                    <ChartIcon className="w-8 h-8 text-purple-500" />
                                </div>
                                <p className="text-gray-600">No recent activity</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activity.map((item: any, i: number) => (
                                    <div key={i} className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            {getActivityIcon(item.activity_type)}
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
