'use client';

// app/dashboard/admin/analytics/demographics/page.tsx
// Demographic & Outcome Intelligence Hub (Cross-Referenced Analytics)

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

// ─── Value Mapping Labels ─────────────────────────────────────────────────────

const VALUE_LABELS: Record<string, string> = {
    // Gender
    male: 'Male',
    female: 'Female',
    non_binary: 'Non-binary',
    other: 'Other',
    prefer_not_to_say: 'Prefer not to say',

    // Age
    under_18: 'Under 18',
    '18_24': '18–24',
    '25_34': '25–34',
    '35_44': '35–44',
    '45_54': '45–54',
    '55_64': '55–64',
    '65_plus': '65+',

    // Occupation
    student: 'Student',
    employed_full_time: 'Working Full-time',
    employed_part_time: 'Working Part-time',
    self_employed: 'Self-employed',
    freelancer: 'Freelancer',
    homemaker: 'Homemaker',
    retired: 'Retired',
    unemployed: 'Job Seeking / Unemployed',

    // Race/Ethnicity
    asian: 'Asian',
    black_african_american: 'Black / African American',
    hispanic_latino: 'Hispanic / Latino',
    white: 'White',
    multiracial: 'Multiracial',
    american_indian_alaska_native: 'Native American / Alaska Native',
    middle_eastern_north_african: 'Middle Eastern / North African',
    native_hawaiian_pacific_islander: 'Pacific Islander',

    // Marital Status
    single: 'Single',
    married: 'Married',
    domestic_partnership: 'In a Relationship',
    divorced: 'Divorced',
    separated: 'Separated',
    widowed: 'Widowed',
};

type SegmentKey = 'all' | 'student' | 'employed_full_time' | 'self_employed' | '18_24' | '25_34' | '35_44';

export default function AdminDemographicsPage() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [workbookEntries, setWorkbookEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSegment, setActiveSegment] = useState<SegmentKey>('all');
    const [activeDemographicTab, setActiveDemographicTab] = useState<'occupation' | 'age' | 'gender' | 'marital'>('occupation');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [profilesRes, entriesRes] = await Promise.all([
                supabase.from('profiles').select('id, full_name, created_at, role, subscription_status, workbook_completed, video_progress, gender, age_range, occupation, race_ethnicity, marital_status'),
                supabase.from('workbook_entries').select('user_id, category, content'),
            ]);

            if (profilesRes.error) throw profilesRes.error;
            if (entriesRes.error) throw entriesRes.error;

            setProfiles(profilesRes.data || []);
            setWorkbookEntries(entriesRes.data || []);
        } catch (err: any) {
            console.error('Failed to load demographic intelligence:', err);
            setError(err.message || 'Failed to load demographic data');
        } finally {
            setLoading(false);
        }
    };

    // Group workbook entries by user_id
    const entriesByUser = useMemo(() => {
        const map: Record<string, any[]> = {};
        workbookEntries.forEach(e => {
            if (!map[e.user_id]) map[e.user_id] = [];
            map[e.user_id].push(e);
        });
        return map;
    }, [workbookEntries]);

    // Filter profiles by selected segment
    const segmentProfiles = useMemo(() => {
        if (activeSegment === 'all') return profiles;
        if (activeSegment === 'student') return profiles.filter(p => p.occupation === 'student');
        if (activeSegment === 'employed_full_time') return profiles.filter(p => p.occupation === 'employed_full_time');
        if (activeSegment === 'self_employed') return profiles.filter(p => p.occupation === 'self_employed');
        if (activeSegment === '18_24') return profiles.filter(p => p.age_range === '18_24');
        if (activeSegment === '25_34') return profiles.filter(p => p.age_range === '25_34');
        if (activeSegment === '35_44') return profiles.filter(p => p.age_range === '35_44');
        return profiles;
    }, [profiles, activeSegment]);

    // Correlated Outcomes for Active Segment
    const segmentMetrics = useMemo(() => {
        const total = segmentProfiles.length;
        if (total === 0) {
            return {
                total: 0,
                completedPct: 0,
                avgVideos: 0,
                avgGoals: 0,
                topValues: [],
                topCategories: [],
            };
        }

        let completedCount = 0;
        let totalVideos = 0;
        let totalGoals = 0;
        const valueCounts: Record<string, { count: number; totalPriority: number }> = {};
        const categoryCounts: Record<string, number> = {};

        segmentProfiles.forEach(p => {
            // LifeFrame completed
            if (p.workbook_completed) completedCount++;

            // Videos
            const watched = Array.isArray(p.video_progress?.watched) ? p.video_progress.watched : [];
            totalVideos += watched.length;

            // Entries for this user
            const userEntries = entriesByUser[p.id] || [];

            // Values
            const valuesEntry = userEntries.find(e => e.category === 'values');
            const vals = Array.isArray(valuesEntry?.content?.selected_values) ? valuesEntry.content.selected_values : [];
            vals.forEach((v: any) => {
                const name = v.name || v;
                if (typeof name === 'string' && name.trim()) {
                    if (!valueCounts[name]) valueCounts[name] = { count: 0, totalPriority: 0 };
                    valueCounts[name].count++;
                    valueCounts[name].totalPriority += (typeof v.priority === 'number' ? v.priority : 3);
                }
            });

            // Categories
            const catEntry = userEntries.find(e => e.category === 'life_categories');
            const cats = Array.isArray(catEntry?.content?.categories) ? catEntry.content.categories : [];
            cats.forEach((c: any) => {
                const name = c.name || c;
                if (typeof name === 'string' && name.trim()) {
                    categoryCounts[name] = (categoryCounts[name] || 0) + 1;
                }
            });

            // Roadmap
            const rmEntry = userEntries.find(e => e.category === 'roadmap');
            const goals = Array.isArray(rmEntry?.content?.goals) ? rmEntry.content.goals : [];
            totalGoals += goals.length;
        });

        // Top 5 Values for this segment
        const topValues = Object.entries(valueCounts)
            .map(([name, data]) => ({
                name,
                count: data.count,
                pct: Math.round((data.count / total) * 100),
                avgPriority: (data.totalPriority / data.count).toFixed(1),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        // Top Categories for this segment
        const topCategories = Object.entries(categoryCounts)
            .map(([name, count]) => ({
                name,
                count,
                pct: Math.round((count / total) * 100),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        return {
            total,
            completedPct: Math.round((completedCount / total) * 100),
            avgVideos: (totalVideos / total).toFixed(1),
            avgGoals: (totalGoals / total).toFixed(1),
            topValues,
            topCategories,
        };
    }, [segmentProfiles, entriesByUser]);

    // Breakdown distribution helper
    const getDistribution = (field: 'occupation' | 'age_range' | 'gender' | 'marital_status') => {
        const counts: Record<string, number> = {};
        profiles.forEach(p => {
            const val = p[field] || 'not_provided';
            counts[val] = (counts[val] || 0) + 1;
        });

        const total = profiles.length || 1;
        return Object.entries(counts)
            .map(([val, count]) => ({
                value: val,
                label: VALUE_LABELS[val] || (val === 'not_provided' ? 'Not Provided' : val),
                count,
                pct: Math.round((count / total) * 100),
            }))
            .sort((a, b) => b.count - a.count);
    };

    // CSV Export
    const handleExportCSV = () => {
        const headers = ['Segment', 'Sample Size', 'LifeFrame Completion %', 'Avg Videos Watched (of 19)', 'Avg Goals Set', 'Top Core Values'];
        const topValStr = segmentMetrics.topValues.map(v => `${v.name} (${v.pct}%)`).join('; ');
        const row = [
            `"${activeSegment}"`,
            segmentMetrics.total,
            `${segmentMetrics.completedPct}%`,
            segmentMetrics.avgVideos,
            segmentMetrics.avgGoals,
            `"${topValStr}"`,
        ];

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), row.join(',')].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `demographic-intelligence-${activeSegment}-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-10 bg-white/5 rounded-2xl animate-pulse w-1/3" />
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-28 bg-white/[0.02] border border-white/[0.06] rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/30 text-center max-w-md mx-auto">
                <p className="text-red-400 text-sm">{error}</p>
                <button onClick={loadData} className="mt-4 px-4 py-2 rounded-xl bg-red-500/20 text-red-300 text-xs font-bold">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* ─── Header ──────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold">
                            📊
                        </span>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                Demographic & Outcome Intelligence
                            </h1>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Cross-referencing student onboarding profiles with actual LifeFrame completion, values, and video depth
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-purple-600/25 transition cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Segment Report (CSV)
                    </button>
                </div>
            </div>

            {/* ─── Segment Filter Bar ──────────────────────────────────────── */}
            <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Filter Intelligence by Demographic Segment:
                    </span>
                    <span className="text-xs text-purple-400 font-semibold">
                        Showing {segmentMetrics.total} of {profiles.length} learners
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                    {[
                        { key: 'all', label: 'All Learners' },
                        { key: 'student', label: 'Students' },
                        { key: 'employed_full_time', label: 'Working Full-Time' },
                        { key: 'self_employed', label: 'Self-Employed' },
                        { key: '18_24', label: 'Gen Z (18–24)' },
                        { key: '25_34', label: 'Millennials (25–34)' },
                        { key: '35_44', label: 'Mid-Career (35–44)' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveSegment(tab.key as SegmentKey)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                activeSegment === tab.key
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                                    : 'bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.06]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Correlated Outcome KPIs for Active Segment ──────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Segment Size</p>
                    <p className="text-3xl font-black text-white mt-1">{segmentMetrics.total}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {Math.round((segmentMetrics.total / (profiles.length || 1)) * 100)}% of total user base
                    </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">LifeFrame Completion</p>
                    <p className="text-3xl font-black text-emerald-400 mt-1">{segmentMetrics.completedPct}%</p>
                    <p className="text-xs text-gray-500 mt-0.5">Finished Core 3 Worksheets</p>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Curriculum Video Depth</p>
                    <p className="text-3xl font-black text-cyan-400 mt-1">{segmentMetrics.avgVideos}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Videos completed per learner (of 19)</p>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Avg Goals Active</p>
                    <p className="text-3xl font-black text-purple-400 mt-1">{segmentMetrics.avgGoals}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Committed Roadmap goals</p>
                </div>
            </div>

            {/* ─── Deeper Associative Insights: Values & Categories ────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Values for Selected Segment */}
                <div className="p-6 sm:p-7 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-white">
                                Top Core Values for this Segment
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Values most frequently selected by users in this demographic
                            </p>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 font-bold border border-purple-500/30">
                            Association
                        </span>
                    </div>

                    {segmentMetrics.topValues.length === 0 ? (
                        <p className="text-xs text-gray-500 italic py-8 text-center">
                            No values recorded for this segment yet
                        </p>
                    ) : (
                        <div className="space-y-3 pt-2">
                            {segmentMetrics.topValues.map((v, i) => (
                                <div key={v.name} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px] flex items-center justify-center">
                                                #{i + 1}
                                            </span>
                                            <span className="font-semibold text-white">{v.name}</span>
                                        </div>
                                        <span className="text-gray-400 font-medium">
                                            {v.count} users <span className="text-gray-500">({v.pct}%)</span>
                                        </span>
                                    </div>
                                    <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700"
                                            style={{ width: `${v.pct}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Primary Life Categories for Selected Segment */}
                <div className="p-6 sm:p-7 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-white">
                                Life Categories Focus
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Which life areas this demographic prioritizes in their LifeFrame
                            </p>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30">
                            Priorities
                        </span>
                    </div>

                    {segmentMetrics.topCategories.length === 0 ? (
                        <p className="text-xs text-gray-500 italic py-8 text-center">
                            No life categories mapped for this segment yet
                        </p>
                    ) : (
                        <div className="space-y-3 pt-2">
                            {segmentMetrics.topCategories.map((c) => (
                                <div key={c.name} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-white">{c.name}</span>
                                        <span className="text-gray-400 font-medium">
                                            {c.count} users <span className="text-gray-500">({c.pct}%)</span>
                                        </span>
                                    </div>
                                    <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-700"
                                            style={{ width: `${c.pct}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Complete Demographic Breakdown Matrix ───────────────────── */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                    <div>
                        <h3 className="text-base font-bold text-white">Full Cohort Demographic Distribution</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Platform-wide distribution across onboarding questions</p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-2xl">
                        {[
                            { key: 'occupation', label: 'Occupation' },
                            { key: 'age', label: 'Age Group' },
                            { key: 'gender', label: 'Gender' },
                            { key: 'marital', label: 'Relationship' },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveDemographicTab(tab.key as any)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                    activeDemographicTab === tab.key
                                        ? 'bg-purple-600 text-white'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    {getDistribution(
                        activeDemographicTab === 'occupation' ? 'occupation'
                        : activeDemographicTab === 'age' ? 'age_range'
                        : activeDemographicTab === 'gender' ? 'gender'
                        : 'marital_status'
                    ).map(item => (
                        <div key={item.value} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-gray-300">{item.label}</span>
                                <span className="text-gray-400 font-medium">
                                    {item.count} users <span className="text-purple-400 font-bold">({item.pct}%)</span>
                                </span>
                            </div>
                            <div className="h-2.5 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.04]">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700"
                                    style={{ width: `${item.pct}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
