'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';

type LifeFrameData = {
    values?: {
        selected_values: Array<{ name: string; priority: number }>;
    };
    interests?: {
        existing: string[];
        exploring: string[];
    };
    life_categories?: {
        categories: Array<{
            name: string;
            sub_categories?: string[];
        }>;
        purpose_elements?: Array<{ name: string; description?: string }>;
    };
};

export default function LifeFramePrintView() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [lifeFrameData, setLifeFrameData] = useState<LifeFrameData>({});
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }

                setUserName(userWithProfile.profile.full_name || 'Your LifeFrame');
                setCurrentDate(new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                }));

                const { data: entries, error } = await supabase
                    .from('workbook_entries')
                    .select('category, content')
                    .eq('user_id', userWithProfile.user.id)
                    .in('category', ['values', 'interests', 'life_categories']);

                if (error) throw error;

                const organized: LifeFrameData = {};
                entries?.forEach(entry => {
                    if (entry.category === 'values') {
                        organized.values = entry.content;
                    } else if (entry.category === 'interests') {
                        organized.interests = entry.content;
                    } else if (entry.category === 'life_categories') {
                        organized.life_categories = entry.content;
                    }
                });

                setLifeFrameData(organized);
            } catch (error) {
                console.error('Error loading LifeFrame data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router]);

    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => {
                window.print();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, border: '3px solid #000', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ color: '#555', fontSize: 15, fontFamily: 'system-ui, sans-serif' }}>Loading your LifeFrame…</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const EmptySection = ({ label }: { label: string }) => (
        <div style={{ border: '1.5px dashed #d1d5db', borderRadius: 8, padding: '24px 20px', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>Complete the {label} worksheet to populate this section.</p>
        </div>
    );

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
                            Your LifeFrame
                        </h1>
                        <p style={{ margin: 0, fontSize: 16, color: '#374151', fontFamily: 'system-ui, sans-serif' }}>
                            {userName} &nbsp;·&nbsp; <span style={{ color: '#9ca3af' }}>{currentDate}</span>
                        </p>
                    </div>

                    <div style={{ borderTop: '2px solid #000', marginBottom: 48 }} />

                    {/* ── VALUES ─────────────────────────────────────────── */}
                    <section style={{ marginBottom: 48, pageBreakInside: 'avoid' }}>
                        <h2 style={{ margin: '0 0 24px', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#000', fontFamily: 'system-ui, sans-serif' }}>
                            Your Values
                        </h2>

                        {lifeFrameData.values ? (
                            <div>
                                {lifeFrameData.values.selected_values
                                    ?.sort((a, b) => a.priority - b.priority)
                                    .map((value, index) => (
                                        <div key={index} style={{
                                            display: 'flex', alignItems: 'baseline', gap: 20,
                                            padding: '16px 0',
                                            borderBottom: index < (lifeFrameData.values!.selected_values.length - 1) ? '1px solid #f3f4f6' : 'none'
                                        }}>
                                            <span style={{ fontSize: 28, fontWeight: 800, color: '#e5e7eb', fontFamily: 'Georgia, serif', minWidth: 32, lineHeight: 1 }}>
                                                {value.priority}
                                            </span>
                                            <span style={{ fontSize: 18, fontWeight: 600, color: '#111', fontFamily: 'system-ui, sans-serif' }}>
                                                {value.name}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <EmptySection label="Values" />
                        )}
                    </section>

                    <div style={{ borderTop: '1px solid #f3f4f6', marginBottom: 48 }} />

                    {/* ── INTERESTS ──────────────────────────────────────── */}
                    <section style={{ marginBottom: 48, pageBreakInside: 'avoid' }}>
                        <h2 style={{ margin: '0 0 24px', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#000', fontFamily: 'system-ui, sans-serif' }}>
                            Your Interests
                        </h2>

                        {lifeFrameData.interests ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                {/* Existing */}
                                <div>
                                    <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', fontFamily: 'system-ui, sans-serif' }}>
                                        Current
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {lifeFrameData.interests.existing?.length > 0
                                            ? lifeFrameData.interests.existing.map((item, i) => (
                                                <span key={i} style={{ padding: '6px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 100, fontSize: 13, color: '#111', fontFamily: 'system-ui, sans-serif' }}>
                                                    {item}
                                                </span>
                                            ))
                                            : <span style={{ fontSize: 13, color: '#9ca3af' }}>None added</span>
                                        }
                                    </div>
                                </div>

                                {/* Exploring */}
                                <div>
                                    <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', fontFamily: 'system-ui, sans-serif' }}>
                                        Exploring
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {lifeFrameData.interests.exploring?.length > 0
                                            ? lifeFrameData.interests.exploring.map((item, i) => (
                                                <span key={i} style={{ padding: '6px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 100, fontSize: 13, color: '#111', fontFamily: 'system-ui, sans-serif' }}>
                                                    {item}
                                                </span>
                                            ))
                                            : <span style={{ fontSize: 13, color: '#9ca3af' }}>None added</span>
                                        }
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <EmptySection label="Interests" />
                        )}
                    </section>

                    <div style={{ borderTop: '1px solid #f3f4f6', marginBottom: 48 }} />

                    {/* ── LIFE CATEGORIES ────────────────────────────────── */}
                    <section style={{ marginBottom: 48, pageBreakInside: 'avoid' }}>
                        <h2 style={{ margin: '0 0 24px', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#000', fontFamily: 'system-ui, sans-serif' }}>
                            Your Life Categories
                        </h2>

                        {lifeFrameData.life_categories ? (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                                    {lifeFrameData.life_categories.categories?.map((category, index) => (
                                        <div key={index} style={{ border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '16px 18px' }}>
                                            <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#111', fontFamily: 'system-ui, sans-serif' }}>
                                                {category.name}
                                            </p>
                                            {category.sub_categories && category.sub_categories.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    {category.sub_categories.map((sub, si) => (
                                                        <span key={si} style={{ fontSize: 12, color: '#6b7280', fontFamily: 'system-ui, sans-serif' }}>
                                                            — {sub}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Purpose Elements */}
                                {lifeFrameData.life_categories.purpose_elements &&
                                    lifeFrameData.life_categories.purpose_elements.length > 0 && (
                                        <div style={{ marginTop: 32, padding: '20px 24px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10 }}>
                                            <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', fontFamily: 'system-ui, sans-serif' }}>
                                                Your Purpose
                                            </p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                {lifeFrameData.life_categories.purpose_elements.map((element, index) => (
                                                    <div key={index}>
                                                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#111', fontFamily: 'system-ui, sans-serif' }}>
                                                            {typeof element === 'string' ? element : element.name}
                                                        </p>
                                                        {typeof element === 'object' && element.description && (
                                                            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280', fontFamily: 'system-ui, sans-serif' }}>
                                                                {element.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                            </>
                        ) : (
                            <EmptySection label="Life Categories" />
                        )}
                    </section>

                    {/* Footer */}
                    <div style={{ borderTop: '2px solid #000', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
