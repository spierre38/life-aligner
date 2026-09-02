'use client';

// app/dashboard/admin/cohorts/page.tsx
// Instructor Cohort Progress Matrix & Academic Student Tracker

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { VIDEO_CATALOG } from '@/lib/videos';
import StudentDossierModal from '@/app/dashboard/admin/components/StudentDossierModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
    id: string;
    fullName: string;
    createdAt: string;
    lastActive: string;
    subscriptionStatus: string;
    // Video Progress
    videosWatched: string[];
    videoCount: number;
    videoPct: number;
    // Milestone Completion
    valuesDone: boolean;
    valuesCount: number;
    valuesList: string[];
    interestsDone: boolean;
    interestsCount: number;
    categoriesDone: boolean;
    categoriesCount: number;
    categoriesList: string[];
    roadmapDone: boolean;
    goalCount: number;
    goalTitles: string[];
    todoCount: number;
    completedTodoCount: number;
    // Computed Progress
    lifeframeComplete: boolean;
    overallProgressPct: number;
    status: 'on_track' | 'in_progress' | 'stuck';
}

type FilterStatus = 'all' | 'on_track' | 'in_progress' | 'completed' | 'stuck';
type SortField = 'progress' | 'name' | 'joined' | 'videos';

// ─── Main Content Component ───────────────────────────────────────────────────

function CohortDashboardContent() {
    const searchParams = useSearchParams();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [sortField, setSortField] = useState<SortField>('progress');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [nudgeStudent, setNudgeStudent] = useState<Student | null>(null);
    const [copiedToast, setCopiedToast] = useState(false);

    // Fetch and aggregate cohort data
    const loadCohortData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [profilesRes, entriesRes] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('id, full_name, created_at, subscription_status, workbook_completed, video_progress')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('workbook_entries')
                    .select('user_id, category, content, updated_at'),
            ]);

            if (profilesRes.error) throw profilesRes.error;
            if (entriesRes.error) throw entriesRes.error;

            const profiles = profilesRes.data || [];
            const entries = entriesRes.data || [];

            // Group entries by user_id
            const entriesByUser: Record<string, typeof entries> = {};
            entries.forEach(e => {
                if (!entriesByUser[e.user_id]) entriesByUser[e.user_id] = [];
                entriesByUser[e.user_id].push(e);
            });

            const aggregated: Student[] = profiles.map(p => {
                const userEntries = entriesByUser[p.id] || [];

                // Video Progress
                const vidProg = p.video_progress as { watched?: string[] } | null;
                const videosWatched = Array.isArray(vidProg?.watched) ? vidProg.watched : [];
                const videoCount = videosWatched.length;
                const videoPct = Math.min(100, Math.round((videoCount / 19) * 100));

                // Values entry
                const valuesEntry = userEntries.find(e => e.category === 'values');
                const valContent = valuesEntry?.content as any;
                const selectedVals = Array.isArray(valContent?.selected_values) ? valContent.selected_values : [];
                const valuesDone = selectedVals.length >= 3;
                const valuesList = selectedVals.map((v: any) => (typeof v === 'string' ? v : v?.name || '')).filter(Boolean);

                // Interests entry
                const interestsEntry = userEntries.find(e => e.category === 'interests');
                const intContent = interestsEntry?.content as any;
                const existing = Array.isArray(intContent?.existing) ? intContent.existing : [];
                const exploring = Array.isArray(intContent?.exploring) ? intContent.exploring : [];
                const interestsCount = existing.length + exploring.length;
                const interestsDone = interestsCount >= 3;

                // Life Categories entry
                const catEntry = userEntries.find(e => e.category === 'life_categories');
                const catContent = catEntry?.content as any;
                const cats = Array.isArray(catContent?.categories) ? catContent.categories : [];
                const categoriesCount = cats.length;
                const categoriesDone = categoriesCount >= 3;
                const categoriesList = cats.map((c: any) => (typeof c === 'string' ? c : c?.name || '')).filter(Boolean);

                // Roadmap entry
                const rmEntry = userEntries.find(e => e.category === 'roadmap');
                const rmContent = rmEntry?.content as any;
                const goals = Array.isArray(rmContent?.goals) ? rmContent.goals : [];
                const activities = Array.isArray(rmContent?.activities) ? rmContent.activities : [];
                const completedTodos = activities.filter((a: any) => a?.completed === true);
                const roadmapDone = goals.length > 0;

                // LifeFrame Completion
                const lifeframeComplete = valuesDone && interestsDone && categoriesDone;

                // Progress Score calculation (out of 100)
                let score = 0;
                if (valuesDone) score += 25; else if (selectedVals.length > 0) score += 10;
                if (interestsDone) score += 25; else if (interestsCount > 0) score += 10;
                if (categoriesDone) score += 25; else if (categoriesCount > 0) score += 10;
                if (roadmapDone) score += 15;
                if (videoCount >= 5) score += 10; else if (videoCount > 0) score += 5;
                const overallProgressPct = Math.min(100, score);

                // Calculate last active timestamp
                let lastActiveDate = new Date(p.created_at);
                userEntries.forEach(e => {
                    if (e.updated_at) {
                        const d = new Date(e.updated_at);
                        if (d > lastActiveDate) lastActiveDate = d;
                    }
                });

                // Stuck detection: registered > 4 days ago with 0 milestones, or stuck on Step 1
                const daysSinceJoin = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
                let status: 'on_track' | 'in_progress' | 'stuck' = 'in_progress';
                if (lifeframeComplete || overallProgressPct >= 75) {
                    status = 'on_track';
                } else if (daysSinceJoin > 4 && (!valuesDone || overallProgressPct < 30)) {
                    status = 'stuck';
                }

                return {
                    id: p.id,
                    fullName: p.full_name || 'Unnamed Student',
                    createdAt: p.created_at,
                    lastActive: lastActiveDate.toISOString(),
                    subscriptionStatus: p.subscription_status || 'free',
                    videosWatched,
                    videoCount,
                    videoPct,
                    valuesDone,
                    valuesCount: selectedVals.length,
                    valuesList,
                    interestsDone,
                    interestsCount,
                    categoriesDone,
                    categoriesCount,
                    categoriesList,
                    roadmapDone,
                    goalCount: goals.length,
                    goalTitles: goals.map((g: any) => g?.title || '').filter(Boolean),
                    todoCount: activities.length,
                    completedTodoCount: completedTodos.length,
                    lifeframeComplete,
                    overallProgressPct,
                    status,
                };
            });

            setStudents(aggregated);

            // If a user query param was passed, automatically open their inspection modal
            const targetUserId = searchParams.get('user');
            if (targetUserId) {
                setSelectedStudentId(targetUserId);
            }
        } catch (err: any) {
            console.error('Failed to load cohort data:', err);
            setError(err.message || 'Failed to fetch cohort data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCohortData();
    }, [searchParams]);

    // Filter & Sort Logic
    const filteredStudents = useMemo(() => {
        return students
            .filter(s => {
                // Search query filter
                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const nameMatch = s.fullName.toLowerCase().includes(q);
                    const idMatch = s.id.toLowerCase().includes(q);
                    if (!nameMatch && !idMatch) return false;
                }

                // Status filter
                if (filterStatus === 'on_track') return s.status === 'on_track';
                if (filterStatus === 'in_progress') return s.status === 'in_progress';
                if (filterStatus === 'completed') return s.lifeframeComplete;
                if (filterStatus === 'stuck') return s.status === 'stuck';

                return true;
            })
            .sort((a, b) => {
                if (sortField === 'progress') return b.overallProgressPct - a.overallProgressPct;
                if (sortField === 'name') return a.fullName.localeCompare(b.fullName);
                if (sortField === 'joined') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                if (sortField === 'videos') return b.videoCount - a.videoCount;
                return 0;
            });
    }, [students, searchQuery, filterStatus, sortField]);

    // Cohort Aggregates
    const stats = useMemo(() => {
        const total = students.length;
        if (total === 0) return { total: 0, completedPct: 0, avgVideos: 0, stuckCount: 0 };

        const completedCount = students.filter(s => s.lifeframeComplete).length;
        const totalVideos = students.reduce((acc, s) => acc + s.videoCount, 0);
        const stuckCount = students.filter(s => s.status === 'stuck').length;

        return {
            total,
            completedPct: Math.round((completedCount / total) * 100),
            avgVideos: (totalVideos / total).toFixed(1),
            stuckCount,
        };
    }, [students]);

    // CSV Grade Sheet Export
    const handleExportCSV = () => {
        const headers = [
            'Student Name',
            'User ID',
            'Enrolled Date',
            'Last Active',
            'Values Completed',
            'Interests Completed',
            'Categories Completed',
            'LifeFrame Completed',
            'Goals Count',
            'Todos Completed',
            'Videos Watched (out of 19)',
            'Video Completion %',
            'Overall Progress %',
            'Status',
        ];

        const rows = filteredStudents.map(s => [
            `"${s.fullName.replace(/"/g, '""')}"`,
            `"${s.id}"`,
            new Date(s.createdAt).toLocaleDateString(),
            new Date(s.lastActive).toLocaleDateString(),
            s.valuesDone ? 'YES' : 'NO',
            s.interestsDone ? 'YES' : 'NO',
            s.categoriesDone ? 'YES' : 'NO',
            s.lifeframeComplete ? 'YES' : 'NO',
            s.goalCount,
            s.completedTodoCount,
            s.videoCount,
            `${s.videoPct}%`,
            `${s.overallProgressPct}%`,
            s.status.toUpperCase(),
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `cohort-gradesheet-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Copy to clipboard helper
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 2000);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-10 bg-white/5 rounded-2xl animate-pulse w-1/3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-28 bg-white/[0.02] border border-white/[0.06] rounded-2xl animate-pulse" />
                    ))}
                </div>
                <div className="h-96 bg-white/[0.02] border border-white/[0.06] rounded-3xl animate-pulse" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center max-w-lg mx-auto">
                <p className="text-red-400 font-semibold mb-3">Unable to load cohort data</p>
                <p className="text-xs text-gray-400 mb-6">{error}</p>
                <button
                    onClick={loadCohortData}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-5 py-2.5 rounded-xl transition text-xs font-bold"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center font-bold">
                            🎓
                        </span>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                Instructor Cohort Matrix
                            </h1>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Live student milestone tracking, curriculum progress, and grade sheet export
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] cursor-pointer"
                        title="Download CSV of current cohort list"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export Grade Sheet (CSV)
                    </button>

                    <button
                        onClick={loadCohortData}
                        className="inline-flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 hover:text-white px-3.5 py-2.5 rounded-xl transition text-xs font-semibold cursor-pointer"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Sync
                    </button>
                </div>
            </div>

            {/* Quick Cohort KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl p-5 bg-gradient-to-b from-purple-500/[0.08] to-purple-600/[0.02] border border-purple-500/20 backdrop-blur-xl shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase font-bold text-gray-400">Total Enrolled</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Students
                        </span>
                    </div>
                    <div className="text-3xl font-extrabold text-white tracking-tight">{stats.total}</div>
                    <div className="text-xs text-gray-500 mt-1">Active platform learners</div>
                </div>

                <div className="rounded-2xl p-5 bg-gradient-to-b from-emerald-500/[0.08] to-emerald-600/[0.02] border border-emerald-500/20 backdrop-blur-xl shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase font-bold text-gray-400">LifeFrame Complete</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Milestone
                        </span>
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">{stats.completedPct}%</div>
                    <div className="text-xs text-gray-500 mt-1">Values + Interests + Categories</div>
                </div>

                <div className="rounded-2xl p-5 bg-gradient-to-b from-cyan-500/[0.08] to-cyan-600/[0.02] border border-cyan-500/20 backdrop-blur-xl shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase font-bold text-gray-400">Avg Videos Watched</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            of 19
                        </span>
                    </div>
                    <div className="text-3xl font-extrabold text-cyan-400 tracking-tight">{stats.avgVideos}</div>
                    <div className="text-xs text-gray-500 mt-1">Videos completed per student</div>
                </div>

                <div className="rounded-2xl p-5 bg-gradient-to-b from-amber-500/[0.08] to-amber-600/[0.02] border border-amber-500/20 backdrop-blur-xl shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase font-bold text-gray-400">Needs Attention</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            At-Risk
                        </span>
                    </div>
                    <div className="text-3xl font-extrabold text-amber-400 tracking-tight">{stats.stuckCount}</div>
                    <div className="text-xs text-gray-500 mt-1">Stuck on Step 1 or inactive &gt; 4 days</div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    {(
                        [
                            { key: 'all', label: 'All Students', count: students.length },
                            { key: 'on_track', label: 'On Track', count: students.filter(s => s.status === 'on_track').length },
                            { key: 'in_progress', label: 'In Progress', count: students.filter(s => s.status === 'in_progress').length },
                            { key: 'completed', label: 'LifeFrame Done', count: students.filter(s => s.lifeframeComplete).length },
                            { key: 'stuck', label: 'Needs Nudge', count: students.filter(s => s.status === 'stuck').length },
                        ] as const
                    ).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilterStatus(tab.key)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                filterStatus === tab.key
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                                    : 'bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.06]'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                filterStatus === tab.key ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-gray-400'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search name or ID..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-48 sm:w-64 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60 transition"
                        />
                        <svg className="w-4 h-4 text-gray-500 absolute left-3 top-2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <select
                        value={sortField}
                        onChange={e => setSortField(e.target.value as SortField)}
                        className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-purple-500/60"
                    >
                        <option value="progress" className="bg-gray-900">Highest Progress</option>
                        <option value="name" className="bg-gray-900">Name (A-Z)</option>
                        <option value="joined" className="bg-gray-900">Newest Joined</option>
                        <option value="videos" className="bg-gray-900">Most Videos Watched</option>
                    </select>
                </div>
            </div>

            {/* Student Roster Table */}
            <div className="rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-white/[0.08] text-gray-400 font-semibold uppercase tracking-wider bg-white/[0.01]">
                                <th className="py-4 pl-6 pr-4">Student</th>
                                <th className="py-4 px-4">Videos (of 19)</th>
                                <th className="py-4 px-4 text-center">Step 1: Values</th>
                                <th className="py-4 px-4 text-center">Step 2: Interests</th>
                                <th className="py-4 px-4 text-center">Step 3: Categories</th>
                                <th className="py-4 px-4 text-center">Step 4: Roadmap</th>
                                <th className="py-4 px-4">Overall Score</th>
                                <th className="py-4 px-4">Status</th>
                                <th className="py-4 pr-6 pl-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-16 text-center text-gray-500">
                                        No students found matching current filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map(student => (
                                    <tr key={student.id} className="hover:bg-white/[0.02] transition-colors group">
                                        {/* Student Identity */}
                                        <td className="py-4 pl-6 pr-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs flex-shrink-0">
                                                    {student.fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-white text-xs truncate">
                                                        {student.fullName}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 font-mono">
                                                        Joined {new Date(student.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Videos Progress Bar */}
                                        <td className="py-4 px-4">
                                            <div className="w-28 space-y-1">
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="font-semibold text-white">{student.videoCount}</span>
                                                    <span className="text-gray-500">/ 19</span>
                                                </div>
                                                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${
                                                            student.videoCount >= 19
                                                                ? 'bg-emerald-400'
                                                                : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                                                        }`}
                                                        style={{ width: `${student.videoPct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        {/* Step 1: Values */}
                                        <td className="py-4 px-4 text-center">
                                            {student.valuesDone ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    ✓ Done ({student.valuesCount})
                                                </span>
                                            ) : student.valuesCount > 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                    In Progress
                                                </span>
                                            ) : (
                                                <span className="text-gray-600 text-[11px]">—</span>
                                            )}
                                        </td>

                                        {/* Step 2: Interests */}
                                        <td className="py-4 px-4 text-center">
                                            {student.interestsDone ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    ✓ Done ({student.interestsCount})
                                                </span>
                                            ) : student.interestsCount > 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                    In Progress
                                                </span>
                                            ) : (
                                                <span className="text-gray-600 text-[11px]">—</span>
                                            )}
                                        </td>

                                        {/* Step 3: Categories & Purpose */}
                                        <td className="py-4 px-4 text-center">
                                            {student.categoriesDone ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    ✓ Done ({student.categoriesCount})
                                                </span>
                                            ) : student.categoriesCount > 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                    In Progress
                                                </span>
                                            ) : (
                                                <span className="text-gray-600 text-[11px]">—</span>
                                            )}
                                        </td>

                                        {/* Step 4: Roadmap */}
                                        <td className="py-4 px-4 text-center">
                                            {student.goalCount > 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                                    {student.goalCount} Goals · {student.completedTodoCount} Tasks
                                                </span>
                                            ) : (
                                                <span className="text-gray-600 text-[11px]">—</span>
                                            )}
                                        </td>

                                        {/* Overall Score */}
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-xs">{student.overallProgressPct}%</span>
                                                <div className="w-12 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full"
                                                        style={{ width: `${student.overallProgressPct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        {/* Health Status */}
                                        <td className="py-4 px-4">
                                            {student.status === 'on_track' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                                    On Track
                                                </span>
                                            ) : student.status === 'stuck' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                                    Needs Nudge
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                                    In Progress
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 pr-6 pl-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedStudentId(student.id)}
                                                    className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-purple-600 hover:text-white text-gray-300 font-semibold text-[11px] transition cursor-pointer"
                                                    title="View student breakdown"
                                                >
                                                    Inspect
                                                </button>

                                                <button
                                                    onClick={() => setNudgeStudent(student)}
                                                    className="p-1 rounded-lg bg-white/[0.04] hover:bg-amber-500/20 text-gray-400 hover:text-amber-300 transition cursor-pointer"
                                                    title="Open email nudge template"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── Granular 360° Student Dossier Modal ────────────────────────── */}
            {selectedStudentId && (
                <StudentDossierModal
                    userId={selectedStudentId}
                    onClose={() => setSelectedStudentId(null)}
                />
            )}

            {/* ─── Nudge Email Template Modal ─────────────────────────────────── */}
            {nudgeStudent && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-gray-950 border border-white/[0.12] rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                            <div>
                                <h2 className="text-base font-bold text-white">Encouragement Check-In Template</h2>
                                <p className="text-xs text-gray-400">Pre-written email for {nudgeStudent.fullName}</p>
                            </div>
                            <button
                                onClick={() => setNudgeStudent(null)}
                                className="p-2 text-gray-400 hover:text-white rounded-xl bg-white/[0.04] transition cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs space-y-3 font-sans leading-relaxed text-gray-300 select-all">
                                <p className="font-semibold text-white">Subject: Checking in on your Tim Collins LifeFrame progress!</p>
                                <p>Hi {nudgeStudent.fullName.split(' ')[0] || 'there'},</p>
                                <p>
                                    Hope you&apos;re having a great week! I was reviewing our cohort progress in the Tim Collins Framework and noticed you&apos;re currently on the journey ({nudgeStudent.overallProgressPct}% completed so far).
                                </p>
                                {!nudgeStudent.valuesDone ? (
                                    <p>
                                        Taking the first step with the <strong>Core Values Worksheet</strong> can often spark the biggest breakthroughs. Setting aside just 15 minutes today to watch Video 1 and pick your top values will unlock the rest of your personalized roadmap.
                                    </p>
                                ) : !nudgeStudent.categoriesDone ? (
                                    <p>
                                        You&apos;ve already laid down great foundation with your values! The next chapter is mapping your <strong>Life Categories and Purpose Star</strong> — this is where everything starts connecting into concrete life habits.
                                    </p>
                                ) : (
                                    <p>
                                        You&apos;ve completed your LifeFrame — amazing work! Don&apos;t forget to jump into your <strong>Roadmap</strong> to set your daily and weekly habit goals.
                                    </p>
                                )}
                                <p>Let me know if you run into any questions or want to discuss your reflections!</p>
                                <p className="text-gray-400">— Your Instructor</p>
                            </div>

                            <button
                                onClick={() => {
                                    const text = `Subject: Checking in on your Tim Collins LifeFrame progress!\n\nHi ${nudgeStudent.fullName.split(' ')[0] || 'there'},\n\nHope you're having a great week! I was reviewing our cohort progress in the Tim Collins Framework and noticed you're currently on the journey (${nudgeStudent.overallProgressPct}% completed so far).\n\n${
                                        !nudgeStudent.valuesDone
                                            ? 'Taking the first step with the Core Values Worksheet can often spark the biggest breakthroughs. Setting aside just 15 minutes today to watch Video 1 and pick your top values will unlock the rest of your personalized roadmap.'
                                            : !nudgeStudent.categoriesDone
                                            ? 'You have already laid down a great foundation with your values! The next chapter is mapping your Life Categories and Purpose Star — this is where everything starts connecting into concrete life habits.'
                                            : 'You have completed your LifeFrame — amazing work! Do not forget to jump into your Roadmap to set your daily and weekly habit goals.'
                                    }\n\nLet me know if you run into any questions or want to discuss your reflections!\n\n— Your Instructor`;
                                    copyToClipboard(text);
                                }}
                                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                {copiedToast ? '✓ Copied to Clipboard!' : 'Copy Template to Clipboard'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CohortPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500 text-xs animate-pulse">Loading Cohort Matrix...</div>}>
            <CohortDashboardContent />
        </Suspense>
    );
}
