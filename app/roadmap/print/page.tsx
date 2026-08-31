'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';

type RoadmapEntry = {
    life_category: string;
    goals: Array<{
        goal: string;
        type: 'goal' | 'behavior_change';
        activities: string[];
    }>;
};

export default function RoadmapPrintView() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [roadmapData, setRoadmapData] = useState<RoadmapEntry[]>([]);
    const [currentDate, setCurrentDate] = useState('');
    const [lifeFrameComplete, setLifeFrameComplete] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }

                setUserName(userWithProfile.profile.full_name || 'Your Roadmap');
                setCurrentDate(new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                }));

                const { data: entries, error: entriesError } = await supabase
                    .from('workbook_entries')
                    .select('category')
                    .eq('user_id', userWithProfile.user.id)
                    .in('category', ['values', 'interests', 'life_categories']);

                if (entriesError) throw entriesError;

                const hasValues = entries?.some(e => e.category === 'values');
                const hasInterests = entries?.some(e => e.category === 'interests');
                const hasCategories = entries?.some(e => e.category === 'life_categories');

                if (!hasValues || !hasInterests || !hasCategories) {
                    setLifeFrameComplete(false);
                    setLoading(false);
                    return;
                }

                setLifeFrameComplete(true);

                const { data: roadmapEntries, error: roadmapError } = await supabase
                    .from('workbook_entries')
                    .select('content')
                    .eq('user_id', userWithProfile.user.id)
                    .eq('category', 'roadmap')
                    .single();

                if (roadmapError && roadmapError.code !== 'PGRST116') {
                    throw roadmapError;
                }

                if (roadmapEntries?.content) {
                    const items = roadmapEntries.content.items || [];
                    const groupedByCategory: { [key: string]: RoadmapEntry } = {};

                    items.forEach((item: any) => {
                        if (!groupedByCategory[item.category]) {
                            groupedByCategory[item.category] = {
                                life_category: item.category,
                                goals: []
                            };
                        }
                        groupedByCategory[item.category].goals.push({
                            goal: item.title,
                            type: item.type,
                            activities: item.activities.map((a: any) => a.text)
                        });
                    });

                    setRoadmapData(Object.values(groupedByCategory));
                }

            } catch (error) {
                console.error('Error loading Roadmap data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router]);

    useEffect(() => {
        if (!loading && lifeFrameComplete && roadmapData.length > 0) {
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loading, lifeFrameComplete, roadmapData]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, border: '3px solid #000', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ color: '#555', fontSize: 15, fontFamily: 'system-ui, sans-serif' }}>Loading your Roadmap…</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const StateCard = ({ icon, title, message, action }: { icon: React.ReactNode; title: string; message: string; action?: React.ReactNode }) => (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: 24 }}>
            <div style={{ maxWidth: 440, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
                <div style={{ width: 64, height: 64, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#6b7280' }}>
                    {icon}
                </div>
                <h2 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 700, color: '#111' }}>{title}</h2>
                <p style={{ margin: '0 0 28px', fontSize: 15, color: '#6b7280', lineHeight: 1.6 }}>{message}</p>
                {action}
            </div>
        </div>
    );

    if (!lifeFrameComplete) {
        return (
            <StateCard
                icon={<svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>}
                title="LifeFrame Required"
                message="Complete your Values, Interests, and Life Categories workbooks before printing your Roadmap."
                action={<button onClick={() => router.push('/dashboard')} style={{ padding: '12px 28px', background: '#000', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Go to Dashboard</button>}
            />
        );
    }

    if (roadmapData.length === 0) {
        return (
            <StateCard
                icon={<svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                title="Roadmap Empty"
                message="You haven't added any goals yet. Build your Roadmap first, then return here to print it."
                action={<button onClick={() => router.push('/dashboard')} style={{ padding: '12px 28px', background: '#000', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Go to Dashboard</button>}
            />
        );
    }

    return (
        <>
            {/* ── Screen-only toolbar ─────────────────────────────────── */}
            <div className="no-print" style={{
                position: 'sticky', top: 0, zIndex: 10,
                background: '#fff', borderBottom: '1px solid #e5e7eb',
                padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <button
                    onClick={() => router.push('/dashboard')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: 14, fontWeight: 600 }}
                >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </button>
                <button
                    onClick={() => window.print()}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#000', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print / Save as PDF
                </button>
            </div>

            {/* ── Printable document ──────────────────────────────────── */}
            <div style={{ background: '#fff', minHeight: '100vh' }}>
                <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 40px' }} className="print-content">

                    {/* Aurora accent strip */}
                    <div style={{ height: 4, borderRadius: 2, marginBottom: 40, background: 'linear-gradient(90deg, rgba(255,45,153,0.9) 0%, rgba(120,40,255,0.8) 40%, rgba(0,212,255,0.7) 100%)' }} />

                    {/* Header */}
                    <div style={{ marginBottom: 40 }}>
                        <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', fontFamily: 'system-ui, sans-serif' }}>
                            Tim Collins Framework
                        </p>
                        <h1 style={{ margin: '0 0 8px', fontSize: 36, fontWeight: 800, color: '#000', letterSpacing: '-0.03em', fontFamily: 'Georgia, serif' }}>
                            Your Roadmap
                        </h1>
                        <p style={{ margin: 0, fontSize: 16, color: '#374151', fontFamily: 'system-ui, sans-serif' }}>
                            {userName} &nbsp;·&nbsp; <span style={{ color: '#9ca3af' }}>{currentDate}</span>
                        </p>
                    </div>

                    <div style={{ borderTop: '2px solid #000', marginBottom: 48 }} />

                    {/* ── Roadmap Sections ──────────────────────────────── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
                        {roadmapData.map((entry, entryIndex) => (
                            <section key={entryIndex} style={{ pageBreakInside: 'avoid' }}>
                                {/* Category header */}
                                <div style={{ marginBottom: 24 }}>
                                    <h2 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#000', fontFamily: 'system-ui, sans-serif' }}>
                                        {entry.life_category}
                                    </h2>
                                    <div style={{ height: 2, width: 40, background: '#000' }} />
                                </div>

                                {/* Goals */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                                    {entry.goals.map((goalItem, goalIndex) => (
                                        <div key={goalIndex} style={{ paddingLeft: 20, borderLeft: '2px solid #f3f4f6' }}>
                                            {/* Type label */}
                                            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', fontFamily: 'system-ui, sans-serif' }}>
                                                {goalItem.type === 'goal' ? 'Goal' : 'Behavior Change'}
                                            </p>
                                            {/* Goal text */}
                                            <p style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 700, color: '#111', fontFamily: 'system-ui, sans-serif', lineHeight: 1.4 }}>
                                                {goalItem.goal}
                                            </p>

                                            {/* Activities */}
                                            {goalItem.activities && goalItem.activities.length > 0 && (
                                                <div>
                                                    <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', fontFamily: 'system-ui, sans-serif' }}>
                                                        Action Steps
                                                    </p>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        {goalItem.activities.map((activity, actIndex) => (
                                                            <div key={actIndex} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                                                <span style={{ fontSize: 13, color: '#9ca3af', flexShrink: 0, lineHeight: '22px', fontFamily: 'system-ui, sans-serif' }}>—</span>
                                                                <span style={{ fontSize: 14, color: '#374151', fontFamily: 'system-ui, sans-serif', lineHeight: 1.6 }}>{activity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {entryIndex < roadmapData.length - 1 && (
                                    <div style={{ borderTop: '1px solid #f3f4f6', marginTop: 40 }} />
                                )}
                            </section>
                        ))}
                    </div>

                    {/* Footer */}
                    <div style={{ borderTop: '2px solid #000', marginTop: 56, paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', fontFamily: 'system-ui, sans-serif' }}>
                            Tim Collins Framework &nbsp;·&nbsp; Your path to contentment
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', fontFamily: 'system-ui, sans-serif' }}>
                            timcollinsframework.com
                        </p>
                    </div>

                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    @page { margin: 0.6in; size: letter; }
                    .print-content { padding: 0 !important; }
                    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </>
    );
}
