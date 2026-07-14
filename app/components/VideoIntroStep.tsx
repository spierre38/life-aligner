'use client';

import { useState } from 'react';

type VideoIntroStepProps = {
    onComplete: () => void;
};

const VIDEOS = [
    {
        num: 1,
        title: 'Welcome to the Tim Collins Framework',
        desc: 'Tim introduces the framework and explains how defining your values, interests, and purpose creates a foundation for lasting contentment.',
        duration: '~5 min',
    },
    {
        num: 2,
        title: 'How the Workbook Works',
        desc: 'A quick walkthrough of the 3-step workbook: Values, Interests, and Life Categories — with tips to get the most from each section.',
        duration: '~3 min',
    },
];

export default function VideoIntroStep({ onComplete }: VideoIntroStepProps) {
    const [_watched, setWatched] = useState<Set<number>>(new Set());

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto"
            style={{ background: 'var(--mesh-canvas, #050505)' }}
        >
            <div
                className="pointer-events-none fixed inset-0"
                style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 10%, rgba(139,92,246,0.10) 0%, transparent 70%)' }}
            />
            <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative">
                <div className="text-center mb-12 page-enter">
                    <p className="text-xs font-bold tracking-[0.28em] uppercase mb-4" style={{ color: 'rgba(167,139,250,0.85)' }}>
                        Before You Begin
                    </p>
                    <h1 className="text-4xl md:text-5xl font-light mb-4" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                        A message from Tim
                    </h1>
                    <p className="text-base max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                        Two short videos to help you get the most from the framework.
                    </p>
                </div>

                <div className="w-full max-w-3xl grid md:grid-cols-2 gap-5 mb-12">
                    {VIDEOS.map((v) => (
                        <div
                            key={v.num}
                            className="rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-2px]"
                            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                        >
                            <div
                                className="relative aspect-video flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(30,10,60,0.85) 100%)',
                                    borderBottom: '1px solid var(--color-border)',
                                }}
                            >
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
                                >
                                    <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(255,255,255,0.55)' }}>
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                                <div
                                    className="absolute bottom-3 left-3 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full"
                                    style={{ background: 'rgba(167,139,250,0.12)', color: 'rgba(167,139,250,0.85)', border: '1px solid rgba(167,139,250,0.22)' }}
                                >
                                    Coming soon
                                </div>
                                <div
                                    className="absolute bottom-3 right-3 text-[10px] font-medium px-2 py-0.5 rounded"
                                    style={{ background: 'rgba(0,0,0,0.5)', color: 'var(--color-text-dim)' }}
                                >
                                    {v.duration}
                                </div>
                                <div className="absolute top-3 left-3 text-xs font-bold" style={{ color: 'var(--color-text-dim)' }}>
                                    0{v.num}
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="text-base font-semibold mb-2 leading-snug" style={{ color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                                    {v.title}
                                </h3>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                                    {v.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={onComplete}
                        className="px-10 py-3.5 rounded-full font-semibold text-base transition-all hover:opacity-90 active:scale-[0.98] flex items-center gap-2.5"
                        style={{ background: 'var(--color-text)', color: 'var(--color-bg)', letterSpacing: '-0.01em' }}
                    >
                        Continue to Workbook
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>
                    <button
                        onClick={onComplete}
                        className="text-sm transition-colors"
                        style={{ color: 'var(--color-text-dim)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-dim)')}
                    >
                        Skip — I&apos;ve already watched these
                    </button>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.18)' }}>
                        Videos will be available soon — return anytime to watch.
                    </p>
                </div>
            </div>
        </div>
    );
}
