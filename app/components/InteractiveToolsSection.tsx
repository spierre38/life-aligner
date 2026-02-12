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
        <section id="tools" className="min-h-screen flex items-center py-12 sm:py-20 bg-white relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-20 right-10 sm:right-20 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-30 blur-3xl"></div>
            <div className="absolute bottom-20 left-10 sm:left-20 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-br from-teal-100 to-blue-100 rounded-full opacity-30 blur-3xl"></div>

            <div className="max-w-6xl mx-auto px-4 w-full relative z-10">
                <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                        The LifeAligner Tools
                    </h2>
                    <p className="text-base sm:text-xl text-gray-800">
                        Interactive frameworks that evolve with you
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
                    <button
                        onClick={() => setActiveTab('lifeframe')}
                        className={`flex items-center gap-2 sm:gap-3 px-5 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-lg transition-all ${activeTab === 'lifeframe'
                            ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                    >
                        <div className="w-5 h-5 sm:w-6 sm:h-6">
                            <LifeFrameIcon />
                        </div>
                        LifeFrame
                    </button>
                    <button
                        onClick={() => setActiveTab('roadmap')}
                        className={`flex items-center gap-2 sm:gap-3 px-5 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-lg transition-all ${activeTab === 'roadmap'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
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
                        <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 shadow-xl">
                            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-start">
                                {/* Left: Explanation */}
                                <div>
                                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                                        Your Foundation
                                    </h3>
                                    <p className="text-lg text-gray-700 mb-6">
                                        The LifeFrame captures the core elements that define who you are and what matters to you.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="bg-white rounded-xl p-4 border-l-4 border-teal-500 flex items-start gap-3">
                                            <div className="w-6 h-6 flex-shrink-0">
                                                <ValuesIconSmall />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 mb-2">Values</h4>
                                                <p className="text-sm text-gray-800">
                                                    Your principles and standards of behavior - the non-negotiables that guide your decisions
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-xl p-4 border-l-4 border-blue-500 flex items-start gap-3">
                                            <div className="w-6 h-6 flex-shrink-0">
                                                <InterestsIconSmall />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 mb-2">Interests</h4>
                                                <p className="text-sm text-gray-800">
                                                    Activities that energize you and enable you to deploy your creativity to help others
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-xl p-4 border-l-4 border-purple-500 flex items-start gap-3">
                                            <div className="w-6 h-6 flex-shrink-0">
                                                <PurposeIconSmall />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 mb-2">Life Categories</h4>
                                                <p className="text-sm text-gray-800">
                                                    The key areas of your life, including your Purpose
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500 italic mt-6">
                                        Your LifeFrame evolves as you learn and grow
                                    </p>
                                </div>

                                {/* Right: Interactive Mini LifeFrame */}
                                <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-teal-200">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg flex items-center justify-center p-2">
                                            <LifeFrameIcon />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900">Sample LifeFrame</h4>
                                    </div>

                                    {/* Values Preview */}
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-5 h-5">
                                                <ValuesIconSmall />
                                            </div>
                                            <h5 className="font-semibold text-gray-900">Values</h5>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {['Continuous Improvement', 'Generosity', 'Honesty', 'Humility', 'Open Mindedness', 'Positivity'].map((value) => (
                                                <span
                                                    key={value}
                                                    className="bg-gradient-to-r from-teal-100 to-blue-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700"
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
                                            <h5 className="font-semibold text-gray-900">Interests</h5>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-gray-700 flex items-center gap-2">
                                                <span>Creative problem solving</span>
                                            </div>
                                            <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-gray-700 flex items-center gap-2">
                                                <span>Outdoor activities & fitness</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Purpose Preview */}
                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-5 h-5">
                                                <PurposeIconSmall />
                                            </div>
                                            <h5 className="font-semibold text-gray-900">Purpose</h5>
                                        </div>
                                        <p className="text-sm text-gray-700 italic">
                                            "Help others discover meaningful work that aligns with their values"
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
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 shadow-xl">
                            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-start">
                                {/* Left: Explanation */}
                                <div>
                                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                                        Your Action Plan
                                    </h3>
                                    <p className="text-lg text-gray-700 mb-6">
                                        Transform your LifeFrame into specific, achievable goals with concrete activities.
                                    </p>

                                    <div className="space-y-4">
                                        <div className="bg-white rounded-xl p-4 border-l-4 border-blue-500 flex items-start gap-3">
                                            <div className="w-6 h-6 flex-shrink-0">
                                                <CategoryIconSmall />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 mb-2">Life Categories</h4>
                                                <p className="text-sm text-gray-800">
                                                    Health, Career, Relationships, Purpose, etc.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-xl p-4 border-l-4 border-purple-500 flex items-start gap-3">
                                            <div className="w-6 h-6 flex-shrink-0">
                                                <GoalIconSmall />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 mb-2">Goals & Behavior Changes</h4>
                                                <p className="text-sm text-gray-800">
                                                    Specific outcomes you want to achieve in each category
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-xl p-4 border-l-4 border-pink-500 flex items-start gap-3">
                                            <div className="w-6 h-6 flex-shrink-0">
                                                <ActivityIconSmall />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 mb-2">Activities</h4>
                                                <p className="text-sm text-gray-800">
                                                    Concrete actions to accomplish your goals (next 3 months)
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500 italic mt-6">
                                        Update your Roadmap every 3-6 months as you progress
                                    </p>
                                </div>

                                {/* Right: Interactive Mini Roadmap */}
                                <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-blue-200">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center p-2">
                                            <RoadmapIcon />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900">Sample Roadmap</h4>
                                    </div>

                                    {/* Category: Health */}
                                    <div className="mb-6 border-l-4 border-green-500 pl-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xl">💪</span>
                                            <h5 className="font-semibold text-gray-900">Health</h5>
                                        </div>

                                        <div className="bg-green-50 rounded-lg p-3 mb-3">
                                            <p className="text-sm font-semibold text-gray-900 mb-2">
                                                Goal: Improve physical fitness
                                            </p>
                                            <div className="space-y-1 text-xs text-gray-800 ml-4">
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
                                    <div className="mb-6 border-l-4 border-blue-500 pl-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xl">💼</span>
                                            <h5 className="font-semibold text-gray-900">Career</h5>
                                        </div>

                                        <div className="bg-blue-50 rounded-lg p-3">
                                            <p className="text-sm font-semibold text-gray-900 mb-2">
                                                Goal: Develop leadership skills
                                            </p>
                                            <div className="space-y-1 text-xs text-gray-800 ml-4">
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
                                    <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition">
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
