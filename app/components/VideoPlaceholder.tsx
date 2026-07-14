'use client';

import { useState } from 'react';

type VideoPlaceholderProps = {
    title: string;
    description: string;
    duration?: string;
    worksheetPath: string;
    icon?: string;
};

export function VideoPlaceholder({
    title,
    description,
    duration = '3-5 min',
    worksheetPath,
    icon = 'video',
}: VideoPlaceholderProps) {
    const [showVideo, setShowVideo] = useState(true);

    return (
        <>
            {showVideo && (
                <div
                    className="rounded-2xl p-5 mb-8 flex items-start gap-5"
                    style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                    }}
                >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                        <div
                            className="relative w-48 h-28 rounded-xl overflow-hidden flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(20,5,50,0.85) 100%)',
                                border: '1px solid var(--color-border)',
                            }}
                        >
                            {/* Play button */}
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{
                                    background: 'rgba(255,255,255,0.07)',
                                    border: '1.5px solid rgba(255,255,255,0.15)',
                                    backdropFilter: 'blur(6px)',
                                }}
                            >
                                <svg
                                    className="w-5 h-5 ml-0.5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    style={{ color: 'rgba(255,255,255,0.55)' }}
                                >
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>

                            {/* Duration */}
                            <div
                                className="absolute bottom-2 right-2 text-[9px] font-medium px-1.5 py-0.5 rounded"
                                style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--color-text-dim)' }}
                            >
                                {duration}
                            </div>

                            {/* Coming soon badge */}
                            <div
                                className="absolute top-2 left-2 text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full"
                                style={{
                                    background: 'rgba(167,139,250,0.12)',
                                    color: 'rgba(167,139,250,0.8)',
                                    border: '1px solid rgba(167,139,250,0.2)',
                                }}
                            >
                                Soon
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <h3
                            className="text-sm font-semibold mb-1.5 leading-snug"
                            style={{ color: 'var(--color-text)', letterSpacing: '-0.01em' }}
                        >
                            {title}
                        </h3>
                        <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--color-text-muted)' }}>
                            {description}
                        </p>
                        <button
                            onClick={() => setShowVideo(false)}
                            className="text-xs font-medium flex items-center gap-1.5 transition-colors"
                            style={{ color: 'var(--color-text-dim)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-dim)')}
                        >
                            Skip to worksheet
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {!showVideo && (
                <button
                    onClick={() => setShowVideo(true)}
                    className="mb-6 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    style={{ color: 'var(--color-text-dim)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-dim)')}
                >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                    Watch intro video ({duration})
                </button>
            )}
        </>
    );
}
