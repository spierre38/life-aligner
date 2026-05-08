'use client';

import { useState } from 'react';

type VideoIntroStepProps = {
    onComplete: () => void;
};

export default function VideoIntroStep({ onComplete }: VideoIntroStepProps) {
    const [watchedVideos, setWatchedVideos] = useState<Set<number>>(new Set());

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 overflow-y-auto">
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
                {/* Header */}
                <div className="text-center mb-10 animate-fade-in">
                    <p className="text-xs font-bold tracking-[0.3em] uppercase text-indigo-400 mb-3">Before You Begin</p>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3" style={{ textShadow: '0 0 40px rgba(139,92,246,0.5)' }}>
                        Quick Intro Videos
                    </h1>
                    <p className="text-slate-400 text-lg max-w-md mx-auto">
                        Two short videos from Tim to help you get the most out of the Tim Collins Framework.
                    </p>
                </div>

                {/* Video Cards */}
                <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 mb-10">
                    {/* Video 1 */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                        <div className="relative bg-gradient-to-br from-indigo-900 to-purple-900 aspect-video flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
                                    <svg className="w-10 h-10 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                                <p className="text-white text-lg font-semibold mb-1">Coming Soon</p>
                                <p className="text-indigo-300 text-sm">By Tim Collins</p>
                            </div>
                            <div className="absolute top-3 left-3 bg-indigo-500/80 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                                Video 1
                            </div>
                            <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">
                                ~5 min
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white mb-2">Welcome to the Tim Collins Framework</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Tim introduces the Tim Collins Framework and explains how defining your values, interests,
                                and purpose creates a foundation for lasting contentment.
                            </p>
                        </div>
                    </div>

                    {/* Video 2 */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                        <div className="relative bg-gradient-to-br from-purple-900 to-pink-900 aspect-video flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
                                    <svg className="w-10 h-10 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                                <p className="text-white text-lg font-semibold mb-1">Coming Soon</p>
                                <p className="text-purple-300 text-sm">By Tim Collins</p>
                            </div>
                            <div className="absolute top-3 left-3 bg-purple-500/80 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                                Video 2
                            </div>
                            <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">
                                ~3 min
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white mb-2">How the Workbook Works</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                A quick walkthrough of the 3-step workbook process: Values, Interests, and Life Categories.
                                Tim shares tips to get the most out of each section.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <button
                        onClick={onComplete}
                        className="px-10 py-4 rounded-2xl text-white font-bold text-lg shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-3"
                        style={{
                            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)',
                            boxShadow: '0 0 32px rgba(124,58,237,0.45), 0 4px 24px rgba(0,0,0,0.4)'
                        }}
                    >
                        <span>Continue to Tutorial</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>
                </div>

                <button
                    onClick={onComplete}
                    className="mt-4 text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-2 group"
                >
                    <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    Skip — I've already seen this
                </button>

                <p className="text-slate-600 text-xs mt-4">
                    Videos will be available soon — you can always come back to watch them later.
                </p>
            </div>
        </div>
    );
}
