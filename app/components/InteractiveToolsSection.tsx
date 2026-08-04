'use client';

import { useState } from 'react';

// ============================================================================
// INLINE SVG ICONS
// ============================================================================

const LifeFrameIcon = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="lifeframeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
        </defs>
        {/* Clipboard/document representation */}
        <rect x="50" y="30" width="100" height="140" rx="10" fill="url(#lifeframeGradient)" opacity="0.2" />
        <rect x="50" y="30" width="100" height="20" rx="10" fill="url(#lifeframeGradient)" />
        <line x1="70" y1="70" x2="130" y2="70" stroke="url(#lifeframeGradient)" strokeWidth="4" strokeLinecap="round" />
        <line x1="70" y1="90" x2="130" y2="90" stroke="url(#lifeframeGradient)" strokeWidth="4" strokeLinecap="round" />
        <line x1="70" y1="110" x2="110" y2="110" stroke="url(#lifeframeGradient)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="100" cy="140" r="8" fill="url(#lifeframeGradient)" />
    </svg>
);

const RoadmapIcon = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="roadmapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
        </defs>
        {/* Map/path representation */}
        <rect x="30" y="30" width="140" height="140" rx="15" fill="url(#roadmapGradient)" opacity="0.1" />
        <path
            d="M 50,80 Q 70,60 100,70 T 150,60"
            stroke="url(#roadmapGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
        />
        <path
            d="M 50,120 Q 80,110 100,120 T 150,110"
            stroke="url(#roadmapGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
        />
        <circle cx="50" cy="80" r="8" fill="#3b82f6" />
        <circle cx="100" cy="70" r="8" fill="#8b5cf6" />
        <circle cx="150" cy="60" r="8" fill="#ec4899" />
        <rect x="45" y="140" width="110" height="8" rx="4" fill="url(#roadmapGradient)" opacity="0.3" />
    </svg>
);

const ValuesIconSmall = () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="valuesSmall" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" stroke="url(#valuesSmall)" strokeWidth="2" fill="none" />
        <line x1="12" y1="4" x2="12" y2="8" stroke="url(#valuesSmall)" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="16" x2="12" y2="20" stroke="url(#valuesSmall)" strokeWidth="2" strokeLinecap="round" />
        <line x1="4" y1="12" x2="8" y2="12" stroke="url(#valuesSmall)" strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="12" x2="20" y2="12" stroke="url(#valuesSmall)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" fill="url(#valuesSmall)" />
    </svg>
);

const InterestsIconSmall = () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="interestsSmall" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
        </defs>
        <path
            d="M12,21 C12,21 5,15 5,10 C5,7 6,4 9,4 C10.5,4 11.5,5 12,6 C12.5,5 13.5,4 15,4 C18,4 19,7 19,10 C19,15 12,21 12,21 Z"
            fill="url(#interestsSmall)"
        />
    </svg>
);

const PurposeIconSmall = () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="purposeSmall" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" stroke="url(#purposeSmall)" strokeWidth="2" fill="none" />
        <circle cx="12" cy="12" r="6" stroke="url(#purposeSmall)" strokeWidth="2" fill="none" />
        <circle cx="12" cy="12" r="2" fill="url(#purposeSmall)" />
    </svg>
);

const CategoryIconSmall = () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="categorySmall" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
        </defs>
        <rect x="3" y="3" width="8" height="8" rx="2" fill="url(#categorySmall)" opacity="0.8" />
        <rect x="13" y="3" width="8" height="8" rx="2" fill="url(#categorySmall)" opacity="0.8" />
        <rect x="3" y="13" width="8" height="8" rx="2" fill="url(#categorySmall)" opacity="0.8" />
        <rect x="13" y="13" width="8" height="8" rx="2" fill="url(#categorySmall)" opacity="0.8" />
    </svg>
);

const GoalIconSmall = () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="goalSmall" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
        </defs>
        <path
            d="M 12,3 L 14,9 L 20,10 L 15,14 L 17,20 L 12,17 L 7,20 L 9,14 L 4,10 L 10,9 Z"
            fill="url(#goalSmall)"
        />
    </svg>
);

const ActivityIconSmall = () => (
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="activitySmall" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
            </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" fill="url(#activitySmall)" />
        <path
            d="M 7,12 L 10,15 L 17,8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </svg>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function InteractiveToolsSection() {
    const [activeTab, setActiveTab] = useState<'lifeframe' | 'roadmap'>('lifeframe');

    return (
        <section id="tools" className="min-h-screen flex items-center py-12 sm:py-20 relative overflow-hidden" style={{ background: 'radial-gradient(ellipse 60% 50% at 70% 30%, rgba(20,184,166,0.06) 0%, transparent 60%), #07070f', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            {/* Decorative background elements */}
            <div className="absolute top-20 right-10 sm:right-20 w-48 sm:w-64 h-48 sm:h-64 rounded-full opacity-20 blur-3xl" style={{ background: 'rgba(59,130,246,0.15)' }}></div>
            <div className="absolute bottom-20 left-10 sm:left-20 w-48 sm:w-64 h-48 sm:h-64 rounded-full opacity-20 blur-3xl" style={{ background: 'rgba(20,184,166,0.15)' }}></div>

            <div className="max-w-6xl mx-auto px-4 w-full relative z-10">
                <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6" style={{ letterSpacing: '-0.03em' }}>
                        The Tim Collins Framework Tools
                    </h2>
                    <p className="text-base sm:text-xl text-white/45">
                        Interactive frameworks that evolve with you
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
                    <button
                        onClick={() => setActiveTab('lifeframe')}
                        className={`flex items-center gap-2 sm:gap-3 px-5 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-lg transition-all ${activeTab === 'lifeframe'
                            ? 'text-white scale-105'
                            : 'text-white/50 hover:text-white/70'
                            }`}
                        style={activeTab === 'lifeframe' ? { background: 'rgba(20,184,166,0.3)', border: '1px solid rgba(20,184,166,0.4)', boxShadow: '0 0 20px rgba(20,184,166,0.15)' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <div className="w-5 h-5 sm:w-6 sm:h-6">
                            <LifeFrameIcon />
                        </div>
                        LifeFrame
                    </button>
                    <button
                        onClick={() => setActiveTab('roadmap')}
                        className={`flex items-center gap-2 sm:gap-3 px-5 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-lg transition-all ${activeTab === 'roadmap'
                            ? 'text-white scale-105'
                            : 'text-white/50 hover:text-white/70'
                            }`}
                        style={activeTab === 'roadmap' ? { background: 'rgba(59,130,246,0.3)', border: '1px solid rgba(59,130,246,0.4)', boxShadow: '0 0 20px rgba(59,130,246,0.15)' } : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <div className="w-5 h-5 sm:w-6 sm:h-6">
                            <RoadmapIcon />
                        </div>
                        Roadmap
                    </button>
                </div>

                {/* LifeFrame Interactive View */}
                {activeTab === 'lifeframe' && (
                    <div className="animate-fade-in">
                        <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12" style={{ background: 'rgba(20,184,166,0.05)', border: '1px solid rgba(20,184,166,0.15)' }}>
                            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-start">
                                {/* Left: Explanation */}
                                <div>
                                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                                        Your Foundation
                                    </h3>
                                    <p className="text-lg text-white/50 mb-6">
                                        The LifeFrame captures the core elements that define who you are and what matters to you.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(20,184,166,0.08)', borderLeft: '3px solid rgba(20,184,166,0.6)' }}>
                                            <div className="w-6 h-6 flex-shrink-0">
                                                <ValuesIconSmall />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white/90 mb-2">Values</h4>
                                                <p className="text-sm text-white/45">
                                                    Your principles and standards of behavior - the non-negotiables that guide your decisions
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(59,130,246,0.08)', borderLeft: '3px solid rgba(59,130,246,0.6)' }}>
                                            <div className="w-6 h-6 flex-shrink-0">
                                                <InterestsIconSmall />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white/90 mb-2">Interests</h4>
                                                <p className="text-sm text-white/45">
                                                    Activities that energize you and enable you to deploy your creativity to help others
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(168,85,247,0.08)', borderLeft: '3px solid rgba(168,85,247,0.6)' }}>
                                            <div className="w-6 h-6 flex-shrink-0">
                                                <PurposeIconSmall />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white/90 mb-2">Life Categories</h4>
                                                <p className="text-sm text-white/45">
                                                    The key areas of your life, including your Purpose
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-white/30 italic mt-6">
                                        Your LifeFrame evolves as you learn and grow
                                    </p>
                                </div>

                                {/* Right: Interactive Mini LifeFrame */}
                                <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(20,184,166,0.2)' }}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center p-2" style={{ background: 'rgba(20,184,166,0.2)', border: '1px solid rgba(20,184,166,0.3)' }}>
                                            <LifeFrameIcon />
                                        </div>
                                        <h4 className="text-xl font-bold text-white">Sample LifeFrame</h4>
                                    </div>

                                    {/* Values Preview */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-5 h-5">
                                                <ValuesIconSmall />
                                            </div>
                                            <h5 className="font-semibold text-white/80">Values</h5>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {['Continuous Improvement', 'Generosity', 'Honesty', 'Humility', 'Open Mindedness', 'Positivity'].map((value) => (
                                                <span
                                                    key={value}
                                                    className="px-3 py-1 rounded-full text-sm font-medium text-white/60"
                                                    style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)' }}
                                                >
                                                    {value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Interests Preview */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-5 h-5">
                                                <InterestsIconSmall />
                                            </div>
                                            <h5 className="font-semibold text-white/80">Interests</h5>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="rounded-lg px-3 py-2 text-sm text-white/55 flex items-center gap-2" style={{ background: 'rgba(59,130,246,0.08)' }}>
                                                <span>Creative problem solving</span>
                                            </div>
                                            <div className="rounded-lg px-3 py-2 text-sm text-white/55 flex items-center gap-2" style={{ background: 'rgba(59,130,246,0.08)' }}>
                                                <span>Outdoor activities & fitness</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Purpose Preview */}
                                    <div className="rounded-lg p-4" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-5 h-5">
                                                <PurposeIconSmall />
                                            </div>
                                            <h5 className="font-semibold text-white/80">Purpose</h5>
                                        </div>
                                        <p className="text-sm text-white/50 italic">
                                            &quot;Help others discover meaningful work that aligns with their values&quot;
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Roadmap Interactive View */}
                {activeTab === 'roadmap' && (
                    <div className="animate-fade-in">
                        <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
                            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-start">
                                {/* Left: Explanation */}
                                <div>
                                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                                        Your Action Plan
                                    </h3>
                                    <p className="text-lg text-white/50 mb-6">
                                        Transform your LifeFrame into specific, achievable goals with concrete activities.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(59,130,246,0.08)', borderLeft: '3px solid rgba(59,130,246,0.6)' }}>
                                            <div className="w-6 h-6 flex-shrink-0">
                                                <CategoryIconSmall />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white/90 mb-2">Life Categories</h4>
                                                <p className="text-sm text-white/45">
                                                    Health, Career, Relationships, Purpose, etc.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(168,85,247,0.08)', borderLeft: '3px solid rgba(168,85,247,0.6)' }}>
                                            <div className="w-6 h-6 flex-shrink-0">
                                                <GoalIconSmall />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white/90 mb-2">Goals & Behavior Changes</h4>
                                                <p className="text-sm text-white/45">
                                                    Specific outcomes you want to achieve in each category
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(236,72,153,0.08)', borderLeft: '3px solid rgba(236,72,153,0.6)' }}>
                                            <div className="w-6 h-6 flex-shrink-0">
                                                <ActivityIconSmall />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white/90 mb-2">Activities</h4>
                                                <p className="text-sm text-white/45">
                                                    Concrete actions to accomplish your goals (next 3 months)
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-white/30 italic mt-6">
                                        Update your Roadmap every 3-6 months as you progress
                                    </p>
                                </div>

                                {/* Right: Interactive Mini Roadmap */}
                                <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center p-2" style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}>
                                            <RoadmapIcon />
                                        </div>
                                        <h4 className="text-xl font-bold text-white">Sample Roadmap</h4>
                                    </div>

                                    {/* Category: Health */}
                                    <div className="mb-6 pl-4" style={{ borderLeft: '3px solid rgba(34,197,94,0.5)' }}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
                                            <h5 className="font-semibold text-white/80">Health</h5>
                                        </div>

                                        <div className="rounded-lg p-3 mb-3" style={{ background: 'rgba(34,197,94,0.06)' }}>
                                            <p className="text-sm font-semibold text-white/80 mb-2">
                                                Goal: Improve physical fitness
                                            </p>
                                            <div className="space-y-1 text-xs text-white/50 ml-4">
                                                <div className="flex items-start gap-2">
                                                    <div className="w-3 h-3 mt-0.5">
                                                        <ActivityIconSmall />
                                                    </div>
                                                    <span>Exercise 5x per week</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <div className="w-3 h-3 mt-0.5">
                                                        <ActivityIconSmall />
                                                    </div>
                                                    <span>Join HIIT class at local gym</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <div className="w-3 h-3 mt-0.5">
                                                        <ActivityIconSmall />
                                                    </div>
                                                    <span>Track workouts in app</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category: Career */}
                                    <div className="mb-6 pl-4" style={{ borderLeft: '3px solid rgba(59,130,246,0.5)' }}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(59,130,246,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
                                            <h5 className="font-semibold text-white/80">Career</h5>
                                        </div>

                                        <div className="rounded-lg p-3" style={{ background: 'rgba(59,130,246,0.06)' }}>
                                            <p className="text-sm font-semibold text-white/80 mb-2">
                                                Goal: Develop leadership skills
                                            </p>
                                            <div className="space-y-1 text-xs text-white/50 ml-4">
                                                <div className="flex items-start gap-2">
                                                    <div className="w-3 h-3 mt-0.5">
                                                        <ActivityIconSmall />
                                                    </div>
                                                    <span>Lead team project Q1</span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <div className="w-3 h-3 mt-0.5">
                                                        <ActivityIconSmall />
                                                    </div>
                                                    <span>Take management course</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* View Full Roadmap Link */}
                                    <button
                                        className="w-full py-3 rounded-lg font-semibold text-white transition hover:opacity-90"
                                        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.7), rgba(168,85,247,0.7))', boxShadow: '0 0 20px rgba(59,130,246,0.15)' }}
                                    >
                                        Create Your Roadmap →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
