'use client';

import { useState } from 'react';
import VideoPlayer from '@/app/components/VideoPlayer';
import { getVideo } from '@/lib/videos';

type VideoIntroStepProps = {
    onComplete: () => void;
};

export default function VideoIntroStep({ onComplete }: VideoIntroStepProps) {
    const [activeVideo, setActiveVideo] = useState<{ video: any; src: string } | null>(null);

    const video1 = getVideo('v1-welcome');
    const video2 = getVideo('v2-contentment');

    const videos = [
        {
            num: 1,
            video: video1,
            title: video1?.title || 'Welcome to the Tim Collins Framework',
            desc: video1?.description || 'Tim introduces the framework and explains how defining your values, interests, and purpose creates a foundation for lasting contentment.',
            duration: video1?.duration || '5:17',
        },
        {
            num: 2,
            video: video2,
            title: video2?.title || 'What is Contentment?',
            desc: video2?.description || 'Understanding the difference between happiness and sustained contentment — and why values-aligned action is the key.',
            duration: video2?.duration || '4:33',
        },
    ];

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
                    {videos.map((v) => (
                        <div
                            key={v.num}
                            onClick={() => {
                                if (v.video?.blobUrl) {
                                    setActiveVideo({ video: v.video, src: v.video.blobUrl });
                                }
                            }}
                            className="rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-3px] cursor-pointer group"
                            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}
                        >
                            <div
                                className="relative aspect-video flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(20,10,40,0.9) 100%)',
                                    borderBottom: '1px solid var(--color-border)',
                                }}
                            >
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-xl"
                                    style={{ background: 'rgba(139,92,246,0.3)', border: '2px solid rgba(167,139,250,0.5)', backdropFilter: 'blur(8px)' }}
                                >
                                    <svg className="w-7 h-7 ml-1 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                                <div
                                    className="absolute bottom-3 left-3 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5"
                                    style={{ background: 'rgba(34,197,94,0.15)', color: 'rgba(34,197,94,0.95)', border: '1px solid rgba(34,197,94,0.3)' }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Play Video
                                </div>
                                <div
                                    className="absolute bottom-3 right-3 text-[10px] font-medium px-2 py-0.5 rounded"
                                    style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.7)' }}
                                >
                                    {v.duration}
                                </div>
                                <div className="absolute top-3 left-3 text-xs font-bold" style={{ color: 'rgba(167,139,250,0.8)' }}>
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
                        className="px-10 py-3.5 rounded-full font-semibold text-base transition-all hover:opacity-90 active:scale-[0.98] flex items-center gap-2.5 shadow-lg"
                        style={{ background: 'var(--color-text)', color: 'var(--color-bg)', letterSpacing: '-0.01em' }}
                    >
                        Continue to Workbook
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>
                    <button
                        onClick={onComplete}
                        className="text-sm transition-colors cursor-pointer"
                        style={{ color: 'var(--color-text-dim)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-dim)')}
                    >
                        Skip for now — I&apos;ll watch later
                    </button>
                </div>
            </div>

            {/* Video Player Modal */}
            {activeVideo && (
                <VideoPlayer
                    video={activeVideo.video}
                    src={activeVideo.src}
                    onClose={() => setActiveVideo(null)}
                />
            )}
        </div>
    );
}

