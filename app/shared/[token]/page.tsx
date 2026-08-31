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
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, border: '2px solid rgba(255,255,255,0.15)', borderTopColor: '#fff', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, fontFamily: 'system-ui, sans-serif', margin: 0 }}>Loading roadmap…</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error || !roadmap) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', padding: 24 }}>
                <div style={{ maxWidth: 420, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
                    <div style={{ width: 64, height: 64, background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', color: 'rgba(255,255,255,0.3)' }}>
                        <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                        </svg>
                    </div>
                    <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 700, color: '#fff' }}>Roadmap Not Found</h1>
                    <p style={{ margin: '0 0 32px', fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                        This link may have expired or the roadmap has been removed.
                    </p>
                    <a
                        href="/"
                        style={{ display: 'inline-block', padding: '12px 28px', background: '#fff', color: '#000', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                    >
                        Go to Tim Collins Framework
                    </a>
                </div>
            </div>
        );
    }

    const roadmapData = roadmap.roadmap_data || {};
    const items = roadmapData.items || [];

    return (
        <div style={{ minHeight: '100vh', background: '#050505', fontFamily: 'system-ui, sans-serif' }}>

            {/* ── Hero ──────────────────────────────────────────────── */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Aurora strip */}
                <div style={{ height: 3, background: 'linear-gradient(90deg, rgba(255,45,153,0.9) 0%, rgba(120,40,255,0.8) 40%, rgba(0,212,255,0.7) 100%)' }} />

                <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 40px' }}>
                    <p style={{ margin: '0 0 20px', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                        Tim Collins Framework
                    </p>
                    <h1 style={{ margin: '0 0 12px', fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                        {roadmap.user_name}&apos;s Roadmap
                    </h1>
                    <p style={{ margin: '0 0 24px', fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                        Goals, values, and path to contentment
                    </p>
                    {roadmap.views_count !== undefined && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100 }}>
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{roadmap.views_count} views</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Content ───────────────────────────────────────────── */}
            <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>

                {items.length === 0 ? (
                    <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '64px 32px', textAlign: 'center' }}>
                        <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.04)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'rgba(255,255,255,0.25)' }}>
                            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#fff' }}>Journey Just Beginning</h3>
                        <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
                            {roadmap.user_name} is still building their roadmap
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {items.map((item: any, index: number) => (
                            <div key={index} style={{
                                background: '#111',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 16,
                                padding: '28px 32px',
                                transition: 'border-color 0.2s'
                            }}>
                                {/* Goal header */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                                    <span style={{ fontSize: 28, fontWeight: 800, color: 'rgba(255,255,255,0.1)', lineHeight: 1, flexShrink: 0, fontFamily: 'Georgia, serif' }}>
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                                            {item.type && (
                                                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', padding: '3px 10px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 100 }}>
                                                    {item.type === 'goal' ? 'Goal' : 'Behavior Change'}
                                                </span>
                                            )}
                                            {item.category && (
                                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                                                    {item.category}
                                                </span>
                                            )}
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                                            {item.goal || item.title || item.behavior_change}
                                        </h3>
                                    </div>
                                </div>

                                {/* Connected Values */}
                                {item.connected_values && item.connected_values.length > 0 && (
                                    <div style={{ marginBottom: 20 }}>
                                        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                                            Connected Values
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {item.connected_values.map((value: string, i: number) => (
                                                <span key={i} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 100, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                                                    {value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Activities */}
                                {item.activities && item.activities.length > 0 && (
                                    <div>
                                        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                                            Action Steps
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {item.activities.map((activity: any, i: number) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', flexShrink: 0, lineHeight: '22px' }}>—</span>
                                                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                                                        {typeof activity === 'string' ? activity : activity.text || 'Untitled'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ── CTA ───────────────────────────────────────────── */}
                <div style={{ marginTop: 48, background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '48px 40px', textAlign: 'center' }}>
                    {/* Aurora strip */}
                    <div style={{ height: 3, borderRadius: 2, marginBottom: 32, background: 'linear-gradient(90deg, rgba(255,45,153,0.9) 0%, rgba(120,40,255,0.8) 40%, rgba(0,212,255,0.7) 100%)' }} />
                    <h3 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                        Build Your Own Roadmap
                    </h3>
                    <p style={{ margin: '0 0 28px', fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                        Start your journey to contentment with the Tim Collins Framework
                    </p>
                    <a
                        href="/signup"
                        style={{ display: 'inline-block', padding: '14px 36px', background: '#fff', color: '#000', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}
                    >
                        Get Started Free
                    </a>
                </div>

                <p style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
                    timcollinsframework.com
                </p>
            </div>
        </div>
    );
}
