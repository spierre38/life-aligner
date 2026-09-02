'use client';

// app/dashboard/admin/components/StudentDossierModal.tsx
// Granular 360° Student Dossier & Inspection Modal

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { VIDEO_CATALOG } from '@/lib/videos';

interface StudentDossierModalProps {
    userId: string | null;
    onClose: () => void;
}

type TabType = 'overview' | 'values' | 'interests' | 'categories' | 'roadmap' | 'videos';

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

export default function StudentDossierModal({ userId, onClose }: StudentDossierModalProps) {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [workbookEntries, setWorkbookEntries] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        const fetchFullStudent = async () => {
            try {
                setLoading(true);
                setError(null);

                const [profileRes, entriesRes] = await Promise.all([
                    supabase.from('profiles').select('*').eq('id', userId).single(),
                    supabase.from('workbook_entries').select('*').eq('user_id', userId),
                ]);

                if (profileRes.error) throw profileRes.error;
                setProfile(profileRes.data);
                setWorkbookEntries(entriesRes.data || []);
            } catch (err: any) {
                console.error('Failed to load student dossier:', err);
                setError(err.message || 'Failed to fetch student details');
            } finally {
                setLoading(false);
            }
        };

        fetchFullStudent();
    }, [userId]);

    if (!userId) return null;

    // Parsed Data Extractions
    const valuesEntry = workbookEntries.find(e => e.category === 'values');
    const selectedValues = Array.isArray(valuesEntry?.content?.selected_values)
        ? [...valuesEntry.content.selected_values].sort((a, b) => (a.priority || 99) - (b.priority || 99))
        : [];

    const interestsEntry = workbookEntries.find(e => e.category === 'interests');
    const existingInterests: string[] = Array.isArray(interestsEntry?.content?.existing)
        ? interestsEntry.content.existing
        : [];
    const exploringInterests: string[] = Array.isArray(interestsEntry?.content?.exploring)
        ? interestsEntry.content.exploring
        : [];

    const categoriesEntry = workbookEntries.find(e => e.category === 'life_categories');
    const categories: any[] = Array.isArray(categoriesEntry?.content?.categories)
        ? categoriesEntry.content.categories
        : [];
    const purposeElements: any[] = Array.isArray(categoriesEntry?.content?.purpose_elements)
        ? categoriesEntry.content.purpose_elements
        : [];

    const roadmapEntry = workbookEntries.find(e => e.category === 'roadmap');
    const goals: any[] = Array.isArray(roadmapEntry?.content?.goals) ? roadmapEntry.content.goals : [];
    const activities: any[] = Array.isArray(roadmapEntry?.content?.activities) ? roadmapEntry.content.activities : [];

    const watchedVideoIds: string[] = Array.isArray(profile?.video_progress?.watched)
        ? profile.video_progress.watched
        : [];
    const videoPct = Math.min(100, Math.round((watchedVideoIds.length / 19) * 100));

    // LifeFrame Completion Status
    const valuesDone = selectedValues.length >= 3;
    const interestsDone = existingInterests.length + exploringInterests.length >= 3;
    const categoriesDone = categories.length >= 3;
    const lifeframeDone = valuesDone && interestsDone && categoriesDone;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-gray-950 border border-white/[0.12] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-fadeIn">
                {/* ─── Modal Header ────────────────────────────────────────── */}
                <div className="p-6 border-b border-white/[0.08] flex items-center justify-between gap-4 flex-shrink-0 bg-white/[0.01]">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 border border-purple-400/30 flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-lg shadow-purple-600/20">
                            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                                    {profile?.full_name || 'Anonymous Student'}
                                </h2>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                                    profile?.role === 'admin'
                                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                        : 'bg-white/10 text-gray-400 border-white/10'
                                }`}>
                                    {profile?.role || 'Student'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 font-mono truncate">ID: {userId}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-gray-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* ─── Navigation Tabs ─────────────────────────────────────── */}
                <div className="flex items-center gap-1.5 px-6 border-b border-white/[0.08] overflow-x-auto flex-shrink-0 bg-black/20 text-xs font-semibold">
                    {[
                        { key: 'overview', label: 'Overview & Profile', count: null },
                        { key: 'values', label: 'Core Values', count: selectedValues.length },
                        { key: 'interests', label: 'Interests', count: existingInterests.length + exploringInterests.length },
                        { key: 'categories', label: 'Categories & Purpose', count: categories.length },
                        { key: 'roadmap', label: 'Roadmap & Tasks', count: goals.length },
                        { key: 'videos', label: 'Video Hub', count: `${watchedVideoIds.length}/19` },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as TabType)}
                            className={`py-3 px-3.5 border-b-2 font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                                activeTab === tab.key
                                    ? 'border-purple-500 text-purple-300 font-bold'
                                    : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                        >
                            <span>{tab.label}</span>
                            {tab.count !== null && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                    activeTab === tab.key
                                        ? 'bg-purple-500/20 text-purple-300'
                                        : 'bg-white/[0.06] text-gray-500'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ─── Scrollable Modal Body ───────────────────────────────── */}
                <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
                    {loading ? (
                        <div className="py-20 text-center space-y-3">
                            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-gray-400">Loading student dossier...</p>
                        </div>
                    ) : error ? (
                        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center">
                            <p className="text-xs text-red-400">{error}</p>
                        </div>
                    ) : (
                        <>
                            {/* ─── TAB 1: OVERVIEW & DEMOGRAPHICS ─── */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* High-level status bar */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">LifeFrame</p>
                                            <p className={`text-base font-bold mt-1 ${lifeframeDone ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {lifeframeDone ? '✓ Completed' : 'In Progress'}
                                            </p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">Core 3 Worksheets</p>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Videos Watched</p>
                                            <p className="text-base font-bold text-white mt-1">
                                                {watchedVideoIds.length} <span className="text-xs text-gray-500">/ 19 ({videoPct}%)</span>
                                            </p>
                                            <div className="w-full h-1 bg-white/[0.06] rounded-full mt-2 overflow-hidden">
                                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${videoPct}%` }} />
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Roadmap Goals</p>
                                            <p className="text-base font-bold text-cyan-400 mt-1">{goals.length} Goals</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">{activities.filter(a => a?.completed).length} Tasks Done</p>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">AI Coach Calls</p>
                                            <p className="text-base font-bold text-purple-400 mt-1">{profile?.ai_calls_today ?? 0} Today</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">Interactive coaching</p>
                                        </div>
                                    </div>

                                    {/* Granular Onboarding Questionnaire Details */}
                                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                                            <h3 className="text-sm font-bold text-white">Onboarding & Life Stage Profile</h3>
                                            <span className="text-[11px] text-purple-400 font-semibold">User Questionnaire Answers</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Occupation / Path</p>
                                                <p className="text-xs font-semibold text-white mt-1">
                                                    {VALUE_LABELS[profile?.occupation] || profile?.occupation || 'Not Provided'}
                                                </p>
                                            </div>

                                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Age Range</p>
                                                <p className="text-xs font-semibold text-white mt-1">
                                                    {VALUE_LABELS[profile?.age_range] || profile?.age_range || 'Not Provided'}
                                                </p>
                                            </div>

                                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Gender</p>
                                                <p className="text-xs font-semibold text-white mt-1">
                                                    {VALUE_LABELS[profile?.gender] || profile?.gender || 'Not Provided'}
                                                </p>
                                            </div>

                                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Relationship Status</p>
                                                <p className="text-xs font-semibold text-white mt-1">
                                                    {VALUE_LABELS[profile?.marital_status] || profile?.marital_status || 'Not Provided'}
                                                </p>
                                            </div>

                                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Background / Ethnicity</p>
                                                <p className="text-xs font-semibold text-white mt-1">
                                                    {VALUE_LABELS[profile?.race_ethnicity] || profile?.race_ethnicity || 'Not Provided'}
                                                </p>
                                            </div>

                                            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Account Joined</p>
                                                <p className="text-xs font-semibold text-white mt-1">
                                                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Summary of Milestones */}
                                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                                        <h3 className="text-sm font-bold text-white">Workbook Milestones Summary</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                                                <span className="text-gray-400">Step 1: Core Values</span>
                                                <span className={valuesDone ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
                                                    {valuesDone ? `✓ ${selectedValues.length} Values Defined` : 'Incomplete'}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                                                <span className="text-gray-400">Step 2: Interests</span>
                                                <span className={interestsDone ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
                                                    {interestsDone ? `✓ ${existingInterests.length + exploringInterests.length} Interests Chosen` : 'Incomplete'}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                                                <span className="text-gray-400">Step 3: Life Categories</span>
                                                <span className={categoriesDone ? 'text-emerald-400 font-bold' : 'text-gray-500'}>
                                                    {categoriesDone ? `✓ ${categories.length} Categories Rated` : 'Incomplete'}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                                                <span className="text-gray-400">Step 4: Active Roadmap</span>
                                                <span className={goals.length > 0 ? 'text-cyan-400 font-bold' : 'text-gray-500'}>
                                                    {goals.length > 0 ? `✓ ${goals.length} Goals Active` : 'None Established'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─── TAB 2: CORE VALUES ─── */}
                            {activeTab === 'values' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-white">Chosen Core Values</h3>
                                            <p className="text-xs text-gray-400">Ranked by priority in student's LifeFrame</p>
                                        </div>
                                        <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                                            {selectedValues.length} Values
                                        </span>
                                    </div>

                                    {selectedValues.length === 0 ? (
                                        <div className="p-12 text-center text-gray-500 text-xs rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                            Student has not selected or prioritized core values yet.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {selectedValues.map((v: any, idx: number) => (
                                                <div key={idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-black text-purple-400">#{idx + 1} Priority</span>
                                                        {v.priority && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-300 font-mono">
                                                                Rank {v.priority}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="text-sm font-bold text-white">{v.name || 'Unnamed Value'}</h4>
                                                    {v.definition && (
                                                        <p className="text-xs text-gray-400 italic leading-relaxed">&ldquo;{v.definition}&rdquo;</p>
                                                    )}
                                                    {v.notes && (
                                                        <p className="text-xs text-purple-300/80 mt-1 leading-relaxed">{v.notes}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ─── TAB 3: INTERESTS ─── */}
                            {activeTab === 'interests' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Existing Interests */}
                                        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                                            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                                                    Current Passions & Activities
                                                </h4>
                                                <span className="text-xs text-gray-500 font-bold">{existingInterests.length}</span>
                                            </div>
                                            {existingInterests.length === 0 ? (
                                                <p className="text-xs text-gray-500 italic py-4 text-center">None listed yet</p>
                                            ) : (
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {existingInterests.map((item, i) => (
                                                        <span key={i} className="text-xs px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Exploring Interests */}
                                        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                                            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                                                    Curious to Explore (Bucket List)
                                                </h4>
                                                <span className="text-xs text-gray-500 font-bold">{exploringInterests.length}</span>
                                            </div>
                                            {exploringInterests.length === 0 ? (
                                                <p className="text-xs text-gray-500 italic py-4 text-center">None listed yet</p>
                                            ) : (
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {exploringInterests.map((item, i) => (
                                                        <span key={i} className="text-xs px-3 py-1 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─── TAB 4: LIFE CATEGORIES & PURPOSE ─── */}
                            {activeTab === 'categories' && (
                                <div className="space-y-6">
                                    {/* Written Purpose Statements */}
                                    {purposeElements.length > 0 && (
                                        <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-blue-900/30 border border-purple-500/30 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">⭐</span>
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                                                    Student&apos;s Life Purpose & Vision Statement
                                                </h4>
                                            </div>
                                            <div className="space-y-2">
                                                {purposeElements.map((pe: any, idx: number) => (
                                                    <div key={idx} className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.08]">
                                                        <p className="text-xs font-semibold text-purple-200 mb-1">{pe.name || 'Core Purpose'}</p>
                                                        <p className="text-xs text-gray-200 leading-relaxed italic">&ldquo;{pe.text || pe.description || 'No statement written'}&rdquo;</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Category list */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                            Life Categories & Current Satisfaction
                                        </h4>
                                        {categories.length === 0 ? (
                                            <div className="p-12 text-center text-gray-500 text-xs rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                                Student has not mapped their life categories yet.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {categories.map((cat: any, i: number) => (
                                                    <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <h5 className="text-xs font-bold text-white">{cat.name || 'Category'}</h5>
                                                            {(cat.score !== undefined || cat.satisfaction !== undefined) && (
                                                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                                                                    Score: {cat.score ?? cat.satisfaction} / 10
                                                                </span>
                                                            )}
                                                        </div>
                                                        {Array.isArray(cat.subCategories) && cat.subCategories.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 pt-1">
                                                                {cat.subCategories.map((sub: string, sIdx: number) => (
                                                                    <span key={sIdx} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.06] text-gray-300">
                                                                        {sub}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {cat.notes && (
                                                            <p className="text-xs text-gray-400 leading-relaxed italic">{cat.notes}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ─── TAB 5: ROADMAP & TASKS ─── */}
                            {activeTab === 'roadmap' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-white">Actionable Goals & Execution Habits</h3>
                                            <p className="text-xs text-gray-400">Roadmap goals committed by student</p>
                                        </div>
                                        <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                                            {goals.length} Goals Total
                                        </span>
                                    </div>

                                    {goals.length === 0 ? (
                                        <div className="p-12 text-center text-gray-500 text-xs rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                            Student has not created goals on their roadmap yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {goals.map((g: any, i: number) => {
                                                const goalActivities = activities.filter(a => a.goalId === g.id);
                                                return (
                                                    <div key={i} className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="text-sm font-bold text-white">{g.title || 'Untitled Goal'}</h4>
                                                                    {g.category && (
                                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                                                                            {g.category}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {g.why && (
                                                                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                                                        <strong className="text-gray-300">Why it matters:</strong> {g.why}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {g.deadline && (
                                                                <span className="text-[11px] text-gray-400 whitespace-nowrap bg-white/[0.04] px-2.5 py-1 rounded-lg">
                                                                    Due {new Date(g.deadline).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Action items/activities */}
                                                        {goalActivities.length > 0 && (
                                                            <div className="pt-3 border-t border-white/[0.04] space-y-2">
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                                                    Associated Activities & Habits ({goalActivities.filter(a => a.completed).length}/{goalActivities.length})
                                                                </p>
                                                                <div className="space-y-1.5">
                                                                    {goalActivities.map((act: any, actIdx: number) => (
                                                                        <div key={actIdx} className="flex items-center gap-2 text-xs">
                                                                            <span className={act.completed ? 'text-emerald-400 font-bold' : 'text-gray-600'}>
                                                                                {act.completed ? '✓' : '○'}
                                                                            </span>
                                                                            <span className={act.completed ? 'text-gray-400 line-through' : 'text-gray-200'}>
                                                                                {act.title}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ─── TAB 6: VIDEOS WATCHED ─── */}
                            {activeTab === 'videos' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-white">Curriculum Watch Checklist</h3>
                                            <p className="text-xs text-gray-400">Tracked playback across 19 Framework coaching videos</p>
                                        </div>
                                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                                            {watchedVideoIds.length} of 19 Completed
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                                        {VIDEO_CATALOG.map(v => {
                                            const isWatched = watchedVideoIds.includes(v.id);
                                            return (
                                                <div
                                                    key={v.id}
                                                    className={`flex items-center gap-3 p-3 rounded-2xl border transition ${
                                                        isWatched
                                                            ? 'bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-200'
                                                            : 'bg-white/[0.01] border-white/[0.04] text-gray-500'
                                                    }`}
                                                >
                                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                                        isWatched ? 'bg-emerald-400 text-black' : 'bg-white/10 text-gray-400'
                                                    }`}>
                                                        {isWatched ? '✓' : v.number}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-semibold truncate">{v.title}</p>
                                                        <p className="text-[10px] opacity-60 capitalize">{v.category} · {v.duration}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ─── Modal Footer ────────────────────────────────────────── */}
                <div className="p-4 border-t border-white/[0.08] flex items-center justify-end gap-3 flex-shrink-0 bg-white/[0.01]">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold transition cursor-pointer"
                    >
                        Close Dossier
                    </button>
                </div>
            </div>
        </div>
    );
}
